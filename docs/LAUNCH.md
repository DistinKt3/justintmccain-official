# Launch runbook — justintmccain.com

Three deployables serve one domain. This is the order to stand them up and the
checks that prove each one worked.

| What | Where it runs | URL | Deployed by |
|---|---|---|---|
| Portfolio (static) | Cloudflare Pages | `/` | upload `site/` |
| Metadata Scrubber (static) | same Pages project | `/scrubber/` | built into `site/scrubber/` |
| Vanish (Next + one server route) | Netlify | `/vanish` | git push / Netlify CLI |
| `vanish-proxy` | Cloudflare Worker | routes `/vanish*` | `wrangler deploy` |

---

## The one rule that matters

**`site/` is the Cloudflare Pages publish directory, and Pages publishes it
wholesale with no exclude mechanism. Everything in it becomes a public URL.**

Both tool source trees used to live inside `site/`. That meant 34,532 files
against Pages' 20,000-file limit — the deploy would have been rejected outright —
and `Vanish_PRD.docx`, 85 source files, the internal design specs, `netlify.toml`
and 530 `.git` objects would all have been fetchable.

Source now lives in `tools/`. Only build OUTPUT goes into `site/`.

Before any deploy:

```bash
find site -type f | wc -l        # expect ~35, never more than a few hundred
find site -type d -name node_modules -o -type d -name .git | head   # expect nothing
```

If that count is in the thousands, something put source back in the publish
directory. Fix that before deploying, not after.

---

## 1. Build

```bash
cd tools/metadata-scrubber && npm ci && npm run build   # → ../../site/scrubber/
cd ../../build && node build.mjs                        # → ../site/*.html, sitemap.xml
```

The Scrubber builds straight into `site/scrubber/` (`build.outDir` in its
`vite.config.ts`), so "built" and "shipped" cannot drift. `build.mjs` regenerates
`index.html`, `privacy.html` and `sitemap.xml` from `build/content.mjs`.

**`site/index.html` is generated. Never hand-edit it** — edit `build/content.mjs`
and re-run. Bump `ASSET_VERSION` in `build/build.mjs` whenever CSS or JS changes,
or clients hold the old file for a year (`_headers` caches `/css/*` and `/js/*`
immutable for a year, keyed on the `?v=` query).

Preview locally, which mirrors production including `_headers` and Range
requests for the film:

```bash
node build/serve.mjs 4173
```

## 2. Cloudflare Pages

Publish directory `site/`. No build command needed if you build locally first.

Point `justintmccain.com` at the project and make sure the apex record is
**proxied (orange cloud)** — a DNS-only record means requests never touch
Cloudflare's network and the Worker route in step 4 will never fire.

## 3. Netlify — Vanish

`tools/vanish` deploys as-is. `netlify.toml` sets:

- `NODE_VERSION = "22"` (Next 16 needs ≥ 20.9)
- `NEXT_PUBLIC_BASE_PATH = "/vanish"`

That second one is the load-bearing part. `next.config.ts` reads it into
`basePath`, so the app answers at `<site>.netlify.app/vanish` — the same path it
will answer at on the real domain. The proxy then forwards paths through
unchanged, which means **what you test on Netlify is exactly what visitors get**.

The value is inlined into the client bundle at build time. Changing it requires a
rebuild; clearing the cache and redeploying is not enough.

**Confirm `<site>.netlify.app/vanish` loads and a scan completes before touching
the proxy.** Debugging the app through the proxy is much harder than debugging it
directly.

## 4. Cloudflare Worker — the `/vanish` proxy

```bash
cd deploy/cloudflare/vanish-proxy
# set VANISH_ORIGIN in wrangler.toml to the Netlify origin first
npx wrangler deploy
```

It is a separate deployable rather than a Pages Function on purpose: a mistake in
the proxy takes out `/vanish` and leaves every other page untouched.

It registers **two** routes — `/vanish` and `/vanish/*`. Vanish is a Next app with
`trailingSlash: false`, so `/vanish` (no slash) is the canonical URL and is the
one people type. A single `/vanish/*` pattern would leave the front door unrouted.

Note the asymmetry, which is correct and not a typo:

- `/vanish` — no trailing slash (Next canonical; `/vanish/` 301s to it)
- `/scrubber/` — trailing slash (static directory; `/scrubber` 301s to it)

