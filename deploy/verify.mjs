#!/usr/bin/env node
/**
 * ============================================================================
 * Post-deploy verification
 * ============================================================================
 *
 *   node deploy/verify.mjs https://<site-host> [https://<vanish-host>]
 *
 * Checks the things that are invisible until they are wrong in production:
 * routing, the CSP split between the static site and the SPA, whether the
 * basePath survived the deploy, and whether anything private shipped.
 *
 * Zero dependencies, Node built-ins only — same discipline as build.mjs.
 *
 * Exits non-zero if any REQUIRED check fails. Warnings do not fail the run:
 * a staging deploy legitimately has no Worker, so /vanish 404ing there is
 * expected rather than broken, and the script says which is which.
 */

const [, , SITE, VANISH] = process.argv;

if (!SITE) {
  console.error("usage: node deploy/verify.mjs https://<site-host> [https://<vanish-host>]");
  process.exit(1);
}

const strip = (u) => u.replace(/\/+$/, "");
const site = strip(SITE);
const vanish = VANISH ? strip(VANISH) : null;

let failures = 0;
let warnings = 0;

const C = { ok: "\x1b[32m", bad: "\x1b[31m", warn: "\x1b[33m", dim: "\x1b[2m", off: "\x1b[0m" };

function report(level, label, detail) {
  const mark = level === "ok" ? `${C.ok}✓${C.off}` : level === "warn" ? `${C.warn}!${C.off}` : `${C.bad}✗${C.off}`;
  if (level === "bad") failures++;
  if (level === "warn") warnings++;
  console.log(`  ${mark} ${label}${detail ? `  ${C.dim}${detail}${C.off}` : ""}`);
}

