#!/usr/bin/env python3
"""Kartenapp scan benchmark - step 1: sample cards from TCGdex (stratified by rarity/era)
and synthesize realistic phone photos. Images are downloaded at run time into a local
cache OUTSIDE the repo (default /workspace/scanbench). No card images belong in git."""
import argparse, json, os, random, math, urllib.request, urllib.parse, concurrent.futures as cf
import numpy as np, cv2

API = 'https://api.tcgdex.net/v2'
def get(u, binary=False, tries=4):
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': 'kartenapp-scanbench'}), timeout=30) as r:
                b = r.read(); return b if binary else json.loads(b)
        except Exception as e:
            if i == tries - 1: raise
def cached_json(out, name, u):
    p = os.path.join(out, 'cache', name)
    if not os.path.exists(p):
        open(p, 'w').write(json.dumps(get(u)))
    return json.load(open(p))

OLD = ('base', 'neo', 'ex', 'dp', 'bw', 'xy', 'sm', 'swsh', 'gym', 'pl', 'hgss', 'col', 'lc', 'ecard')
def sid(cid): return cid.rsplit('-', 1)[0]
def is_pocket(s): return s[:1] in 'AB' and any(ch.isdigit() for ch in s[:3]) or s.startswith('P-')
CATS = {  # name: (count, rarities or None, set predicate)
    'modern_normal': (90, ['Common', 'Uncommon', 'Rare'], lambda s: (s.startswith('sv') or s.startswith('me')) and not s.startswith('svp')),
    'holo_rare':     (70, ['Rare Holo', 'Holo Rare', 'Double rare'], lambda s: s.startswith(('sv', 'swsh', 'sm', 'me'))),
    'fullart_ultra': (70, ['Ultra Rare', 'Full Art Trainer', 'Holo Rare V', 'Holo Rare VMAX', 'Holo Rare VSTAR', 'Secret Rare', 'Hyper rare', 'Mega Hyper Rare'], lambda s: s.startswith(('sv', 'swsh', 'sm', 'me'))),
    'sir_ir':        (70, ['Special illustration rare', 'Illustration rare'], lambda s: True),
    'old':           (90, ['Common', 'Uncommon', 'Rare', 'Rare Holo'], lambda s: s.startswith(OLD) and not s.startswith(('sv', 'me'))),
}

def sample(out, seed):
    rnd = random.Random(seed); picked = []; seen = set()
    for cat, (n, rars, pred) in CATS.items():
        pool = []
        for r in rars:
            for c in cached_json(out, 'r-' + r.replace(' ', '_') + '.json', f"{API}/en/cards?rarity={urllib.parse.quote(r)}"):
                s = sid(c['id'])
                if c.get('image') and pred(s) and not is_pocket(s) and c['id'] not in seen and s != '30th' and not s.startswith('30th'):
                    pool.append(dict(c, rarity=r))
        rnd.shuffle(pool)
        for c in pool[:n]: seen.add(c['id']); picked.append(dict(id=c['id'], name=c['name'], localId=c['localId'], rarity=c['rarity'], lang='en', cat=cat, image=c['image']))
    allen = cached_json(out, 'all-en.json', f"{API}/en/cards")
    p30 = [c for c in allen if sid(c['id']).startswith('30th') and c.get('image')]; rnd.shuffle(p30)
    for c in p30[:40]: picked.append(dict(id=c['id'], name=c['name'], localId=c['localId'], rarity='', lang='en', cat='30th', image=c['image']))
    allja = cached_json(out, 'all-ja.json', f"{API}/ja/cards")
    pj = [c for c in allja if c.get('image') and not is_pocket(sid(c['id']))]; rnd.shuffle(pj)
    for c in pj[:50]: picked.append(dict(id=c['id'], name=c['name'], localId=c['localId'], rarity='', lang='ja', cat='jp', image=c['image']))
    return picked

def fetch_img(out, c):
    p = os.path.join(out, 'cache', 'img', c['id'].replace('/', '_') + ('.ja' if c['lang'] == 'ja' else '') + '.png')
    if not os.path.exists(p) or os.path.getsize(p) < 1000:
        try: open(p, 'wb').write(get(c['image'] + '/high.png', binary=True))
        except Exception: return None
    return p

