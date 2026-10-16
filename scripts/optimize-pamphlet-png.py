#!/usr/bin/env python3
"""Generate display WebP for kyosai pamphlet previews (PNG sources unchanged).

Skips soshiki-form-enter.png (form background). Re-run after replacing images/*.png.
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image

REPO_ROOT = Path(__file__).resolve().parents[1]
IMAGES = REPO_ROOT / "images"

PAMPHLET_BASENAMES = [
    "kasai",
    "special-contract",
    "iryo",
    "seimei",
    "kotsu",
    "korei-iryo",
    "korei-seimei",
    "one-co",
    "kanwa-iryo",
    "jitensha1",
    "jitensha2",
    "soshiki1",
    "soshiki2",
    "kyosai",
]

MAX_LONG_EDGE = 1600
WEBP_QUALITY = 85


def resize_if_needed(img: Image.Image) -> Image.Image:
    w, h = img.size
    long_edge = max(w, h)
    if long_edge <= MAX_LONG_EDGE:
        return img
    scale = MAX_LONG_EDGE / long_edge
    new_size = (max(1, round(w * scale)), max(1, round(h * scale)))
    return img.resize(new_size, Image.Resampling.LANCZOS)


def to_rgb(img: Image.Image) -> Image.Image:
    if img.mode in ("RGB", "L"):
        return img.convert("RGB") if img.mode == "L" else img
    if img.mode == "RGBA":
        background = Image.new("RGB", img.size, (255, 255, 255))
        background.paste(img, mask=img.split()[3])
        return background
    return img.convert("RGB")


def write_webp(basename: str) -> None:
    png_path = IMAGES / f"{basename}.png"
    webp_path = IMAGES / f"{basename}.webp"
    if not png_path.is_file():
        print(f"skip missing {png_path.name}")
        return

    with Image.open(png_path) as opened:
        img = resize_if_needed(opened)
        rgb = to_rgb(img)
        rgb.save(webp_path, format="WEBP", quality=WEBP_QUALITY, method=6)

    print(
        f"{basename}: webp {webp_path.stat().st_size // 1024}KB "
        f"({rgb.size[0]}x{rgb.size[1]}), png source {png_path.stat().st_size // 1024}KB"
    )


def main() -> None:
    for name in PAMPHLET_BASENAMES:
        write_webp(name)


if __name__ == "__main__":
    main()