async function head(url) {
  try {
    const r = await fetch(url, { redirect: "manual" });
    return { status: r.status, headers: r.headers, ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function text(url) {
  try {
    const r = await fetch(url, { redirect: "follow" });
    return { status: r.status, body: await r.text(), headers: r.headers };
  } catch (e) {
    return { status: 0, body: "", error: e.message };
  }
}

console.log(`\n\x1b[1mVerifying ${site}\x1b[0m\n`);

/* -- routing -------------------------------------------------------------- */
/* Accepts a SET of statuses, because the two hosts normalise URLs differently
   and both are correct:
     - Cloudflare Workers Static Assets 307s /scrubber → /scrubber/ and
       /privacy.html → /privacy (extensionless is canonical there)
     - a literal file server 301s the directory and serves .html directly
   Pinning one number here would fail a healthy deploy on the other host. */
console.log("Routing");
for (const [path, want, required] of [
  ["/", [200], true],
  ["/privacy", [200], true],                 // canonical; what the footer links to
  ["/privacy.html", [200, 307, 301], true],  // legacy filename: served or redirected
  ["/scrubber/", [200], true],
  ["/scrubber", [301, 307], true],
  ["/sitemap.xml", [404], true],   // withheld on purpose — see FLAGS.ALLOW_INDEXING
  ["/robots.txt", [200], true],
]) {
  const r = await head(site + path);
  if (!r.ok) { report("bad", `${path}`, r.error); continue; }
  const good = want.includes(r.status);
  report(good ? "ok" : required ? "bad" : "warn", `${path}`,
    `${r.status}${good ? (r.loc ? ` → ${r.loc}` : "") : ` (expected ${want.join(" or ")})`}`);
}

/* -- the Scrubber actually works ------------------------------------------ */
console.log("\nScrubber");
{
  const page = await text(`${site}/scrubber/`);
  const assets = [...page.body.matchAll(/(?:src|href)="([^"]*\/scrubber\/[^"]+)"/g)].map((m) => m[1]);
  report(assets.length ? "ok" : "bad", "assets carry the /scrubber/ prefix", `${assets.length} refs`);

  const bare = [...page.body.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)];
  report(bare.length === 0 ? "ok" : "bad", "no root-absolute asset URLs", bare.length ? bare[0][1] : "");

  // Every referenced asset must actually resolve, or the SPA is a white page.
  let broken = 0;
  for (const a of assets.slice(0, 6)) {
    const r = await head(a.startsWith("http") ? a : site + a);
    if (!r.ok || r.status >= 400) broken++;
  }
  report(broken === 0 ? "ok" : "bad", "referenced assets resolve", broken ? `${broken} broken` : "");
}

/* -- CSP ------------------------------------------------------------------ */
console.log("\nContent-Security-Policy");
{
  const root = await head(`${site}/`);
  const rootCsp = root.headers?.get("content-security-policy") ?? "";
  report(rootCsp.includes("default-src 'none'") ? "ok" : "bad", "root is default-src 'none'");
  report(rootCsp.includes("connect-src 'none'") ? "ok" : "bad", "root makes no outbound connections");

  const scr = await head(`${site}/scrubber/`);
  const scrCsp = scr.headers?.get("content-security-policy") ?? "";
  report(scrCsp.includes("default-src 'self'") ? "ok" : "bad", "/scrubber/ has its own scoped policy");
  report(
    scrCsp.includes("connect-src 'self'") ? "ok" : "bad",
    "/scrubber/ cannot reach a third party",
    "backs the \"nothing is uploaded\" claim"
  );
  // If these ever match, the scoped override stopped applying and the SPA is
  // running under a policy that cannot load its own hash-named bundle.
  report(rootCsp && scrCsp && rootCsp !== scrCsp ? "ok" : "bad", "the two policies are distinct");
}

/* -- hardening ------------------------------------------------------------ */
console.log("\nHeaders");
{
  const r = await head(`${site}/`);
  const h = r.headers;
  for (const [name, want] of [
    ["strict-transport-security", "max-age="],
    ["referrer-policy", "no-referrer"],
    ["x-content-type-options", "nosniff"],
    ["x-frame-options", "DENY"],
  ]) {
    const v = h?.get(name) ?? "";
    report(v.includes(want) ? "ok" : "bad", name, v || "missing");
  }
  const perms = h?.get("permissions-policy") ?? "";
  report(perms.includes("browsing-topics=()") ? "ok" : "warn", "permissions-policy opts out of Topics");
}

/* -- duplicate headers ----------------------------------------------------- */
/* Cloudflare's _headers INHERITS from every matching rule rather than
   overriding, so a path matched by both `/*` and a specific rule gets TWO of
   the same header unless the specific rule detaches first with `! Name`.
   That failure is invisible in a browser and broke every cache rule and the
   Scrubber's CSP once already, so it is asserted rather than trusted. */
console.log("\nHeader hygiene (one value per header, not merged)");
{
  const cachePaths = [
    ["/", "must-revalidate"],
    ["/css/main.css", "immutable"],
    ["/js/main.js", "immutable"],
    ["/robots.txt", "3600"],
    ["/sitemap.xml", "3600"],
  ];
  for (const [p, expect] of cachePaths) {
    const r = await head(site + p);
    const cc = r.headers?.get("cache-control") ?? "";
    const n = (cc.match(/max-age/g) || []).length;
    const good = n === 1 && cc.includes(expect);
    report(good ? "ok" : "bad", `cache-control ${p}`, n > 1 ? `MERGED: ${cc}` : cc || "missing");
  }

  for (const p of ["/", "/scrubber/"]) {
    const r = await head(site + p);
    const csp = r.headers?.get("content-security-policy") ?? "";
    const n = (csp.match(/default-src/g) || []).length;
    report(n === 1 ? "ok" : "bad", `single CSP on ${p}`,
      n > 1 ? "TWO policies — browser will intersect them and clamp the app" : `${n}`);
  }

  const og = await head(`${site}/og/og-image.png`);
  const corp = og.headers?.get("cross-origin-resource-policy") ?? "";
  report(corp === "cross-origin" ? "ok" : "bad", "share card CORP", corp || "missing");
}

/* -- nothing private shipped ---------------------------------------------- */
console.log("\nLeakage");
for (const path of [
  "/vanish/Vanish_PRD.docx",
  "/tools/vanish/src/lib/brokers.ts",
  "/scrubber/src/App.tsx",
  "/metadata-scrubber/package.json",
  "/.DS_Store",
  "/.claude/settings.local.json",
]) {
  const r = await head(site + path);
  const gone = !r.ok || r.status === 404;
  report(gone ? "ok" : "bad", `${path}`, gone ? "404" : `EXPOSED (${r.status})`);
}

/* -- discovery suppression ------------------------------------------------- */
/* This site is shared, not found. Each of these is one half of that: the meta
   tag covers HTML, the header covers everything that is not HTML, robots.txt
   must still permit the crawl (or the noindex is never read), and the schema
   and sitemap must be absent rather than merely ignored. */
console.log("\nDiscovery suppression");
{
  for (const p of ["/", "/privacy", "/scrubber/"]) {
    const page = await text(site + p);
    const meta = (page.body.match(/<meta name="robots" content="([^"]*)"/) || [])[1];
    // The Scrubber is a separate build with no meta tag of its own; the header
    // is what covers it, so a missing meta there is expected, not a failure.
    if (p === "/scrubber/") {
      report("ok", `${p} (header-covered, no meta expected)`, meta ?? "no meta");
    } else {
      report(meta?.includes("noindex") ? "ok" : "bad", `meta robots ${p}`, meta ?? "MISSING");
    }

    const h = await head(site + p);
    const xr = h.headers?.get("x-robots-tag") ?? "";
    report(xr.includes("noindex") ? "ok" : "bad", `X-Robots-Tag ${p}`, xr || "MISSING");
  }

  // Non-HTML cannot carry a meta tag, so the header is the only thing covering
  // it. The share card is the one that matters most — it is an image of the
  // page's own headline.
  for (const p of ["/og/og-image.png", "/assets/motion/signal-master.mp4"]) {
    const h = await head(site + p);
    const xr = h.headers?.get("x-robots-tag") ?? "";
    report(xr.includes("noindex") ? "ok" : "bad", `X-Robots-Tag ${p}`, xr || "MISSING");
  }

  const home = await text(`${site}/`);
  report(!/application\/ld\+json/.test(home.body), "no Person schema", "");
  report(!/worksFor/.test(home.body) ? "ok" : "bad", "no employer in structured data", "");

  // OG must SURVIVE. It is what makes a shared link render a card, and it is
  // not a search signal — losing it would break the only distribution path.
  report(/og:title/.test(home.body) ? "ok" : "bad", "og:title still present (sharing works)", "");
  report(/og:image/.test(home.body) ? "ok" : "bad", "og:image still present", "");

  const robots = await text(`${site}/robots.txt`);
  const blanketBlock = /User-agent:\s*\*[\s\S]{0,80}?Disallow:\s*\/\s*$/m.test(robots.body);
  report(!blanketBlock, "robots.txt does NOT blanket-Disallow",
    blanketBlock ? "a blocked crawler can never read the noindex" : "crawl allowed so noindex is seen");
  report(!/^Sitemap:/m.test(robots.body), "robots.txt advertises no sitemap", "");
  report(/GPTBot/.test(robots.body) ? "ok" : "warn", "AI crawlers named explicitly", "");
}

/* -- Vanish --------------------------------------------------------------- */
console.log("\nVanish");
{
  const onDomain = await head(`${site}/vanish`);
  if (onDomain.ok && onDomain.status === 200) {
    report("ok", "/vanish on the main domain", "the Worker route is live");
  } else {
    report(
      "warn",
      "/vanish on the main domain",
      `${onDomain.status ?? "unreachable"} — expected on a staging host, where no Worker route exists`
    );
  }

  if (!vanish) {
    report("warn", "direct Vanish host not checked", "pass it as the 2nd argument");
  } else {
    for (const [path, want] of [["/vanish", 200], ["/vanish/about", 200], ["/vanish/brokers", 200]]) {
      const r = await head(vanish + path);
      report(r.ok && r.status === want ? "ok" : "bad", `${path}`, `${r.status ?? "unreachable"}`);
    }
    const home = await text(`${vanish}/vanish`);
    const bare = (home.body.match(/"\/_next\//g) || []).length;
    report(bare === 0 ? "ok" : "bad", "no bare /_next/ URLs", bare ? `${bare} found — basePath did not apply` : "");
    const prefixed = (home.body.match(/\/vanish\/_next\//g) || []).length;
    report(prefixed > 0 ? "ok" : "bad", "assets carry the /vanish prefix", `${prefixed} refs`);

    // The scan endpoint must exist and must refuse a GET. A 405/400 proves the
    // route is mounted; a 404 means the Node runtime did not attach and every
    // scan will fail once someone actually tries one.
    const api = await head(`${vanish}/vanish/api/scan`);
    const mounted = api.ok && api.status !== 404;
    report(mounted ? "ok" : "bad", "/vanish/api/scan is mounted", `${api.status} on GET`);
  }
}

/* -- summary -------------------------------------------------------------- */
console.log("");
if (failures) {
  console.log(`\x1b[31m\x1b[1m${failures} check(s) failed\x1b[0m${warnings ? `, ${warnings} warning(s)` : ""}\n`);
  process.exit(1);
}
console.log(`\x1b[32m\x1b[1mAll checks passed\x1b[0m${warnings ? ` (${warnings} warning(s) — see above)` : ""}\n`);
