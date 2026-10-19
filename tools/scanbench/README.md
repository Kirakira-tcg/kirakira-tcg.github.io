# Scan-Benchmark (Regressionstest für den Karten-Scan)

Misst den echten Scan-Pfad der Live-App („🖼️ Bild hochladen“) mit ~600 synthetischen Handyfotos.
Damit sieht man nach jeder Scan- oder Fingerabdruck-Änderung, ob es für **alle** Kartentypen besser wird und nicht nur für die gerade getesteten Karten.

**Urheberrecht:** Im Repo liegen keine Kartenbilder. Die TCGdex-Bilder werden beim Lauf in einen lokalen Cache geladen (`$OUT/cache/img`), die Fotos landen in `$OUT/photos`.

## Ausführen
```bash
tools/scanbench/run.sh                        # Standard: OUT=/workspace/scanbench, 4 parallele Seiten, Seed 42
REGEN=1 SEED=7 tools/scanbench/run.sh         # neue Stichprobe
RUN_ARGS="--limit 40" tools/scanbench/run.sh  # Schnelltest
URL=http://localhost:8000/ tools/scanbench/run.sh   # lokalen Stand testen, bevor er live geht
```
Dauer: etwa 20 bis 25 Minuten für 600 Scans mit 4 Seiten auf 8 Kernen. Bei mehr Seiten konkurrieren die Tesseract-Läufe um die CPU. Dann greift das 5-s-Zeitlimit der App öfter, und das Ergebnis wird schlechter, als es auf einem Handy wäre.

## Schritte
1. `gen.py`: zieht eine Stichprobe über das TCGdex-Feld `rarity`. Kategorien: modern_normal (sv/me C/U/R) 90, holo_rare 70, fullart_ultra 70, sir_ir 70, old (base…swsh) 90, 30th 40, jp (TCGdex ja) 50. Daraus macht es pro Karte ein Foto: zufälliger Untergrund, Neigung bis 8°, Drehung ±5°, Karte füllt 50–80 % der Höhe, Schatten, Lichtfleck, Weißabgleich/Belichtung, Unschärfe 0,5–1,5, Rauschen, JPEG q60–80. Dazu kommen 60 Fotos als App-Screenshot (`ui`) und 60 mit abgeschnittenem unterem Rand ohne Nummer (`cutoff`). Ergebnis: `manifest.json`.
2. `run_bench.py`: lädt die Live-App mit 400px-Viewport in mehreren Seiten, setzt den Zustand vor jedem Scan zurück und lädt das Foto über `#uploadFile` hoch. `analyze`, `analyze0`, `nmCands` und `attachImgFallback` werden nur zum Mitlesen umwickelt, die App selbst bleibt unverändert. Erfasst werden Ausgang (`auto_img`, `auto_ocr`, `picker` oder `none`), die übernommene ID, die Kandidaten im Sheet in Anzeigereihenfolge, die Zeit bis zum Ergebnis, OCR-Name, OCR-Nummer und die Top 5 des Bildvergleichs. Ergebnis: `results.csv`.
3. `report.py`: wertet aus und schreibt `summary.md` und `results_scored.csv`.
   - Richtig ist nur eine übernommene ID, die genau der echten entspricht (Nummer ohne führende Nullen).
   - Falsche Übernahmen mit gleichem Namen oder JP→EN mit gleichem Artwork werden extra als „Reprint/Sprache“ gezählt.
   - Bei Karten, die nicht übernommen wurden, wird die Ursache bestimmt: kein Fingerabdruck, Bildvergleich auf Platz 1 aber unter der Schwelle, Top 5 oder verfehlt.

Wichtigste Kennzahl: **falsch auto** sollte ≈ 0 sein. Eine falsche Karte, die automatisch übernommen wird, ist schlimmer als eine Auswahl.

## Spalten (v185)
- `ocr_name` / `ocr_number`: rohes `analyze0`-Ergebnis. Der Name steht in der EN-Suchform (`deName`, z. B. Quaputzi → Poliwhirl), die Nummer vor der Gesamtzahl-Korrektur im Auswahlblatt (130/102 → 13).
- `ui_name` / `ui_num`: Felder im Auswahlblatt, `ui_status_num`: Nummer aus der Statuszeile, `tile1`: erste Kachel – das sieht der Nutzer. `ui_num_ok` bewertet diese Nummer.
- `true_lang` kommt aus `plang` (sonst TCGdex-Sprache). Bei echten Fotos `plang` setzen (z. B. DE-Grundset-Foto), sonst zählt das Blatt als falsche Sprache.