Written this way both CTAs on the landing page resolve in a single hop.

---

## Staged review, before any DNS change

All of this is wrapped by `./deploy/stage.sh` — use that rather than the raw
commands, because it also runs the guards described below:

```bash
./deploy/stage.sh preflight                        # audits + builds + publish-dir check
./deploy/stage.sh vanish                           # Netlify draft deploy
./deploy/stage.sh site   https://<host>/vanish     # staging build → Cloudflare Pages
./deploy/stage.sh verify https://<pages> https://<netlify>
./deploy/stage.sh production                       # canonical rebuild + prod deploy
```

`deploy/verify.mjs` runs ~35 assertions over a deployed URL: routing, the CSP
split, whether basePath survived, whether `/vanish/api/scan` is actually
mounted, and whether anything private shipped. It exits non-zero on failure, so
it works as a gate.

You can have all three pieces live and reviewable on their platform URLs without
touching `justintmccain.com` at all. Nothing below is destructive and nothing
below is visible to anyone who does not have the URL.

Neither CLI needs installing — `npx` fetches them per-run. Both open a browser
for login the first time.

**1. Vanish → Netlify.** From `tools/vanish`:

```bash
npx netlify-cli@latest login
npx netlify-cli@latest deploy --build          # draft URL, not production
```

Gives a one-off draft URL. When it looks right, `--prod` publishes it to the
site's main `*.netlify.app` address. Confirm `…netlify.app/vanish` loads and a
scan completes before going near the proxy.

**2. Portfolio → Cloudflare Pages.** From the repo root:

```bash
npx wrangler@latest login
npx wrangler@latest pages deploy site --project-name justintmccain
```

Gives a `*.pages.dev` URL serving the landing page and `/scrubber/`.

**3. The catch, and the fix.** On `*.pages.dev` the Worker route does not exist,
so `/vanish` 404s there — the one tool most worth reviewing would be the one you
cannot click. Build the staging copy with the link pointed at Netlify:

```bash
STAGING_VANISH_URL=https://<your-site>.netlify.app/vanish node build/build.mjs
npx wrangler@latest pages deploy site --project-name justintmccain
```

The build prints a loud **STAGING BUILD** banner when any override is active. The
sitemap deliberately ignores overrides and always emits the canonical
`justintmccain.com` URLs, so a staging deploy cannot publish a sitemap pointing
at netlify.app.

**Before production, rebuild with no override** and confirm the build says
`Tool links: canonical (production-ready)`. Shipping a staging build leaves a
netlify.app link in the page indefinitely.

---

## Post-launch verification

Run all of it. Each line has a specific expected answer.

```bash
# — routing ————————————————————————————————————————————————
curl -sI https://justintmccain.com/            | head -1   # 200
curl -sI https://justintmccain.com/scrubber/   | head -1   # 200
curl -sI https://justintmccain.com/scrubber    | head -1   # 301 → /scrubber/
curl -sI https://justintmccain.com/vanish      | head -1   # 200
curl -sI https://justintmccain.com/vanish/about| head -1   # 200

# — the proxy must not leak its origin ——————————————————————
curl -sI https://justintmccain.com/vanish/ | grep -i location
#   expect a relative /vanish — NEVER a netlify.app hostname

# — Vanish's assets resolve under the prefix ————————————————
curl -s https://justintmccain.com/vanish | grep -o '/_next/[^"]*' | head
#   expect NOTHING. Every hit here must read /vanish/_next/...
curl -s https://justintmccain.com/vanish | grep -o '/vanish/_next/[^"]*' | head -3

# — CSP is scoped correctly ————————————————————————————————
curl -sI https://justintmccain.com/          | grep -i content-security-policy
#   expect default-src 'none' with the pinned script hash
curl -sI https://justintmccain.com/scrubber/ | grep -i content-security-policy
#   expect default-src 'self' — the SPA bundle is hash-named per build and
#   cannot be pinned, so it gets a scoped policy instead of loosening the root

# — nothing private shipped ————————————————————————————————
curl -sI https://justintmccain.com/vanish/Vanish_PRD.docx | head -1   # 404
curl -sI https://justintmccain.com/tools/vanish/src/lib/brokers.ts | head -1  # 404
curl -sI https://justintmccain.com/scrubber/src/App.tsx | head -1     # 404
```

