#!/usr/bin/env python3
"""Generate print QR PNGs under QRコード/ (not published; see _config.yml exclude)."""
from __future__ import annotations

from pathlib import Path

import qrcode
from PIL import Image

REPO_ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = REPO_ROOT / "QRコード"

# Print: sharp modules at ~2000px square
OUTPUT_PX = 2000

TARGETS = [
    ("QR-top.png", "https://keijirodokyosai.github.io/"),
    ("QR-special-contract.png", "https://keijirodokyosai.github.io/special-contract.html"),
]


def write_qr(path: Path, url: str) -> None:
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white").convert("RGB")
    img = img.resize((OUTPUT_PX, OUTPUT_PX), Image.Resampling.NEAREST)
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, format="PNG", optimize=True)
    print(f"wrote {path.name} ({OUTPUT_PX}x{OUTPUT_PX}) -> {url}")


def main() -> None:
    for filename, url in TARGETS:
        write_qr(OUT_DIR / filename, url)


if __name__ == "__main__":
    main()
