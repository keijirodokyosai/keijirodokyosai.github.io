#!/usr/bin/env python3
"""Measure 備考欄 on soshiki-form-enter.png (§5.8).

対象 = フッター右の「備考」矩形枠（外側黒罫）。左 x898・右 x1601・上 y934・下 y1120。
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
PNG = ROOT / "images" / "soshiki-form-enter.png"
MEASURE = ROOT / "measure" / "biko"
INSET = 2

# 2026-09-02 実測（1684×1191）
BIKO_BORDER = (898, 934, 1601, 1120)  # 704×187 px


def inner(border: tuple[int, int, int, int]) -> tuple[int, int, int, int]:
    x0, y0, x1, y1 = border
    return x0 + INSET, y0 + INSET, x1 - INSET, y1 - INSET


def to_css_outer(border: tuple[int, int, int, int], w: int, h: int) -> dict[str, str]:
    x0, y0, x1, y1 = border
    bw, bh = x1 - x0 + 1, y1 - y0 + 1
    return {
        "left": f"{x0 / w * 100:.3f}%",
        "top": f"{y0 / h * 100:.3f}%",
        "width": f"{bw / w * 100:.3f}%",
        "height": f"{bh / h * 100:.3f}%",
    }


def main() -> None:
    img = Image.open(PNG).convert("RGB")
    w, h = img.size
    MEASURE.mkdir(parents=True, exist_ok=True)

    inner_border = inner(BIKO_BORDER)
    x0, y0, x1, y1 = BIKO_BORDER
    ix0, iy0, ix1, iy1 = inner_border
    bw, bh = x1 - x0 + 1, y1 - y0 + 1
    css = to_css_outer(BIKO_BORDER, w, h)

    o = img.copy()
    d = ImageDraw.Draw(o)
    d.rectangle(BIKO_BORDER, outline="red", width=2)
    d.rectangle(inner_border, outline="lime", width=2)
    o.crop((850, 900, 1650, 1191)).save(MEASURE / "PROOF_biko_overlay.png")

    print(f"備考 outer: x{x0}-{x1} y{y0}-{y1} ({bw}×{bh}px)")
    print(f"  inner (padding {INSET}px): x{ix0}-{ix1} y{iy0}-{iy1}")
    print(f"  left={css['left']} top={css['top']}")
    print(f"  width={css['width']} height={css['height']}")
    print(f"-> {MEASURE / 'PROOF_biko_overlay.png'}")


if __name__ == "__main__":
    main()
