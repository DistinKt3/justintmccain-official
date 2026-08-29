#!/usr/bin/env bash
#
# ============================================================================
# justintmccain.com — preview / production deploy
# ============================================================================
#
#   ./deploy/stage.sh preflight
#   ./deploy/stage.sh vanish
#   ./deploy/stage.sh preview
#   ./deploy/stage.sh verify https://<host> [https://<vanish-host>]
#   ./deploy/stage.sh production
#
# Run from the repo root. Neither CLI needs installing — npx fetches both.
#
# WHAT DEPLOYS WHAT
#   The site is ONE Cloudflare Worker (`justintmccain-official`) serving
#   site/ as static assets, with worker/index.js proxying /vanish to Netlify.
#   It is NOT Cloudflare Pages — it was, once, and every `wrangler pages`
#   command here failed after the move because the Pages project no longer
#   exists. `production` runs `wrangler deploy`; `preview` runs
#   `wrangler versions upload`, which returns a preview URL WITHOUT taking
#   production traffic.
#
#   A git push also deploys: the Worker has a Workers Builds integration, so
#   pushing to main ships to production on its own. Use `preview` when that is
#   not what you want.
#
# WHAT THIS SCRIPT WILL NOT DO
#   It will not log you in and it will not touch DNS. Both logins are browser
#   OAuth against your own accounts, and the DNS cutover is the one step that
#   changes what the public sees. Everything between those is automated here.
#
# WHY THERE IS NO STAGING-URL OVERRIDE ANY MORE
#   Under Pages, a preview could not serve /vanish (the proxy was a separate
#   Worker bound to the real domain), so previews were built with the tool link
#   pointed off-domain at netlify.app. The proxy now lives INSIDE this Worker,
#   so every hostname it serves — preview URLs included — answers /vanish
#   natively. The override is obsolete. The guard against it is not: build.mjs
#   still honours STAGING_VANISH_URL, so both `preview` and `production` build
#   with it unset and refuse to ship if a staging host reaches the output.
# ============================================================================

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

NETLIFY="npx --yes netlify-cli@latest"
WRANGLER="npx --yes wrangler@latest"

bold() { printf '\033[1m%s\033[0m\n' "$*"; }
ok()   { printf '  \033[32m✓\033[0m %s\n' "$*"; }
die()  { printf '\n  \033[31m✗ %s\033[0m\n\n' "$*" >&2; exit 1; }

# ---------------------------------------------------------------------------
build_all() {
  bold "Building Metadata Scrubber → site/scrubber/"
  ( cd tools/metadata-scrubber && npm run build >/dev/null 2>&1 )
  ok "scrubber built"

  bold "Building landing page → site/"
  ( cd build && node build.mjs | tail -3 )
}

# ---------------------------------------------------------------------------
cmd_preflight() {
  bold "Node"
  ok "node $(node --version), npm $(npm --version)"

  for app in metadata-scrubber vanish; do
    bold "Audit — $app"
    ( cd "tools/$app" && npm audit --audit-level=high >/dev/null 2>&1 ) \
      && ok "no high/critical vulnerabilities" \
      || die "$app has high/critical vulnerabilities — fix before deploying"
  done

  bold "Vanish production build"
  ( cd tools/vanish && NEXT_PUBLIC_BASE_PATH=/vanish npm run build >/dev/null 2>&1 ) \
    || die "Vanish build failed"
  ok "built with basePath=/vanish"

  # basePath is the single most breakable part of the whole arrangement: if it
  # silently reverts, every asset 404s only once it is behind the real domain.
  if grep -rq '"/_next/' tools/vanish/.next/server/app --include=*.html 2>/dev/null; then
    die "Vanish emitted bare /_next/ URLs — NEXT_PUBLIC_BASE_PATH did not apply"
  fi
  ok "no bare /_next/ URLs in output"

  build_all

  bold "Publish directory"
  local n; n=$(find site -type f | wc -l | tr -d ' ')
  [ "$n" -lt 500 ] || die "site/ has $n files — source has leaked back into the publish dir"
  ok "$n files, $(du -sh site | cut -f1)"

  if find site \( -name '*.ts' -o -name '*.tsx' -o -name '*.docx' -o -name 'package*.json' \) \
       -print -quit | grep -q .; then
    die "source files found in site/ — they would become public URLs"
  fi
  ok "no source, docs or configs in the publish dir"

  printf '\n'; bold "Pre-flight clean."
}