Then by hand, in a browser:

- [ ] Landing page: the Tools section sits between the recommendations and the
      contact block, two panels side by side above 928px, stacked below it.
- [ ] Both CTAs open their tool in a new tab and the portfolio stays behind.
- [ ] Scroll the full page. The film scrubs smoothly and its beats land on their
      sections (see *Motion* below).
- [ ] `/scrubber/` — drop in a JPEG with GPS, confirm the report and a clean file.
- [ ] `/vanish` — run a scan through to results. **This is the one that exercises
      the proxy's POST path.**
- [ ] DevTools console on all three URLs: no CSP violations.

---

## Motion — read this before adding another section

The background film is **one 29.04 s master scrubbed by scroll**, not a loop and
not one clip per section. `currentTime = narrativeTime × duration`.

**It does not need to be longer when the page gets longer.** It is normalised to
scroll, so a taller page stretches the same file. Adding the Tools section
required no re-render and no new footage.

What *does* break is alignment. The film is six equal segments, each authored
between fixed keyframe anchors for a named section (`build/ASSET-LOG.md`). When a
section is added, every boundary below it slides earlier in raw scroll progress
and the beats stop landing on their sections. This has happened twice:

- adding **testimonials** slid the Ledger 0.546 → 0.441 (~2.5 s), and the film
  was re-cut to compensate;
- adding **tools** slid About by a further 0.100 (~2.9 s).

Re-cutting fixes one instance and leaves the next one waiting, so the cause was
fixed instead. `js/main.js` now remaps raw scroll onto **narrative time**: it
measures where each anchored section actually enters the viewport and pins it to
the film time it was authored for, interpolating between anchors. Segments
stretch to cover whatever sits under them; joins stay frame-exact on sections.

Measured after Tools landed — every anchor at **0.000 drift**, taken from
`film.currentTime / duration` at each section's entry point. That is tighter than
the master ever ran by hand: Contact alone carried +0.096 (~2.8 s) from the day it
shipped, which the remap also removed.

**So: add or remove sections freely and do not re-cut the film for it.** Two
caveats remain.

1. A section added **after** Contact falls outside the map — nothing is authored
   past the seal.
2. If you change the segment table in `ASSET-LOG.md`, update `BEAT_ANCHORS` in
   `js/main.js` to match. They are the same fact written twice and must agree.

`js/signal-field.js` (the procedural fallback for phones and low-power devices)
now takes the same narrative time, so its beat constants are in the same units as
the segment table. Change them to change the choreography — never to compensate
for a layout change.

---

## Adding a third tool

Everything is derived from one place. In `build/content.mjs`, add an entry to
`TOOLS.items` and re-run `node build.mjs`. That gets you the panel, the link, and
the sitemap entry — the sitemap is generated from `TOOLS`, so it cannot disagree
with the section that links to it.

The section's house rule: **`proof` must be checkable by the reader in under a
minute.** Not a benefit statement — the specific countable fact a sceptic could
verify from the running tool. The two current ones ("23 brokers, each verified
against the California data broker registry", "turn your wifi off first — it still
works") are both falsifiable on the spot. If a tool cannot produce a line like
that, it does not belong in a section whose whole purpose is to invite checking.

Re-count the numbers if either tool changes: `23` is every enabled entry in
`tools/vanish/src/data/brokers.json`; the four formats are the modules in
`tools/metadata-scrubber/src/lib/scrub/`. A stale number here is worse than no
number.

---

## Known gaps

- **HEIC scrubbing is unverified end to end.** The bundle constructs a Worker
  from a Blob and the app's own `<meta>` CSP has no `worker-src`, so it falls
  back to `default-src 'self'` and a blob: worker would be refused. The
  `_headers` policy allows it; the meta tag is the binding constraint. JPEG, PNG
  and PDF are the paths to trust until someone runs a real `.heic` through it.
- **Each tool's own deploy is still independently reachable** (the netlify.app
  URL). Point each one's canonical at the `justintmccain.com` URL, or the two
  origins compete in the index.
- The Scrubber bundle is 2.09 MB (622 KB gzipped), most of it the HEIC decoder.
  Fine for a tool people opt into; worth code-splitting if it ever becomes the
  landing experience.
