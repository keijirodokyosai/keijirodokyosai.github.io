#!/usr/bin/env python3
"""Remove printed カナ from member-name rows on soshiki-form-enter.png (§9.7.2, white fill)."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
PNG = ROOT / "images" / "soshiki-form-enter.png"
WHITE = (255, 255, 255)
BG_SUM = 765

# 氏名列・カナ行ラベルセル（縦罫 x387–389 の右側。2026-08-30 実測）
NAME_KANA_LABEL_X1, NAME_KANA_LABEL_X2 = 390, 412
NAME_LABEL_BORDER_X = set(range(387, 390))
GUIDE_X = set(range(291, 294)) | set(range(323, 326))
HORIZ_RULE_X1, HORIZ_RULE_X2 = 390, 419

ROW_BANDS = [
    (448, 519),
    (539, 610),
    (631, 702),
    (722, 793),
    (814, 885),
]


def pixel_sum(img: Image.Image, x: int, y: int) -> int:
    return sum(img.getpixel((x, y)))


def is_horiz_rule_row(img: Image.Image, y: int) -> bool:
    """カナ行と漢字行の間の横罫（x390–419 に 25px 以上）。文字の横画とは幅で区別。"""
    return (
        sum(
            1
            for x in range(HORIZ_RULE_X1, HORIZ_RULE_X2 + 1)
            if pixel_sum(img, x, y) < 750
        )
        >= 25
    )


def kana_text_points(img: Image.Image, y1: int, y2: int) -> list[tuple[int, int]]:
    mid = (y1 + y2) // 2
    pts: list[tuple[int, int]] = []
    for y in range(y1, mid):
        if is_horiz_rule_row(img, y):
            continue
        for x in range(NAME_KANA_LABEL_X1, NAME_KANA_LABEL_X2 + 1):
            if pixel_sum(img, x, y) != BG_SUM:
                pts.append((x, y))
    if not pts:
        raise SystemExit(f"ERROR: no カナ label pixels in y{y1}-{mid - 1}")
    return pts


def border_snapshot(img: Image.Image) -> list[tuple[int, int, int, int, int]]:
    out: list[tuple[int, int, int, int, int]] = []
    for y1, y2 in ROW_BANDS:
        for y in range(y1, y2 + 1):
            for x in NAME_LABEL_BORDER_X:
                out.append((x, y, *img.getpixel((x, y))))
    return out


def horiz_rule_snapshot(img: Image.Image) -> list[tuple[int, int, int, int, int]]:
    out: list[tuple[int, int, int, int, int]] = []
    for y1, y2 in ROW_BANDS:
        mid = (y1 + y2) // 2
        for y in range(y1, mid + 1):
            if is_horiz_rule_row(img, y):
                for x in range(387, HORIZ_RULE_X2 + 1):
                    out.append((x, y, *img.getpixel((x, y))))
    return out


def guide_snapshot(img: Image.Image) -> list[tuple[int, int, int, int, int]]:
    out: list[tuple[int, int, int, int, int]] = []
    for y1, y2 in ROW_BANDS:
        mid = (y1 + y2) // 2
        for y in range(y1, mid):
            for x in GUIDE_X:
                out.append((x, y, *img.getpixel((x, y))))
    return out


def fill_points(img: Image.Image, pts: list[tuple[int, int]]) -> int:
    draw = ImageDraw.Draw(img)
    n = 0
    for x, y in pts:
        if img.getpixel((x, y)) != WHITE:
            draw.point((x, y), fill=WHITE)
            n += 1
    return n


def main() -> None:
    img = Image.open(PNG).convert("RGB")
    before_border = border_snapshot(img)
    before_horiz = horiz_rule_snapshot(img)
    before_guide = guide_snapshot(img)

    measure_dir = ROOT / "measure" / "remove-name-kana"
    measure_dir.mkdir(parents=True, exist_ok=True)

    all_pts: list[tuple[int, list[tuple[int, int]]]] = []
    for row, (y1, y2) in enumerate(ROW_BANDS, start=1):
        pts = kana_text_points(img, y1, y2)
        all_pts.append((row, pts))
        xs = [p[0] for p in pts]
        ys = [p[1] for p in pts]
        x1, x2, ry1, ry2 = min(xs), max(xs), min(ys), max(ys)
        img.crop((x1 - 4, ry1 - 4, x2 + 4, ry2 + 4)).save(
            measure_dir / f"row{row}_kana_BEFORE.png"
        )
        print(f"row{row} カナ points={len(pts)} bbox x{x1}-{x2} y{ry1}-{ry2}")

    total = 0
    for row, pts in all_pts:
        n = fill_points(img, pts)
        total += n
        xs = [p[0] for p in pts]
        ys = [p[1] for p in pts]
        x1, x2, ry1, ry2 = min(xs), max(xs), min(ys), max(ys)
        img.crop((x1 - 4, ry1 - 4, x2 + 4, ry2 + 4)).save(
            measure_dir / f"row{row}_kana_AFTER.png"
        )
        print(f"row{row} filled={n}")

    if border_snapshot(img) != before_border:
        raise SystemExit("ERROR: 氏名列縦罫 (x387–389) changed — aborting save")
    if horiz_rule_snapshot(img) != before_horiz:
        raise SystemExit("ERROR: カナ行横罫 changed — aborting save")
    if guide_snapshot(img) != before_guide:
        raise SystemExit("ERROR: カナ入力ガイド線 (x291–325) changed — aborting save")

    img.save(PNG, optimize=True)
    print(f"saved {PNG} total_filled={total}")


if __name__ == "__main__":
    main()
