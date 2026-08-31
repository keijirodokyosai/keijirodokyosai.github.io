#!/usr/bin/env python3
"""Measure 前月残・月計 boxes on soshiki-form-enter.png (§5.7).

対象 = 「前月残」「月計」ラベルの下〜フッター罫線上までの入力枠（「人」の左）。
60×23px など底辺だけの値は誤り。目視で CORRECT_boxes.png を確認すること。
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
PNG = ROOT / "images" / "soshiki-form-enter.png"
MEASURE = ROOT / "measure" / "zengetsu"

# PNG 1684×1191。ラベル直下 y964 〜 底辺 y996
ZAN_BORDER = (510, 964, 579, 996)  # 70×33px
TSUKI_KEI_BORDER = (680, 964, 771, 996)  # 92×33px


def main() -> None:
    img = Image.open(PNG).convert("RGB")
    w, h = img.size
    MEASURE.mkdir(parents=True, exist_ok=True)

    o = img.copy()
    d = ImageDraw.Draw(o)
    css_fields: list[tuple[float, float, float, float, str]] = []

    for label, border, color in (
        ("zengetsu_zan", ZAN_BORDER, "lime"),
        ("tsuki_kei", TSUKI_KEI_BORDER, "cyan"),
    ):
        x0, y0, x1, y1 = border
        bw, bh = x1 - x0 + 1, y1 - y0 + 1
        d.rectangle(border, outline=color, width=2)
        left_pct = x0 / w * 100
        top_pct = y0 / h * 100
        width_pct = bw / w * 100
        height_pct = bh / h * 100
        css_fields.append((left_pct, top_pct, width_pct, height_pct, color))
        print(f"{label}: x{x0}-{x1} y{y0}-{y1} ({bw}×{bh}px)")
        print(f"  left={left_pct:.3f}% top={top_pct:.3f}%")
        print(f"  width={width_pct:.3f}% height={height_pct:.3f}%")
        print()

    o.crop((500, 928, 800, 1010)).save(MEASURE / "CORRECT_boxes.png")
    verify = img.copy()
    dv = ImageDraw.Draw(verify)
    for left, top, width, height, color in css_fields:
        x0 = round(w * left / 100)
        y0 = round(h * top / 100)
        x1 = round(x0 + w * width / 100)
        y1 = round(y0 + h * height / 100)
        dv.rectangle((x0, y0, x1, y1), outline=color, width=2)
    verify.crop((500, 928, 800, 1010)).save(MEASURE / "VERIFY_css_on_png.png")
    print(f"-> {MEASURE / 'CORRECT_boxes.png'}")


if __name__ == "__main__":
    main()
