# SIGNAL — justintmccain.com

Personal site for **Justin T. McCain**, Privacy Product Leader.
Built to the locked brand system in `../brand/`. Static HTML/CSS/JS, no runtime
dependencies, no build tooling to install, everything self-hosted.

---

## How to update it

### Change any words or any number

Everything lives in **`src/content.mjs`** — one file. Copy, metrics, SEO strings,
nav labels, the privacy page. Nothing is typed twice: `~$1.75M` appears in the
hero, a work card, the ledger and the OG description, and it is one entry.

```bash
# edit src/content.mjs, then:
node build.mjs
```

That regenerates `index.html`, `privacy.html` and `sitemap.xml`. **Commit the
generated files** — the site deploys as pure static and never needs Node again.

> Why a build step at all, when the brief said avoid one? `brand/03` requires every
> proof metric to be real crawlable text (not injected by JS), and the brief also
> requires copy centralised so a number changes in one place. In a hand-written
> static file those two fight. This is ~230 lines of Node using only built-ins —
> no npm, no `node_modules`, no lockfile, nothing to audit or keep current.

### Reveal a hidden section

`#writing` and `#portfolio` are fully built and styled but hidden. In
`src/content.mjs`:

```js
export const FLAGS = {
  SHOW_WRITING: true,      // ← flip
  SHOW_PORTFOLIO: false,
};
```

Add entries to `WRITING.posts` / `PORTFOLIO.studies` in the same file, run
`node build.mjs`. The case-study card mirrors the Work card, so a case study is
just an expanded card — no new CSS.

### Drop in the real portrait

1. Save the image to `assets/img/portrait.webp` (4:5, 800×1000 or larger).
2. In `src/content.mjs` set `ABOUT.portrait.ready = true`.
3. `node build.mjs`.

The placeholder already reserves the exact final dimensions, so there is no
layout shift and nothing else changes. See `assets/ASSET-LOG.md` §4.

### Swap the master motion

Replace `assets/motion/signal-master.mp4`. Two things matter:

- **Encode it keyframe-dense** (`-g 12 -keyint_min 12 -sc_threshold 0`) and with
  `-movflags +faststart`, or scrubbing will feel sticky. Full ffmpeg recipe in
  `assets/ASSET-LOG.md` §1.
- **Regenerate the poster from the film's first frame** so the poster→film swap
  stays invisible: `python3 tools/prep-images.py <dir-with-K0.png>`.

Duration is read at runtime — any length works, no code change needed.

### Change a brand token

Colours, type scale, spacing and easing are CSS custom properties at the top of
`css/main.css` under `:root`. Change once, applies everywhere.

### Bust caches after a change

Bump `ASSET_VERSION` in `build.mjs` and re-run it. CSS and JS are requested with
`?v=N`, so this forces browsers onto the new files.

---

## The motion — how it works

**One signal travels the entire page.** Not one clip per section — that was the
v1 mistake this rebuild exists to fix.

There is a single `position: fixed` full-viewport layer behind all content
(`.signal` in `css/main.css`). Content scrolls over it. Because there is
physically one element driven by one clock, the motion *cannot* fragment.

`js/main.js` owns that clock: one `progress()` value, 0 at the top of the hero
→ 1 when the contact seal is in view. Two renderers consume it:

| | Renderer | Where | Payload |
|---|---|---|---|
| **Desktop** | `js/scroll-film.js` — scrubs the master film's `currentTime` | ≥900px, fine pointer, ≥4 cores/4GB | 2.44 MB, lazy, after first paint |
| **Mobile / low-power** | `js/signal-field.js` — draws a procedural node field | phones, coarse pointer, low-power | ~3.5 KB gzip, no video downloaded at all |

Both run the **same beat map** off the **same scroll value**, so the choreography
is identical even though the rendering differs:

| progress | section | the signal is… |
|---|---|---|
| 0.00–0.15 | Hero | igniting, beginning to travel |
| 0.15–0.30 | Thesis | crossing the gap as one unbroken filament |
| 0.30–0.55 | Work | hardening into an enforcement lattice |
| 0.55–0.70 | Ledger | resolved into fixed, stamped rows |
| 0.70–0.85 | Capabilities | branching, paths lighting in sequence |
| 0.85–0.95 | About | quieting |
| 0.95–1.00 | Contact | sealing amber at the threshold |

