#!/usr/bin/env python3
"""Remove printed 1.男 / 2.女 from soshiki-form-enter.png (§9.7.1, white fill)."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
PNG = ROOT / "images" / "soshiki-form-enter.png"
WHITE = (255, 255, 255)

# Column interior (from header 性別 + row1 vertical lines x1026 / x1090)
GENDER_X1, GENDER_X2 = 1028, 1088
BORDER_X = set(range(1025, 1028)) | set(range(1089, 1092))
SEIREKI_BOX = (565, 624, 446, 508)

ROW_BANDS = [
    (448, 519),
    (539, 610),
    (631, 702),
    (722, 793),
    (814, 885),
]


def is_dark(img: Image.Image, x: int, y: int, thresh: int = 700) -> bool:
    return sum(img.getpixel((x, y))) < thresh


def is_horiz_rule_row(img: Image.Image, y: int) -> bool:
    return sum(1 for x in range(GENDER_X1, GENDER_X2 + 1) if is_dark(img, x, y)) > 80


def text_points(img: Image.Image, y1: int, y2: int) -> list[tuple[int, int]]:
    pts: list[tuple[int, int]] = []
    for y in range(y1, y2 + 1):
        if is_horiz_rule_row(img, y):
            continue
        for x in range(GENDER_X1, GENDER_X2 + 1):
            if x in BORDER_X:
                continue
            if is_dark(img, x, y):
                pts.append((x, y))
    return pts


def half_rects(img: Image.Image, y1: int, y2: int) -> tuple[tuple[int, int, int, int], tuple[int, int, int, int]]:
    mid = (y1 + y2) // 2
    female_pts = text_points(img, mid + 1, y2)
    if not female_pts:
        raise SystemExit(f"ERROR: no 2.女 pixels in y{y1}-{y2}")
    fxs = [p[0] for p in female_pts]
    fys = [p[1] for p in female_pts]
    female = (min(fxs), max(fxs), min(fys), max(fys))

    male_pts = [p for p in text_points(img, y1, mid) if p[1] < female[2]]
    if not male_pts:
        raise SystemExit(f"ERROR: no 1.男 pixels in y{y1}-{y2}")
    mxs = [p[0] for p in male_pts]
    mys = [p[1] for p in male_pts]
    male = (min(mxs), max(mxs), min(mys), max(mys))
    return male, female


def seireki_snapshot(img: Image.Image) -> list[tuple[int, int, int, int, int]]:
    x1, x2, y1, y2 = SEIREKI_BOX
    return [(x, y, *img.getpixel((x, y))) for y in range(y1, y2 + 1) for x in range(x1, x2 + 1)]


def fill_rect(img: Image.Image, rect: tuple[int, int, int, int]) -> int:
    x1, x2, y1, y2 = rect
    draw = ImageDraw.Draw(img)
    n = 0
    for y in range(y1, y2 + 1):
        for x in range(x1, x2 + 1):
            if img.getpixel((x, y)) != WHITE:
                draw.point((x, y), fill=WHITE)
                n += 1
    return n


def main() -> None:
    img = Image.open(PNG).convert("RGB")
    before_seireki = seireki_snapshot(img)

    measure_dir = ROOT / "measure" / "remove"
    measure_dir.mkdir(parents=True, exist_ok=True)

    total = 0
    rects: list[tuple[str, int, tuple[int, int, int, int]]] = []

    for row, (y1, y2) in enumerate(ROW_BANDS, start=1):
        male, female = half_rects(img, y1, y2)
        rects.append(("1.男", row, male))
        rects.append(("2.女", row, female))

        for label, r in (("1male", male), ("2female", female)):
            x1, x2, ry1, ry2 = r
            img.crop((x1 - 3, ry1 - 3, x2 + 3, ry2 + 3)).save(
                measure_dir / f"row{row}_{label}_BEFORE.png"
            )

    for label, row, (x1, x2, y1, y2) in rects:
        n = fill_rect(img, (x1, x2, y1, y2))
        total += n
        print(f"row{row} {label} x{x1}-{x2} y{y1}-{y2} filled={n}")

    after_seireki = seireki_snapshot(img)
    if before_seireki != after_seireki:
        raise SystemExit("ERROR: 西暦 area changed — aborting save")

    img.save(PNG, optimize=True)
    print(f"saved {PNG} total_filled={total} seireki OK")


if __name__ == "__main__":
    main()
