#!/usr/bin/env python3
"""Measure 前月残・月計 boxes on soshiki-form-enter.png (§5.7).

対象 = 「人」左の正方形に近い黒枠（ラベル文字ではない）。
左罫 x507 の縦線は y958–996（外枠 49×39 px）。y963–974 の薄い線は誤認注意。
グループは外枠に合わせ、padding 2px で内側に入力。PROOF_outer958.png を目視確認。
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
PNG = ROOT / "images" / "soshiki-form-enter.png"
MEASURE = ROOT / "measure" / "zengetsu"
INSET = 2

# 2026-08-31 実測（1684×1191）。左罫 x507 y958–996。
ZAN_BORDER = (508, 958, 556, 996)  # 49×39 px
TSUKI_KEI_BORDER = (680, 958, 728, 996)  # 49×39 px


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

    o = img.copy()
    d = ImageDraw.Draw(o)

    for label, border, outer_color in (
        ("zengetsu_zan", ZAN_BORDER, "red"),
        ("tsuki_kei", TSUKI_KEI_BORDER, "blue"),
    ):
        inner_border = inner(border)
        x0, y0, x1, y1 = border
        ix0, iy0, ix1, iy1 = inner_border
        bw, bh = x1 - x0 + 1, y1 - y0 + 1
        ibw, ibh = ix1 - ix0 + 1, iy1 - iy0 + 1
        css = to_css_outer(border, w, h)

        d.rectangle(border, outline=outer_color, width=2)
        d.rectangle(inner_border, outline="lime", width=2)

        print(f"{label} outer: x{x0}-{x1} y{y0}-{y1} ({bw}×{bh}px)")
        print(f"  inner (padding {INSET}px): x{ix0}-{ix1} y{iy0}-{iy1} ({ibw}×{ibh}px)")
        print(f"  group left={css['left']} top={css['top']}")
        print(f"  group width={css['width']} height={css['height']}")
        print()

    o.crop((490, 900, 780, 1015)).save(MEASURE / "PROOF_outer958.png")
    print(f"-> {MEASURE / 'PROOF_outer958.png'}")


if __name__ == "__main__":
    main()
