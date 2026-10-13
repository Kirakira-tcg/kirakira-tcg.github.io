#!/usr/bin/env bash
# Kartenapp Scan-Benchmark: Stichprobe ziehen + Fotos erzeugen, durch die Live-App schicken, auswerten.
# Bilder landen NUR im Arbeitsordner (Standard /workspace/scanbench), nie im Repo.
set -euo pipefail
OUT="${OUT:-/workspace/scanbench}"; WORKERS="${WORKERS:-4}"; SEED="${SEED:-42}"; URL="${URL:-https://jayezhdtwitch.github.io/kartenapp/}"
D="$(cd "$(dirname "$0")" && pwd)"
pip install -q opencv-python-headless numpy playwright 2>/dev/null || pip install -q --break-system-packages opencv-python-headless numpy playwright
python3 -m playwright install chromium >/dev/null
mkdir -p "$OUT"
[ -f "$OUT/manifest.json" ] && [ -z "${REGEN:-}" ] || python3 "$D/gen.py" --out "$OUT" --seed "$SEED" ${GEN_ARGS:-}
python3 "$D/run_bench.py" --out "$OUT" --workers "$WORKERS" --url "$URL" ${RUN_ARGS:-}
python3 "$D/report.py" --out "$OUT"
echo "Fertig: $OUT/summary.md, $OUT/results_scored.csv"
