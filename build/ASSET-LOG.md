# Asset Log — SIGNAL

Provenance for every generated asset, so the motion is reproducible and swappable.
Generated 2026-07-25 via Higgsfield MCP. All prompts carry the global style and
global negative from `brand/05-higgsfield-asset-brief.md`.

---

## 1. The master continuous motion

**`assets/motion/signal-master.mp4`** — 1280×720 · 29.04 s · 697 frames · 2.64 MB · H.264

> **v2 (2026-07-26).** Extended from 24.21 s to 29.04 s when the Testimonials
> section was added. This was not optional. Testimonials added ~19% more scroll,
> and because scroll progress is normalised to total page height, every earlier
> beat slid *earlier* against its section — the Ledger moved from p 0.546 to
> 0.441, roughly 2.5 s of drift, which would have fired "motion resolves into
> stamped rows" well after the Evidence Paper section had scrolled by. Adding one
> segment restores the ratio.
> The previous 24.21 s master is kept at `site-v1-archive/signal-master-v1.mp4`
> — deliberately outside `site/`, so 2.3 MB of superseded backup never ships.

> **SUPERSEDED 2026-08-08 — the film no longer needs re-cutting for layout
> changes.** The instruction that used to sit here ("any future section change
> requires the same check — re-cut if the beats have moved") was followed once
> and then immediately came due again: adding the Tools section slid About by
> 0.100, about 2.9 s, the same failure this note was written about.
>
> Re-cutting fixes one instance and leaves the next one waiting, so the cause was
> fixed instead. `js/main.js` now remaps raw scroll onto **narrative time**: it
> measures where each anchored section actually enters the viewport and pins it
> to the film time in the segment table below, interpolating linearly between
> anchors. A segment stretches or compresses to cover whatever content sits under
> it; the joins stay frame-exact on their sections.
>
> Verified after the Tools section landed — every anchor at **0.000 drift**,
> measured off `film.currentTime / duration` at each section's entry point. That
> is tighter than this master ever ran by hand: Contact alone carried +0.096
> (≈2.8 s) of drift from the day it shipped, which the remap also removed.
>
> What this means for you: **add or remove a section freely, and do not re-cut
> the film for it.** The one case still needing thought is a section added AFTER
> Contact, since nothing is authored past the seal. If you change the SEGMENT
> TABLE itself, update `BEAT_ANCHORS` in `js/main.js` to match — that table and
> those constants are now the same fact written twice, and they must agree.

This is **one film for the whole page**, not one clip per section. It is scrubbed
against a single global scroll value (0 at the top of the hero → 1 when the contact
seal is in view), so the signal travels continuously as you descend.

### How it was built — anchored keyframes, not a drifting chain

The obvious approach is to chain image-to-video segments, feeding each segment's
last frame into the next. That accumulates drift: by segment five the art
direction has wandered.

Instead, all six **keyframes were generated first** as fixed anchors, then each
segment was rendered *between two of them* using `start_image` + `end_image`.
Segment N ends on precisely the frame segment N+1 begins on, so there is nothing
to drift. The joins are dissolves of 0.25 s over identical frames — invisible.

### Keyframe anchors — `nano_banana_flash`, 2752×1536, 16:9

K0 seeded the art direction; K1–K5 each referenced K0 as a style anchor so the
node field, horizon, perspective, depth of field and grain stay identical.

| # | Beat | Job ID | Note |
|---|---|---|---|
| K0 | Signal ignites, left | `5aaf1728-719e-4587-b391-42bd82a34641` | Style anchor for all others |
| K1 | One filament crosses the gap | `1fb923d2-949f-423c-a1bb-d2bb0b493270` | Regenerated — first attempt drew *two* parallel lines, which contradicts "one signal" |
| K2 | Hardening into enforcement lattice | `d00f4add-3676-4de3-bebf-d291937001f5` | |
| K3 | Resolves into ledger strata + amber seal | `f020fa5d-06b8-46c4-a7c1-75cf1ff6f4e0` | |
| K4 | Paths branch and light in sequence | `043aada9-dba8-40e5-9ea9-640cc2dc3778` | Amber now leads |
| K4b | Paths converge to one line; held | `6c347fc7-6987-41c1-bed8-42fc09de2f64` | **Added in v2.** Referenced K4, not K0, for local continuity across the warm end of the arc |
| K5 | Node seals amber at the threshold | `d6b1ac05-72b9-41a3-ab71-3fdb6255e5d8` | |

Rejected: `92eb7b41-…` (alternate K0 — read as a *lattice*, which is motif #2 and
belongs later in the journey, not at ignition) and `4ef252f7-…` (the two-line K1).

### Segments — `seedance_2_0`, 1920×1080, 5.042 s each, silent, `mode: std`

| Seg | Span | start_image → end_image | Lands on | Job ID |
|---|---|---|---|---|
| A | 0.000–0.167 | K0 → K1 | Hero, Thesis | `71ea2841-76c8-4811-9c68-c7a07e44721b` |
| B | 0.167–0.333 | K1 → K2 | Work | `8974c713-baeb-400d-93e6-fdb2bd347338` |
| C | 0.333–0.500 | K2 → K3 | Ledger | `191a8216-d021-4751-9d2c-e81e132e9a3c` |
| D | 0.500–0.667 | K3 → K4 | Capabilities | `b7cdb1e3-3455-40d2-9ab5-2b75b0f7c69b` |
| E1 | 0.667–0.833 | K4 → K4b | About, Testimonials | `16ade0d4-785b-4cae-b80b-08af176a1359` |
| E2 | 0.833–1.000 | K4b → K5 | Contact | `375bc1b6-8a9b-4294-bbd0-280c3f52d1db` |

Superseded: segment E (`f1fb23d7-…`, K4 → K5) — replaced by E1 + E2 in v2.

**Measured alignment after re-cutting** (1440×900, film 29.04 s):

| Section | Film time | Beat showing |
|---|---|---|
| Hero | 0.3 s | signal ignites |
| Thesis | 3.6 s | crosses the gap |
| Work | 7.4 s | hardens into lattice |
| Ledger | 12.0 s | resolves into stamped rows |
| Capabilities | 16.2 s | paths light in sequence |
| About | 19.8 s | paths converge, quiets |
| Testimonials | 23.8 s | one warm line, held |
| Contact | 28.3 s | seals amber |

Every segment prompt opened with *"One continuous unbroken shot, no cuts…
patient and continuous throughout, never frantic"* and closed with *"consistent
film grain, consistent deep shadow, consistent near-black background."*

### Assembly (ffmpeg)

Five 1080p segments → xfade dissolves of 0.25 s at each join → 1280×720 @ 24 fps.

```
-c:v libx264 -preset medium -crf 26
-g 12 -keyint_min 12 -sc_threshold 0     # keyframe every 0.5s: seekable = scrubbable
-pix_fmt yuv420p -movflags +faststart -an
```

`-g 12` is the setting that matters. Scrubbed video feels broken when the decoder
has to walk from a distant keyframe on every seek; a keyframe every half second
costs a little size and buys smooth scrubbing. `+faststart` puts the moov atom
first so it seeks before the file has finished downloading. `-an` — silent by
design; the page never plays audio.

Raw total 25.21 s → 24.21 s after four dissolves.

---

## 2. Stills

Derived from the keyframes by `tools/prep-images.py` so the stills and the film
can never drift apart. Re-run it after swapping the master.

| File | Size | Source | Note |
|---|---|---|---|
| `img/signal-poster.webp` | 1920×1080 · 16 KB | K0 | LCP element and the fallback everywhere motion is suppressed. It *is* the film's first frame, so the poster→film swap is invisible |
| `img/signal-poster-tall.webp` | 1080×1920 · 13 KB | K0 | Portrait. Cropped around the ignition point, not centre-cropped — a centre crop throws the signal off-frame |
| `img/ledger-paper.webp` | 1600×900 · 12 KB | v1 ledger plate `04e595f4-…` | Evidence Paper tooth, blended to 18% so it never competes with the copy |
| `og/og-image.png` | 1200×630 · 477 KB | v1 OG plate `2155c151-…` | Composed to the `brand/03` spec. Proof chip reads `~$1.75M/yr recovered` and nothing else |
| `og/og-base.webp` | 1200×630 · 117 KB | same plate | The clean plate `compose.html` draws on. Restored from `site-v1-archive/` after a 19 KB re-encode was found to have lost the plate's grain |
| `apple-touch-icon.png` | 180×180 · 1 KB | drawn | node-at-the-gate |
| `favicon.ico` | 16/32/48 | drawn | |
| `favicon.svg` | vector | hand-authored | The mark is CSS/SVG everywhere else |

**OG card composition.** `og/compose.html` is the source of truth for the design. It
renders the card at 1200×630 with the real self-hosted fonts; serve the site, open it
at exactly that size, and screenshot to re-cut.

**The proof chip is the highest-risk string on the site.** It is baked into pixels, so
it cannot be revised by editing `content.mjs`, and it renders in every LinkedIn, Slack
and X link preview without anyone clicking, then gets cached by each platform's
scraper. It previously read `~$1.75M recovered · ~90% of US page loads`; the scope
figure was removed in the 2026-07 pass. Outcome only, permanently.

**Rasterising the brand fonts locally.** Pillow cannot read the site's `.woff2`
directly. `pip install brotli` lets fontTools convert them:

```python
from fontTools.ttLib import TTFont
f = TTFont("assets/fonts/plex-mono-500.woff2"); f.flavor = None; f.save("plex-mono-500.ttf")
```

---

## 3. Reused from v1

These were generated against the same locked brand spec in Phase 2 v1 and remain
valid. Kept in `site-v1-archive/` and on the Higgsfield CDN.

| Asset | Job ID |
|---|---|
| Ledger / Evidence Paper plate | `04e595f4-adf9-…-8db1-…` → `04e595f4-…` |
| OG base plate | `2155c151-6606-41b1-a142-cdd096f89177` |
| Honored-node macro | `d3b5f04e-8473-4482-9691-cb672fab082c` |
| Privacy × AI motif | `7a8339c9-3937-4ff7-a3eb-55edf7275eb1` |

The three v1 motion clips are **superseded** by the single master and are not used.

---

## 4. Portrait — SHIPPED 2026-07-27

Not generated. A real studio headshot supplied by Justin, graded into the brand
system by `tools/prep-portrait.py`:

```
python3 tools/prep-portrait.py "<source>"
```

| File | Size | Note |
|---|---|---|
| `img/portrait.webp` | 800×1000 · 35 KB | 4:5, the About slot |
| `img/portrait-square.webp` | 800×800 · 23 KB | 1:1, reserved for meta/OG use |

Three things the script does, and why:

1. **1:1 → 4:5, biased upward.** The source is square. A centred crop puts the
   head dead centre, which reads as a profile photo; shifting the crop up so the
   eyes land near the upper third is what makes it read as an editorial portrait.
2. **Gamma pull (1.70).** The studio sweep is mid-grey (~0.35 luma) and would sit
   on a `#0A0F14` page as a bright rectangle. The pull takes the backdrop to
   ~0.17 while lit skin only moves 0.85 → 0.76, because the two start far apart.
   No masking needed.
3. **Duotone onto Signal Black → Daylight.** `brand/01` §3.2 allows exactly two
   chromatic accents and says everything else is tonal. Mapping the greyscale
   onto the brand's own ramp keeps it in-palette without tinting skin mint, which
   would read as a filter and put a third hue on a person's face.

The CSS drops the panel border for a real portrait
(`.portrait:not(.portrait--placeholder)`), because a frame around a vignette
draws a rectangle exactly where the image is trying to dissolve.

The placeholder path still exists. Set `ABOUT.portrait.ready = false` to fall
back to it; the slot reserves identical dimensions either way, so there is no
layout shift in either direction.