# ---------- photo synthesis ----------
def background(rng, W, H):
    kind = rng.integers(4); base = rng.integers(20, 230, 3).astype(np.float32)
    img = np.ones((H, W, 3), np.float32) * base
    if kind == 0:   # wood-ish streaks
        n = cv2.resize(rng.normal(0, 1, (H // 8, 8)).astype(np.float32), (W, H)); img += n[..., None] * rng.uniform(8, 25)
    elif kind == 1: # cloth / mat noise
        n = cv2.GaussianBlur(rng.normal(0, 1, (H, W)).astype(np.float32), (0, 0), 2); img += n[..., None] * 30
    elif kind == 2: # gradient (desk lamp)
        g = np.linspace(rng.uniform(.6, 1), rng.uniform(1, 1.3), W, dtype=np.float32)[None, :, None]; img *= g
    else:          # tiles/grid
        img[::rng.integers(60, 160), :] *= .7; img[:, ::rng.integers(60, 160)] *= .7
    return np.clip(img, 0, 255)

def photo(card, rng, ui=False, cutoff=False):
    W, H = 1080, 1440
    bg = background(rng, W, H)
    ch, cw = card.shape[:2]
    fill = rng.uniform(.5, .8)                      # card height share of frame
    s = fill * H / ch
    if cw * s > .92 * W: s = .92 * W / cw
    w2, h2 = cw * s, ch * s
    cx = W / 2 + rng.uniform(-.06, .06) * W; cy = H / 2 + rng.uniform(-.05, .05) * H
    if cutoff: cy = H - h2 * rng.uniform(.32, .40)  # bottom 10-18 % of card (number line) out of frame
    rot = math.radians(rng.uniform(-5, 5)); t = math.tan(math.radians(rng.uniform(0, 8)))
    pts = np.array([[-w2/2, -h2/2], [w2/2, -h2/2], [w2/2, h2/2], [-w2/2, h2/2]], np.float32)
    # perspective tilt: shrink top or bottom/left or right edge
    if rng.random() < .5: k = 1 - t * rng.choice([-1, 1]); pts[:2, 0] *= k
    else: k = 1 - t * rng.choice([-1, 1]); pts[[1, 2], 1] *= k
    R = np.array([[math.cos(rot), -math.sin(rot)], [math.sin(rot), math.cos(rot)]], np.float32)
    dst = pts @ R.T + [cx, cy]
    src = np.array([[0, 0], [cw, 0], [cw, ch], [0, ch]], np.float32)
    M = cv2.getPerspectiveTransform(src, dst.astype(np.float32))
    rgb = card[..., :3].astype(np.float32)
    alpha = card[..., 3:4].astype(np.float32) / 255 if card.shape[2] == 4 else np.ones((ch, cw, 1), np.float32)
    warp = cv2.warpPerspective(rgb, M, (W, H)); a = cv2.warpPerspective(alpha, M, (W, H))[..., None]
    # soft shadow
    sh = cv2.GaussianBlur(a[..., 0], (0, 0), 12)[..., None]; sh = np.roll(sh, (12, 8), (0, 1))
    img = bg * (1 - .45 * sh); img = img * (1 - a) + warp * a
    # glare spot
    gx, gy = cx + rng.uniform(-.3, .3) * w2, cy + rng.uniform(-.35, .35) * h2
    yy, xx = np.mgrid[0:H, 0:W]; r = rng.uniform(.08, .2) * w2
    g = np.exp(-(((xx - gx) / (r * rng.uniform(1, 2.5))) ** 2 + ((yy - gy) / r) ** 2)).astype(np.float32)
    img += g[..., None] * a * rng.uniform(60, 150)
    # white balance / exposure
    img *= rng.uniform(.88, 1.12, 3).astype(np.float32) * rng.uniform(.85, 1.1)
    img = cv2.GaussianBlur(img, (0, 0), rng.uniform(.5, 1.5))
    img += rng.normal(0, rng.uniform(3, 8), img.shape).astype(np.float32)
    img = np.clip(img, 0, 255).astype(np.uint8)
    if ui: img = ui_wrap(img, rng)
    return img

def ui_wrap(img, rng):
    """Fake phone screenshot: status bar, app header, viewfinder w/ yellow frame, buttons, nav bar."""
    SW, SH = 1080, 2340
    dark = rng.random() < .6
    scr = np.full((SH, SW, 3), (24, 24, 28) if dark else (245, 245, 247), np.uint8)
    fg = (240, 240, 240) if dark else (20, 20, 20)
    cv2.putText(scr, '16:%02d' % rng.integers(60), (40, 60), cv2.FONT_HERSHEY_SIMPLEX, 1.4, fg, 3)
    cv2.putText(scr, '5G  87%', (820, 60), cv2.FONT_HERSHEY_SIMPLEX, 1.2, fg, 2)
    cv2.rectangle(scr, (0, 100), (SW, 230), (40, 90, 200), -1)
    cv2.putText(scr, 'Kartenapp - Scan', (40, 185), cv2.FONT_HERSHEY_SIMPLEX, 2, (255, 255, 255), 4)
    top = 270; vh = int(SW * img.shape[0] / img.shape[1])
    scr[top:top + vh] = cv2.resize(img, (SW, vh))
    if rng.random() < .8:  # yellow scan frame overlay
        fx0, fy0 = int(SW * .15), top + int(vh * .1); cv2.rectangle(scr, (fx0, fy0), (SW - fx0, top + int(vh * .9)), (0, 210, 255), 6)
        cv2.putText(scr, 'Karte im Rahmen platzieren', (fx0 + 20, fy0 - 20), cv2.FONT_HERSHEY_SIMPLEX, 1.1, (255, 255, 255), 2)
    y = top + vh + 40
    for i, t in enumerate(['Scannen', 'Foto', 'Bild hochladen']):
        x0 = 40 + i * 340; cv2.rectangle(scr, (x0, y), (x0 + 310, y + 120), (60, 140, 255) if i == 0 else (90, 90, 100), -1)
        cv2.putText(scr, t, (x0 + 20, y + 75), cv2.FONT_HERSHEY_SIMPLEX, 1.1, (255, 255, 255), 2)
    cv2.rectangle(scr, (0, SH - 200), (SW, SH), (35, 35, 40) if dark else (230, 230, 235), -1)
    for i, t in enumerate(['Portfolio', 'Suche', 'Scan', 'Wunsch', 'Mehr']):
        cv2.putText(scr, t, (30 + i * 210, SH - 90), cv2.FONT_HERSHEY_SIMPLEX, 1, fg, 2)
    return scr

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', default='/workspace/scanbench'); ap.add_argument('--seed', type=int, default=42)
    ap.add_argument('--ui', type=int, default=60, help='extra scans with app-UI screenshot overlay')
    ap.add_argument('--cutoff', type=int, default=60, help='extra scans with bottom (number) cut off')
    ap.add_argument('--limit', type=int, default=0)
    a = ap.parse_args()
    for d in ('cache', 'cache/img', 'photos'): os.makedirs(os.path.join(a.out, d), exist_ok=True)
    cards = sample(a.out, a.seed)
    if a.limit: random.Random(a.seed).shuffle(cards); cards = cards[:a.limit]
    with cf.ThreadPoolExecutor(16) as ex: paths = list(ex.map(lambda c: fetch_img(a.out, c), cards))
    rnd = random.Random(a.seed + 1); jobs = []
    for c, p in zip(cards, paths):
        if p: jobs.append(dict(c, variant='photo', src=p))
    base = [j for j in jobs]
    for v, n in (('ui', a.ui), ('cutoff', a.cutoff)):
        for j in rnd.sample(base, min(n, len(base))): jobs.append(dict(j, variant=v))
    def make(ij):
        i, j = ij; rng = np.random.default_rng(a.seed * 100003 + i)
        card = cv2.imread(j['src'], cv2.IMREAD_UNCHANGED)
        if card is None: return None
        if card.ndim == 2: card = cv2.cvtColor(card, cv2.COLOR_GRAY2BGR)
        img = photo(card, rng, ui=j['variant'] == 'ui', cutoff=j['variant'] == 'cutoff')
        fn = os.path.join(a.out, 'photos', '%04d_%s_%s.jpg' % (i, j['variant'], j['id'].replace('/', '_')))
        cv2.imwrite(fn, img, [cv2.IMWRITE_JPEG_QUALITY, int(rng.integers(60, 81))])
        return dict({k: v for k, v in j.items() if k != 'src'}, photo=fn, scan_id=i)
    with cf.ThreadPoolExecutor(os.cpu_count()) as ex: man = [m for m in ex.map(make, enumerate(jobs)) if m]
    json.dump(man, open(os.path.join(a.out, 'manifest.json'), 'w'), ensure_ascii=False, indent=0)
    from collections import Counter
    print(len(man), 'photos', Counter(m['cat'] for m in man), Counter(m['variant'] for m in man))

if __name__ == '__main__': main()
