# Launch runbook — justintmccain.com

Two deployables serve one domain. This is the order to stand them up and the
checks that prove each one worked.

| What | Where it runs | URL | Deployed by |
|---|---|---|---|
| Portfolio (static) | Worker `justintmccain-official` | `/` | `wrangler deploy`, or git push |
| Metadata Scrubber (static) | same Worker, from `site/scrubber/` | `/scrubber/` | same deploy |
| `/vanish` proxy | same Worker, `worker/index.js` | `/vanish*` | same deploy |
| Vanish (Next + one server route) | Netlify | `/vanish` | git push / Netlify CLI |

> **This was Cloudflare Pages once, and is not any more.** The Pages project
> `justintmccain` does not exist, so every `wrangler pages deploy` against it
> fails with "project does not exist". One Worker now serves the assets *and*
> proxies `/vanish`; `worker/index.js` explains why the proxy stopped being a
> second deployable. If you are reading an older copy of this file that
> describes three deployables and a `vanish-proxy`, that is the shape this
> project used to have.

Two consequences worth holding onto:

- **A git push deploys.** The Worker has a Workers Builds integration, so
  pushing to `main` ships to production on its own, without anyone running a
  deploy command. Use `./deploy/stage.sh preview` when that is not what you
  want.
- **Preview URLs are fully functional.** `wrangler versions upload` returns a
  `<version-id>-justintmccain-official.<subdomain>.workers.dev` URL that serves
  the whole site including `/vanish`, because the proxy travels with the Worker
  instead of being bound to the production hostname.

---

## The one rule that matters

**`site/` is the Worker's asset directory (`assets.directory` in
`wrangler.jsonc`), and it is uploaded wholesale with no exclude mechanism.
Everything in it becomes a public URL.**

Both tool source trees used to live inside `site/`. That meant 34,532 files, and
`Vanish_PRD.docx`, 85 source files, the internal design specs, `netlify.toml`
and 530 `.git` objects would all have been fetchable. The move from Pages to a
Worker did not soften this rule — the upload is still wholesale, and the file
ceiling is still finite.

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

## 2. Cloudflare Worker

`wrangler.jsonc` is the whole configuration: `main` is `worker/index.js`,
`assets.directory` is `site/`, and `assets.binding` lets the Worker hand
non-`/vanish` misses back to the asset server so they 404 consistently.

```bash
./deploy/stage.sh preview       # preview URL, production untouched
./deploy/stage.sh production    # wrangler deploy
```

Assets are served **before** the Worker runs, so the landing page and
`/scrubber/` never pay for a Worker invocation and keep their `site/_headers`
response headers. Attaching the real domain is step 4.

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

## 4. Attach the domain

The Worker answers on `*.workers.dev` from its first deploy. Putting it on
`justintmccain.com` is a **custom domain**, declared in `wrangler.jsonc` so the
binding is reproducible from the repo instead of living as clicks in a
dashboard:

```jsonc
"routes": [
  { "pattern": "justintmccain.com",     "custom_domain": true },
  { "pattern": "www.justintmccain.com", "custom_domain": true }
]
```

Then apply it. Custom domains are a **trigger**, and triggers are not applied by
`versions upload` — only by a real deploy:

```bash
npx wrangler@latest deploy          # creates the domains + DNS records
```

Cloudflare creates the proxied records itself, issues the certificate, and
routes the hostname to the Worker. There is no A record to add by hand, and no
orange-cloud toggle to get wrong — a Worker custom domain is not a DNS-only
record. The domain must already be a zone in the same Cloudflare account.

Certificate issuance takes a few minutes; until it completes the hostname can
return a TLS error. That is expected and resolves on its own.

`/vanish` needs nothing extra. The proxy is inside this Worker, so it answers on
whatever hostname the Worker serves.

### The `/vanish` path, and one asymmetry

Vanish is a Next app with `trailingSlash: false`, so `/vanish` (no slash) is the
canonical URL and the one people type. Note the asymmetry, which is correct and
not a typo:

- `/vanish` — no trailing slash (Next canonical; `/vanish/` 301s to it)
- `/scrubber/` — trailing slash (static directory; `/scrubber` 301s to it)

Written this way both CTAs on the landing page resolve in a single hop.

---

## Staged review, before any DNS change

All of this is wrapped by `./deploy/stage.sh` — use that rather than the raw
commands, because it also runs the guards described below:

```bash
./deploy/stage.sh preflight                    # audits + builds + publish-dir check
./deploy/stage.sh vanish                       # Netlify draft deploy
./deploy/stage.sh preview                      # Worker preview URL, prod untouched
./deploy/stage.sh verify https://<preview-url>
./deploy/stage.sh production                   # canonical rebuild + wrangler deploy
```

`deploy/verify.mjs` runs ~35 assertions over a deployed URL: routing, the CSP
split, whether basePath survived, whether `/vanish/api/scan` is actually
mounted, and whether anything private shipped. It exits non-zero on failure, so
it works as a gate.

You can have both pieces live and reviewable on their platform URLs without
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

**2. Portfolio → Worker preview.** From the repo root:

```bash
npx wrangler@latest login
./deploy/stage.sh preview
```

Gives a `<version-id>-justintmccain-official.<subdomain>.workers.dev` URL
serving the landing page, `/scrubber/` **and** `/vanish` — production keeps
serving the previous version throughout. Promote a reviewed version with
`npx wrangler@latest versions deploy`, or just run `./deploy/stage.sh
production`.

**On the old staging-URL override.** Under Pages, `/vanish` 404'd on preview
hosts (the proxy was a separate Worker bound to the real domain), so previews
were built with `STAGING_VANISH_URL` pointing the link off-domain at
netlify.app. The proxy now lives in this Worker and answers on every hostname it
serves, so the override is no longer needed. `build.mjs` still honours it and
still prints a loud **STAGING BUILD** banner when it is set; `stage.sh` builds
with it explicitly unset and refuses to deploy if a staging host reaches the
output. Confirm any production build says `Tool links: canonical
(production-ready)`.

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
