#!/usr/bin/env python3
"""Measure ページ枚数 slash box on soshiki-form-enter.png."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PNG = ROOT / "images" / "soshiki-form-enter.png"
MEASURE = ROOT / "measure" / "page-count"

# Gray box with printed "/" (PNG 実測: 左罫 x450–453、右 x499、上 y933–936、下 y995–997)
BOX_X1, BOX_X2 = 450, 499
BOX_Y1, BOX_Y2 = 933, 997
INSET = 2


def main() -> None:
    img = Image.open(PNG).convert("RGB")
    w, h = img.size
    MEASURE.mkdir(parents=True, exist_ok=True)

    proof = MEASURE / "proof_page_count_box.png"
    img.crop((BOX_X1 - 40, BOX_Y1 - 30, BOX_X2 + 40, BOX_Y2 + 20)).save(proof)

    inner_x1 = BOX_X1 + INSET
    inner_x2 = BOX_X2 - INSET
    inner_y1 = BOX_Y1 + INSET
    inner_y2 = BOX_Y2 - INSET

    print(f"PNG: {PNG} size={w}x{h}")
    print(f"Box border: x{BOX_X1}-{BOX_X2} y{BOX_Y1}-{BOX_Y2}")
    print(f"Inner (input overlay): x{inner_x1}-{inner_x2} y{inner_y1}-{inner_y2}")
    print()
    print("Percent (sheet):")
    print(f"  left   = {inner_x1 / w * 100:.3f}%")
    print(f"  top    = {inner_y1 / h * 100:.3f}%")
    print(f"  width  = {(inner_x2 - inner_x1) / w * 100:.3f}%")
    print(f"  height = {(inner_y2 - inner_y1) / h * 100:.3f}%")
    print(f"  -> {proof.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
