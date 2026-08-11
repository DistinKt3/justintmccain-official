#!/usr/bin/env python3
"""
Justin T. McCain — SIGNAL · still-asset pipeline
================================================

Derives every static image the site ships from the motion keyframes, so the
stills and the film can never drift apart stylistically.

    python3 tools/prep-images.py <keyframe-dir>

<keyframe-dir> holds K0.png … K5.png (the anchor frames the master film was
rendered between — see assets/ASSET-LOG.md).

Outputs into site/assets/img/:
    signal-poster.webp         1920×1080  hero poster / LCP element / film fallback
    signal-poster-tall.webp    1080×1920  same beat, recomposed for portrait
    ledger-paper.webp          1600×900   Evidence Paper texture, very low contrast
    ../../apple-touch-icon.png 180×180    node-at-the-gate mark

Requires Pillow only (already present on macOS via pip). No other deps.
"""

import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent / "site"
IMG = ROOT / "assets" / "img"
IMG.mkdir(parents=True, exist_ok=True)

src_dir = Path(sys.argv[1] if len(sys.argv) > 1 else ".")


def load(name):
    p = src_dir / name
    if not p.exists():
        sys.exit(f"missing {p}")
    return Image.open(p).convert("RGB")


def cover(im, w, h):
    """Resize + center-crop to exactly w×h, preserving aspect."""
    sw, sh = im.size
    scale = max(w / sw, h / sh)
    im = im.resize((round(sw * scale), round(sh * scale)), Image.LANCZOS)
    x = (im.width - w) // 2
    y = (im.height - h) // 2
    return im.crop((x, y, x + w, y + h))


# -- 1. Hero poster (landscape) -------------------------------------------
# K0 is the first frame of the master film, so the poster IS the film's
# opening frame: the swap from poster to video is invisible.
k0 = load("K0.png")
poster = cover(k0, 1920, 1080)
poster.save(IMG / "signal-poster.webp", "WEBP", quality=74, method=6)

# -- 2. Hero poster (portrait) --------------------------------------------
# Not a center-crop: the ignition point sits in the left third of K0, and a
# center-crop would throw the signal off-frame. Crop around the signal instead.
w9 = round(k0.height * 9 / 16)
tall = k0.crop((0, 0, w9, k0.height)).resize((1080, 1920), Image.LANCZOS)
tall.save(IMG / "signal-poster-tall.webp", "WEBP", quality=74, method=6)

# -- 3. Evidence Paper texture --------------------------------------------
# The ledger section is real HTML text on #F5F3ED; this is only a whisper of
# tooth beneath it. Kept very low contrast so it never competes with the copy.
try:
    paper = load("ledger.png")
    paper = cover(paper, 1600, 900).filter(ImageFilter.GaussianBlur(0.4))
    flat = Image.new("RGB", paper.size, (245, 243, 237))
    paper = Image.blend(flat, paper, 0.18)
    paper.save(IMG / "ledger-paper.webp", "WEBP", quality=68, method=6)
except SystemExit:
    print("  · ledger.png not supplied — skipping paper texture (CSS colour is the fallback)")

# -- 4. apple-touch-icon --------------------------------------------------
# The mark is CSS/SVG everywhere else; iOS is the one place that needs a PNG.
S = 180
icon = Image.new("RGB", (S, S), (10, 15, 20))
d = ImageDraw.Draw(icon)
d.rounded_rectangle([0, 0, S - 1, S - 1], radius=34, fill=(10, 15, 20))
d.rounded_rectangle([124, 34, 135, 146], radius=6, fill=(233, 180, 76))   # amber threshold
d.ellipse([51, 62, 107, 118], fill=(95, 227, 196))                        # mint node
icon.save(ROOT / "apple-touch-icon.png", "PNG", optimize=True)

for f in [
    IMG / "signal-poster.webp",
    IMG / "signal-poster-tall.webp",
    IMG / "ledger-paper.webp",
    ROOT / "apple-touch-icon.png",
]:
    if f.exists():
        print(f"  ✓ {f.relative_to(ROOT)}  ({f.stat().st_size / 1024:.0f} KB)")