# ---------------------------------------------------------------------------
cmd_vanish() {
  bold "Deploying Vanish → Netlify (draft)"
  cd tools/vanish
  # --build runs the netlify.toml build command locally, which is what applies
  # NEXT_PUBLIC_BASE_PATH and attaches Netlify's Next runtime to /api/scan.
  $NETLIFY deploy --build
  printf '\n'
  bold "Next: confirm the draft URL serves /vanish and a scan completes."
  bold "Then re-run with --prod, or: ./deploy/stage.sh vanish-prod"
}

cmd_vanish_prod() {
  bold "Publishing Vanish → Netlify (production)"
  cd tools/vanish
  $NETLIFY deploy --build --prod
}

# ---------------------------------------------------------------------------
build_canonical() {
  ( cd tools/metadata-scrubber && npm run build >/dev/null 2>&1 )
  ( cd build && env -u STAGING_VANISH_URL -u STAGING_SCRUBBER_URL node build.mjs | tail -6 )
}

# The guard both deploy paths share. sitemap.xml is emitted ONLY when indexing
# is enabled, so it is checked only when it exists — grepping it unconditionally
# printed a "No such file or directory" error on every single deploy.
guard_output() {
  local files=(site/index.html)
  [ -f site/sitemap.xml ] && files+=(site/sitemap.xml)

  if grep -qE 'netlify\.app|pages\.dev' "${files[@]}"; then
    die "staging host found in the built output — refusing to deploy"
  fi
  ok "no staging hosts in output"

  grep -q 'href="/vanish"' site/index.html || die "canonical /vanish link missing"
  ok "canonical tool links"

  if [ -f site/sitemap.xml ]; then
    grep -q '<loc>https://justintmccain.com/' site/sitemap.xml \
      || die "sitemap lost its canonical URLs"
    ok "sitemap canonical"
  else
    ok "no sitemap (indexing disabled — expected)"
  fi
}

cmd_preview() {
  bold "PREVIEW build — no overrides"
  build_canonical
  guard_output

  # `versions upload` uploads a new Worker version and returns a preview URL
  # WITHOUT moving production traffic onto it. /vanish works there, because the
  # proxy is in this Worker rather than bound to the production hostname.
  bold "Uploading version → preview URL (production traffic unaffected)"
  $WRANGLER versions upload
}

# ---------------------------------------------------------------------------
cmd_verify() {
  local site_url="${1:-}" vanish_url="${2:-}"
  [ -n "$site_url" ] || die "usage: stage.sh verify https://<pages-host> [https://<vanish-host>]"
  node deploy/verify.mjs "$site_url" "$vanish_url"
}

# ---------------------------------------------------------------------------
cmd_production() {
  bold "PRODUCTION build — rebuilding from clean, no overrides"
  build_canonical
  guard_output

  bold "Deploying → Cloudflare Workers production"
  $WRANGLER deploy
}

# ---------------------------------------------------------------------------
case "${1:-}" in
  preflight)   cmd_preflight ;;
  vanish)      cmd_vanish ;;
  vanish-prod) cmd_vanish_prod ;;
  preview)     cmd_preview ;;
  site)        printf '  \033[33m!\033[0m `site` is now `preview` (no staging URL needed)\n'; cmd_preview ;;
  verify)      cmd_verify "${2:-}" "${3:-}" ;;
  production)  cmd_production ;;
  *)
    sed -n '2,41p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
    exit 1 ;;
esac
