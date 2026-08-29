#!/usr/bin/env python3
"""Measure gender-column 1.男 / 2.女 bboxes on soshiki-form-enter.png (§9.7.1)."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PNG = ROOT / "images" / "soshiki-form-enter.png"
MEASURE = ROOT / "measure"

GENDER_X1, GENDER_X2 = 1028, 1088
BORDER_X = set(range(1025, 1028)) | set(range(1089, 1092))
SEIREKI_BOX = (565, 624, 446, 508)
WRONG_1MALE_BOX = (776, 816, 453, 471)  # actually 西暦 — do not use

ROW_BANDS = [
    (1, 448, 519, 453, 469, 484, 499),
    (2, 539, 610, 544, 560, 575, 591),
    (3, 631, 702, 636, 652, 667, 682),
    (4, 722, 793, 727, 743, 758, 773),
    (5, 814, 885, 818, 834, 850, 865),
]


def main() -> None:
    img = Image.open(PNG).convert("RGB")
    MEASURE.mkdir(exist_ok=True)

    print(f"PNG: {PNG} size={img.size}")
    print(f"Gender column interior: x{GENDER_X1}-{GENDER_X2}")
    print(f"Seireki guard box: x{SEIREKI_BOX[0]}-{SEIREKI_BOX[1]} y{SEIREKI_BOX[2]}-{SEIREKI_BOX[3]}")
    print(f"WRONG (seireki): x{WRONG_1MALE_BOX[0]}-{WRONG_1MALE_BOX[1]} - never edit")
    print()

    for row, _y1, _y2, my1, my2, fy1, fy2 in ROW_BANDS:
        mx1, mx2, fx1, fx2 = 1045, 1080, 1044, 1081
        proof = MEASURE / f"proof_row{row}_1male.png"
        img.crop((mx1 - 4, my1 - 4, mx2 + 4, my2 + 4)).save(proof)
        print(f"row{row} 1.男 x{mx1}-{mx2} y{my1}-{my2}  -> {proof.relative_to(ROOT)}")
        print(f"      2.女 x{fx1}-{fx2} y{fy1}-{fy2}")


if __name__ == "__main__":
    main()
