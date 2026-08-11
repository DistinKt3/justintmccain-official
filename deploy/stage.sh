#!/usr/bin/env bash
#
# ============================================================================
# justintmccain.com — staging / production deploy
# ============================================================================
#
#   ./deploy/stage.sh preflight
#   ./deploy/stage.sh vanish
#   ./deploy/stage.sh site   https://<vanish-host>/vanish
#   ./deploy/stage.sh verify https://<pages-host> https://<vanish-host>
#   ./deploy/stage.sh production
#
# Run from the repo root. Neither CLI needs installing — npx fetches both.
#
# WHAT THIS SCRIPT WILL NOT DO
#   It will not log you in and it will not touch DNS. Both logins are browser
#   OAuth against your own accounts, and the DNS cutover is the one step that
#   changes what the public sees. Everything between those is automated here.
#
# THE FAILURE THIS SCRIPT EXISTS TO PREVENT
#   `site` builds with the tool link pointed OFF-DOMAIN so /vanish is clickable
#   on a *.pages.dev preview, where the Cloudflare Worker route does not exist.
#   That build must never reach production. `production` rebuilds from clean
#   and refuses to continue if any staging URL survived into the output.
# ============================================================================

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PAGES_PROJECT="${PAGES_PROJECT:-justintmccain}"
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
cmd_site() {
  local vanish_url="${1:-}"
  [ -n "$vanish_url" ] || die "usage: stage.sh site https://<vanish-host>/vanish"

  bold "Building STAGING site (tool link → $vanish_url)"
  ( cd tools/metadata-scrubber && npm run build >/dev/null 2>&1 )
  ( cd build && STAGING_VANISH_URL="$vanish_url" node build.mjs | tail -8 )

  grep -q "$vanish_url" site/index.html || die "staging URL did not make it into index.html"
  ok "staging link present"

  grep -q '<loc>https://justintmccain.com/vanish</loc>' site/sitemap.xml \
    || die "sitemap lost its canonical URL — it must never point at a staging host"
  ok "sitemap still canonical"

  bold "Deploying → Cloudflare Pages ($PAGES_PROJECT)"
  $WRANGLER pages deploy site --project-name "$PAGES_PROJECT" --branch staging --commit-dirty=true
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
  ( cd tools/metadata-scrubber && npm run build >/dev/null 2>&1 )
  ( cd build && env -u STAGING_VANISH_URL -u STAGING_SCRUBBER_URL node build.mjs | tail -6 )

  # The whole point of this command. A staging host reaching production would
  # leave an off-domain link in the page indefinitely and nothing would alert.
  if grep -qE 'netlify\.app|pages\.dev' site/index.html site/sitemap.xml; then
    die "staging host found in the built output — refusing to deploy"
  fi
  ok "no staging hosts in output"

  grep -q 'href="/vanish"' site/index.html || die "canonical /vanish link missing"
  ok "canonical tool links"

  bold "Deploying → Cloudflare Pages production"
  $WRANGLER pages deploy site --project-name "$PAGES_PROJECT" --branch main --commit-dirty=true
}

# ---------------------------------------------------------------------------
case "${1:-}" in
  preflight)   cmd_preflight ;;
  vanish)      cmd_vanish ;;
  vanish-prod) cmd_vanish_prod ;;
  site)        cmd_site "${2:-}" ;;
  verify)      cmd_verify "${2:-}" "${3:-}" ;;
  production)  cmd_production ;;
  *)
    sed -n '2,30p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
    exit 1 ;;
esac
