#!/usr/bin/env python3
"""
Justin T. McCain — SIGNAL · portrait pipeline
=============================================

    python3 tools/prep-portrait.py "<path-to-source-portrait>"

Takes the studio headshot and grades it to sit inside the brand system.

Three problems it solves, in order:

1. ASPECT. The source is 1:1; the About slot is 4:5 (brand/05 A6). A centred
   square-to-4:5 crop puts the head dead centre, which reads like a profile
   photo. We bias the crop upward so the eyes land near the upper third, which
   is what makes a headshot read as an editorial portrait instead.

2. BACKDROP. The studio sweep is mid-grey (~0.35 luma). Dropped onto a #0A0F14
   page that is a bright rectangle fighting the whole composition. A gamma pull
   darkens it hard (0.35 -> ~0.17) while barely touching the face highlights
   (0.85 -> ~0.76), because they start far apart. This is why no masking is
   needed.

3. PALETTE. brand/01 §3.2 allows exactly two chromatic accents; everything else
   is tonal. So we map the greyscale onto the brand's OWN tonal ramp —
   Signal Black to Daylight — rather than tinting the skin mint, which would
   look like a filter and put a third hue on a person's face. The result is
   neutral to the eye but sits in the palette.

Outputs (site/assets/img/):
    portrait.webp        800x1000  4:5, the About slot
    portrait-square.webp 800x800   1:1, reserved for meta/OG use

Requires Pillow only.
"""

import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent / "site"
IMG = ROOT / "assets" / "img"
IMG.mkdir(parents=True, exist_ok=True)

if len(sys.argv) < 2:
    sys.exit("usage: prep-portrait.py <source-image>")
src_path = Path(sys.argv[1])
if not src_path.exists():
    sys.exit(f"missing {src_path}")

SIGNAL_BLACK = (10, 15, 20)
DAYLIGHT = (238, 242, 246)

GAMMA = 1.55          # backdrop pull; raise to darken further
SCURVE = 0.35         # contrast recovery after the pull; 0 disables
HEAD_BIAS = 0.06      # fraction of height to shift the crop upward

src = Image.open(src_path).convert("RGB")
W, H = src.size
print(f"  source {W}x{H}")


def grade(im):
    """Gamma-pull the tones, then map greyscale onto the brand ramp."""
    lum = im.convert("L")

    # 1. gamma pull — separates a mid-grey backdrop from lit skin
    gamma_lut = [round(255 * ((i / 255) ** GAMMA)) for i in range(256)]
    lum = lum.point(gamma_lut)

    # 1b. S-curve — the pull also flattens the subject, which at the rendered
    #     size (roughly 320px wide) leaves the suit merging into the backdrop
    #     and the portrait reading as a head floating in the dark. A smoothstep
    #     blended against identity restores separation in the shoulders and
    #     face without clipping either end the way a linear contrast bump would.
    def s(i):
        x = i / 255
        return x + ((x * x * (3 - 2 * x)) - x) * SCURVE
    lum = lum.point([round(255 * s(i)) for i in range(256)])

    # 2. duotone onto Signal Black -> Daylight (preserves every tonal step,
    #    so it reads as neutral rather than as a colour cast)
    r_lut = [round(SIGNAL_BLACK[0] + (DAYLIGHT[0] - SIGNAL_BLACK[0]) * i / 255) for i in range(256)]
    g_lut = [round(SIGNAL_BLACK[1] + (DAYLIGHT[1] - SIGNAL_BLACK[1]) * i / 255) for i in range(256)]
    b_lut = [round(SIGNAL_BLACK[2] + (DAYLIGHT[2] - SIGNAL_BLACK[2]) * i / 255) for i in range(256)]
    return Image.merge("RGB", (lum.point(r_lut), lum.point(g_lut), lum.point(b_lut)))


def vignette(im, strength=0.55):
    """Feather the edges into the page so the portrait has no hard border."""
    w, h = im.size
    mask = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(mask)
    inset_x, inset_y = int(w * 0.06), int(h * 0.05)
    d.ellipse([-inset_x, -inset_y, w + inset_x, h + inset_y], fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(min(w, h) * 0.16))
    dark = Image.new("RGB", (w, h), SIGNAL_BLACK)
    faded = Image.composite(im, dark, mask)
    return Image.blend(im, faded, strength)


def crop_45(im, bias=HEAD_BIAS):
    """Square (or any) source -> 4:5, biased upward to place the eyes high."""
    w, h = im.size
    target_w = min(w, int(h * 0.8))
    target_h = min(h, int(target_w / 0.8))
    x = (w - target_w) // 2
    y = max(0, (h - target_h) // 2 - int(h * bias))
    return im.crop((x, y, x + target_w, y + target_h))


def crop_11(im):
    w, h = im.size
    s = min(w, h)
    x = (w - s) // 2
    y = max(0, (h - s) // 2 - int(h * 0.03))
    return im.crop((x, y, x + s, y + s))


graded = grade(src)

p45 = vignette(crop_45(graded).resize((800, 1000), Image.LANCZOS))
p45.save(IMG / "portrait.webp", "WEBP", quality=82, method=6)

p11 = vignette(crop_11(graded).resize((800, 800), Image.LANCZOS), strength=0.45)
p11.save(IMG / "portrait-square.webp", "WEBP", quality=82, method=6)

for f in (IMG / "portrait.webp", IMG / "portrait-square.webp"):
    print(f"  ✓ {f.relative_to(ROOT)}  ({f.stat().st_size / 1024:.0f} KB)")
