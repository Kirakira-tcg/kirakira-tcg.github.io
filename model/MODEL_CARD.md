# Kartenapp – Kartenerkennungsmodell (v116)

**Inoffizielles Fanprojekt.** Nicht verbunden mit The Pokémon Company, Nintendo, Creatures oder GAME FREAK.

## Was ist das?
Ein kleines Bild-Embedding-Modell, das ein Foto einer Sammelkarte in einen 128-dimensionalen Vektor umrechnet.
Die App vergleicht diesen Vektor mit vorberechneten Vektoren pro Set (`emb/`) und zeigt die ähnlichsten Karten
als **Vorschlagsliste** an. Das Modell übernimmt Karten nie selbst automatisch.

## Dateien
- `model_fp16.onnx` – Modellgewichte (ONNX, float16, ca. 6 MB)
- `emb/index.json`, `emb/intl/*.bin`, `emb/ja/*.bin` – Embeddings je Set (int8, nur Zahlenvektoren und Kartennummer)
- `cardmodel.js` – Laufzeit im Browser (onnxruntime-web)
- `LICENSE` – Apache License 2.0 des Basismodells

## Herkunft
- Basismodell: MobileNetV3 Large (`mobilenetv3_large_100.ra_in1k`, timm), Lizenz **Apache-2.0** (siehe `LICENSE`).
- Feintuning auf Kartenbildern von TCGdex und pokemontcg.io. Vor dem Training wurde geprüft, ob Text- und Data-Mining
  in deren Bedingungen oder per robots.txt ausgeschlossen ist (TDM-Prüfung); ein Ausschluss wurde nicht gefunden.
- **Nicht enthalten:** keine Trainingsbilder, keine Kartenbilder, keine Testfotos (auch keine eBay- oder echten Fotos).

## Hinweise
- Die Kartenbilder selbst sind urheberrechtlich geschützt (laut TCGdex lizenziert von The Pokémon Company); sie werden hier nicht verbreitet.
- Eine rechtliche Prüfung vor einem kommerziellen Start steht noch aus.
