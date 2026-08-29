#!/usr/bin/env python3
"""Measure member-name カナ label bboxes on soshiki-form-enter.png (§9.7.2)."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PNG = ROOT / "images" / "soshiki-form-enter.png"
MEASURE = ROOT / "measure"

NAME_KANA_LABEL_X1, NAME_KANA_LABEL_X2 = 390, 412
BG_SUM = 765

ROW_BANDS = [
    (1, 448, 519, 453, 470),
    (2, 539, 610, 544, 561),
    (3, 631, 702, 636, 653),
    (4, 722, 793, 727, 744),
    (5, 814, 885, 819, 836),
]


def main() -> None:
    img = Image.open(PNG).convert("RGB")
    MEASURE.mkdir(exist_ok=True)

    print(f"PNG: {PNG} size={img.size}")
    print(f"Name カナ label cell interior: x{NAME_KANA_LABEL_X1}-{NAME_KANA_LABEL_X2}")
    print(f"Vertical border (do not edit): x387-389")
    print()

    for row, _y1, _y2, ry1, ry2 in ROW_BANDS:
        proof = MEASURE / f"proof_row{row}_name_kana.png"
        img.crop((NAME_KANA_LABEL_X1 - 4, ry1 - 4, NAME_KANA_LABEL_X2 + 4, ry2 + 4)).save(proof)
        print(
            f"row{row} カナ x{NAME_KANA_LABEL_X1}-{NAME_KANA_LABEL_X2} "
            f"y{ry1}-{ry2}  -> {proof.relative_to(ROOT)}"
        )


if __name__ == "__main__":
    main()