The Evidence Paper ledger is **opaque on purpose** — it occludes the motion layer
at exactly the beat where brand motion is meant to resolve into recruiter-legible
fact.

The procedural field is a **pure function of scroll**: no idle animation loop, no
timers. It redraws when you scroll and is otherwise perfectly still — calm, and
kind to a phone battery.

### Degradation

The poster (`assets/img/signal-poster.webp`, 16 KB) is the LCP element and the
floor. Motion is only ever layered on top, and every failure path lands back on it:

- `prefers-reduced-motion` → no film, no canvas, poster only, metrics show final
  values instantly. Turning the OS setting on mid-session is honoured immediately.
- `prefers-reduced-data` / Save-Data / 2G → poster only.
- No JS → the full page is server-rendered HTML and completely readable.
- Video fails to load → poster stays, silently.
- Backgrounded tab → rendering pauses, resumes on return.

**Reveal animations never gate content.** They are plain rect checks driven by the
scroll handler, not an IntersectionObserver — an observer that fails to fire would
leave the page at `opacity: 0`, and content must never depend on an animation
callback firing.

---

## Privacy

The site collects nothing, and that is a brand claim as much as a technical one —
verified, not assumed:

- **No cookies. No localStorage. No sessionStorage.** All confirmed empty.
- **Zero third-party requests.** Fonts are self-hosted — notably there is no
  Google Fonts call, which would hand the visitor's IP to a CDN.
- **No analytics, no tag manager, no pixels, no session recording.**
- **No forms.** Contact is a `mailto:` link, so no server, no database, no
  retention question.
- `privacy.html` describes exactly this. **If you ever add analytics, update that
  page first.** Use one cookieless first-party tool, and skip counting when GPC or
  DNT is present.

---

## Performance

Measured, against the `brand/06` budget:

| | measured | budget |
|---|---|---|
| Critical path (gzip) | **101 KB** | < 800 KB |
| All JavaScript (gzip) | **7.7 KB** | < 150 KB |
| Hero poster / LCP | **16 KB** | — |
| Master film | 2.44 MB, lazy, desktop only | — |
| Whole site on disk | 3.3 MB | — |

Fonts are the bulk of the critical path (81 KB of the 101 KB) and are already
Brotli-compressed inside woff2 — they do not compress further. If that ever needs
to come down, subset them harder.

---

## Layout

```
site/
  src/content.mjs       ← every word and number. Start here.
  build.mjs             ← content.mjs → index.html, privacy.html, sitemap.xml
  tools/prep-images.py  ← keyframes → poster, tall poster, paper, touch icon

  index.html            generated — commit it
  privacy.html          generated — commit it
  sitemap.xml           generated — commit it

  css/main.css          tokens at the top under :root
  js/main.js            the one scroll clock, nav, reveals, count-ups
  js/scroll-film.js     desktop: scrubs the master film
  js/signal-field.js    mobile: procedural field, same beat map

  assets/
    ASSET-LOG.md        provenance for every generated asset
    motion/             signal-master.mp4
    img/                posters, paper texture
    fonts/              self-hosted woff2
  og/
    og-image.png        the social card
    compose.html        re-cut the card with the real fonts
```

## Local preview

```bash
node site/tools/serve.mjs 4173
```

Then open <http://localhost:4173>.

**Do not preview with `python3 -m http.server`.** It does not implement HTTP
Range requests, and the scroll-scrubbed film needs them: every scroll sets
`video.currentTime`, which is a seek. Without Range the browser reports the
video as `seekable: [0, 0]` and silently pins it to frame 0 — the film loads,
reports `readyState 4`, and simply never moves. It looks exactly like a broken
scrubber rather than a broken server, which is a genuinely expensive hour to
lose. `tools/serve.mjs` is a zero-dependency static server that answers Range
with 206 Partial Content.

## Deploy

Upload the contents of `site/` to any static host. No build, no server, no env
vars. Serve with Brotli/gzip and long-cache `assets/*` as immutable. Make sure the
host does not inject its own analytics — that would quietly falsify
`privacy.html`.

**The host must serve HTTP Range requests** for `assets/motion/*.mp4`, for the
reason above. Netlify, Vercel, Cloudflare Pages, GitHub Pages, S3+CloudFront,
nginx and Apache all do by default — this is only a caveat for a hand-rolled
origin. If the film ever loads but refuses to scrub in production, check for
`Accept-Ranges: bytes` on the video response before touching the JavaScript.
