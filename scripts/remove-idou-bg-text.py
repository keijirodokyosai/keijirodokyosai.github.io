#!/usr/bin/env python3
"""Remove printed 新規/解約/変更 and dotted ovals from idou column (§9.7.3).

Removes all dark pixels in column interior (x102–194) within each member-row zone
(between solid horizontal rules, including lower tail where 変更 sat). Vertical
borders x98–101 / x195–197 and header「異動内容」are never touched.
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
PNG = ROOT / "images" / "soshiki-form-enter.png"
WHITE = (255, 255, 255)

# 異動内容列（PNG 1684×1191 実測）
IDOU_COL_LEFT_BORDER = set(range(98, 102))
IDOU_COL_RIGHT_BORDER = set(range(195, 198))
IDOU_X1, IDOU_X2 = 102, 194

# ヘッダー「異動内容」（触れない）
IDOU_HEADER_BOX = (98, 194, 410, 432)

# 列内側 x102–194 がほぼ全幅暗 = 実線横罫（点線楕円行は 40px 未満）
HORIZ_RULE_MIN_DARK = 90

# 1 行目上横罫より下からスキャン（ヘッダー横罫 414–417 は除外）
MEMBER_SCAN_Y_START = 418


def pixel_sum(img: Image.Image, x: int, y: int) -> int:
    return sum(img.getpixel((x, y)))


def is_dark(img: Image.Image, x: int, y: int, thresh: int = 750) -> bool:
    return pixel_sum(img, x, y) < thresh


def idou_interior_dark_count(img: Image.Image, y: int) -> int:
    return sum(1 for x in range(IDOU_X1, IDOU_X2 + 1) if is_dark(img, x, y))


def horiz_rule_rows(img: Image.Image, y_start: int, y_end: int) -> set[int]:
    return {
        y
        for y in range(y_start, y_end + 1)
        if idou_interior_dark_count(img, y) >= HORIZ_RULE_MIN_DARK
    }


def rule_bands(rules: set[int]) -> list[tuple[int, int]]:
    if not rules:
        return []
    ys = sorted(rules)
    bands: list[tuple[int, int]] = []
    start = ys[0]
    end = ys[0]
    for y in ys[1:]:
        if y == end + 1:
            end = y
        else:
            bands.append((start, end))
            start = end = y
    bands.append((start, end))
    return bands


def member_row_zones(img: Image.Image, rules: set[int]) -> list[tuple[int, int]]:
    """各組合員行 = 上横罫帯の直下 〜 次の上横罫帯の直前（変更ラベル tail 含む）。"""
    bands = rule_bands(rules)
    member_tops = [b for b in bands if b[0] >= 445]
    if len(member_tops) < 2:
        raise SystemExit("ERROR: could not detect member-row horizontal rules")

    zones: list[tuple[int, int]] = []
    for idx in range(len(member_tops) - 1):
        y1 = member_tops[idx][1] + 1
        y2 = member_tops[idx + 1][0] - 1
        if y1 <= y2:
            zones.append((y1, y2))

    last = member_tops[-1]
    trailing = [b for b in bands if b[0] > last[1]]
    y1 = last[1] + 1
    y2 = trailing[0][0] - 1 if trailing else last[1]
    if y1 <= y2:
        zones.append((y1, y2))

    return zones


def col_border_snapshot(img: Image.Image, y_max: int) -> list[tuple[int, int, int, int, int]]:
    out: list[tuple[int, int, int, int, int]] = []
    y_min = IDOU_HEADER_BOX[2]
    for y in range(y_min, y_max + 1):
        for x in IDOU_COL_LEFT_BORDER | IDOU_COL_RIGHT_BORDER:
            out.append((x, y, *img.getpixel((x, y))))
    return out


def header_snapshot(img: Image.Image) -> list[tuple[int, int, int, int, int]]:
    x1, x2, y1, y2 = IDOU_HEADER_BOX
    out: list[tuple[int, int, int, int, int]] = []
    for y in range(y1, y2 + 1):
        for x in range(x1, x2 + 1):
            out.append((x, y, *img.getpixel((x, y))))
    return out


def horiz_rule_snapshot(
    img: Image.Image, rules: set[int]
) -> list[tuple[int, int, int, int, int]]:
    out: list[tuple[int, int, int, int, int]] = []
    for y in sorted(rules):
        for x in range(IDOU_X1, IDOU_X2 + 1):
            out.append((x, y, *img.getpixel((x, y))))
    return out


def removable_points(
    img: Image.Image, rules: set[int], zones: list[tuple[int, int]]
) -> list[tuple[int, int]]:
    pts: list[tuple[int, int]] = []
    hx1, hx2, hy1, hy2 = IDOU_HEADER_BOX
    for y1, y2 in zones:
        for y in range(y1, y2 + 1):
            if y in rules:
                continue
            for x in range(IDOU_X1, IDOU_X2 + 1):
                if hx1 <= x <= hx2 and hy1 <= y <= hy2:
                    continue
                if is_dark(img, x, y):
                    pts.append((x, y))
    return pts


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
    y_scan_end = 910
    rules = horiz_rule_rows(img, MEMBER_SCAN_Y_START, y_scan_end)
    zones = member_row_zones(img, rules)

    y_max = max(z[1] for z in zones)
    before_border = col_border_snapshot(img, y_max)
    before_header = header_snapshot(img)
    before_horiz = horiz_rule_snapshot(img, rules)

    measure_dir = ROOT / "measure" / "idou"
    measure_dir.mkdir(parents=True, exist_ok=True)

    pts = removable_points(img, rules, zones)
    print(f"horiz rule rows (protected): {sorted(rules)}")
    print(f"member row zones: {zones}")
    print(f"removable points: {len(pts)}")

    if not pts:
        print("nothing to remove")
        return

    for row, (y1, y2) in enumerate(zones, start=1):
        img.crop((90, y1 - 3, 200, y2 + 3)).save(
            measure_dir / f"row{row}_zone_BEFORE.png"
        )

    total = fill_points(img, pts)
    print(f"filled={total}")

    for row, (y1, y2) in enumerate(zones, start=1):
        img.crop((90, y1 - 3, 200, y2 + 3)).save(
            measure_dir / f"row{row}_zone_AFTER.png"
        )

    if col_border_snapshot(img, y_max) != before_border:
        raise SystemExit("ERROR: 異動内容列の縦罫 (x98–101 / x195–197) changed")
    if header_snapshot(img) != before_header:
        raise SystemExit("ERROR: ヘッダー「異動内容」 changed")
    if horiz_rule_snapshot(img, rules) != before_horiz:
        raise SystemExit("ERROR: 横罫 (solid rule rows) changed")

    img.save(PNG, optimize=True)
    print(f"saved {PNG}")


if __name__ == "__main__":
    main()
