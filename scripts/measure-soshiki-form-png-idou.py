#!/usr/bin/env python3
"""Measure idou-column 新規/解約/変更 text proof crops on soshiki-form-enter.png (§9.7.3)."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PNG = ROOT / "images" / "soshiki-form-enter.png"
MEASURE = ROOT / "measure" / "idou"

# Column interior (PNG 実測: 左罫 x98–101、組合員コード列左罫 x195–197)
IDOU_X1, IDOU_X2 = 102, 194

ROW_BANDS = [
    (1, 448, 519),
    (2, 539, 610),
    (3, 631, 702),
    (4, 722, 793),
    (5, 814, 885),
]


def third_ranges(y1: int, y2: int) -> list[tuple[int, int]]:
    h = y2 - y1 + 1
    t = h // 3
    return [(y1, y1 + t - 1), (y1 + t, y1 + 2 * t - 1), (y1 + 2 * t, y2)]


def main() -> None:
    img = Image.open(PNG).convert("RGB")
    MEASURE.mkdir(parents=True, exist_ok=True)

    print(f"PNG: {PNG} size={img.size}")
    print(f"Idou column interior: x{IDOU_X1}-{IDOU_X2}")
    print()

    for row, y1, y2 in ROW_BANDS:
        proof = MEASURE / f"proof_row{row}_column.png"
        img.crop((90, y1 - 3, 200, y2 + 3)).save(proof)
        print(f"row{row} y{y1}-{y2} -> {proof.relative_to(ROOT)}")
        for label, (a, b) in zip(
            ("shinki", "kaiyaku", "henkou"), third_ranges(y1, y2)
        ):
            cell = MEASURE / f"proof_row{row}_{label}.png"
            img.crop((102, a, 185, b)).save(cell)
            print(f"      {label} y{a}-{b} -> {cell.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
