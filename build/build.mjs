#!/usr/bin/env node
/**
 * ============================================================================
 * Justin T. McCain — SIGNAL · static site generator
 * ============================================================================
 *
 *   node build.mjs
 *
 * Reads src/content.mjs (the single source of truth for every word and number)
 * and writes index.html + privacy.html as plain static files.
 *
 * WHY A BUILD STEP AT ALL:
 *   brand/03 requires every proof metric to be real, crawlable text — not
 *   injected by JavaScript. brand/06 §maintainability requires copy and metrics
 *   to live in ONE place so a number changes once. Those two pull against each
 *   other in a hand-written static file. This 0-dependency generator (Node
 *   built-ins only, no npm, no lockfile) resolves it: author once, emit static.
 *
 *   The generated HTML is committed. The site deploys as pure static files and
 *   never needs Node again unless you change the content.
 *
 * SECURITY NOTE: content.mjs is a trusted authored source file, not user input.
 * Fields may intentionally contain inline markup (<strong>). Attribute values
 * are escaped; body copy is passed through by design.
 */

import { writeFileSync, readdirSync, unlinkSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  FLAGS, IDENTITY, META, METRICS, NAV, HERO, THESIS, WORK, LEDGER,
  CAPABILITIES, ABOUT, TESTIMONIALS, TOOLS, WRITING, PORTFOLIO, CONTACT, FOOTER, PRIVACY_PAGE,
} from "./content.mjs";

/* This file lives in build/, which is NEVER deployed, and writes into site/,
   which is the Cloudflare Pages output directory. Pages publishes its output
   directory wholesale with no exclude mechanism, so anything sitting in site/
   is a public URL. Keeping the generator, the content source and the asset log
   out of it is what stops content.mjs (which documents which figures were
   withheld and why) from being fetchable at /src/content.mjs. */
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "site");

/* Bump when CSS/JS change so caches don't serve stale assets. */
const ASSET_VERSION = "13";

/* Canonical URL PATHS, which are deliberately not the same as the output
   FILENAMES.

   The site is served by Cloudflare Workers Static Assets, whose default
   html_handling makes extensionless URLs canonical: privacy.html is served at
   /privacy, and a request for /privacy.html gets a 307 to it (likewise
   /index.html → /). Linking to the filename therefore costs every visitor a
   redirect hop, and — worse — puts a redirecting URL in both the sitemap and
   the <link rel="canonical">, which is exactly where a canonical URL is
   supposed to be the final one.

   The emitted FILES keep their .html names; only the links change. Both are
   defined here so they cannot drift apart.

   If this ever moves to a host that serves paths literally, these two
   constants are the only thing to change. build/serve.mjs resolves
   extensionless paths the same way so the local preview does not disagree
   with production about a real URL. */
const URL_HOME = "/";
const URL_PRIVACY = "/privacy";

/* The branch Cloudflare Pages treats as production. Everything else it builds
   is a preview, and previews link to tool deployments differently — see
   toolHref(). Change this only if the Pages project's production branch
   changes, and change it in both places at once. */
const PRODUCTION_BRANCH = "main";

/* -- helpers -------------------------------------------------------------- */
const attr = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const esc = (s) =>
  String(s).replace(/&(?!(?:[a-zA-Z]+|#\d+|#x[\da-fA-F]+);)/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const v = (p) => `${p}?v=${ASSET_VERSION}`;
const year = new Date().getFullYear();

/* -- shared chrome -------------------------------------------------------- */

const LINKEDIN_GLYPH = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM2.4 21.5h5.16V9.4H2.4v12.1Zm7.7-12.1h4.95v1.65h.07c.69-1.24 2.37-2.05 4.06-2.05 4.34 0 5.14 2.68 5.14 6.17v6.33h-5.15v-5.61c0-1.34-.03-3.06-1.94-3.06-1.95 0-2.25 1.45-2.25 2.96v5.71H10.1V9.4Z"/></svg>`;

/* JTM monogram: three letters sharing one signal baseline that terminates in a
   filled node — signal enters, is enforced, stops clean. (brand/01 §3.1) */
const MONOGRAM = `
      <a class="monogram" href="#top" aria-label="${attr(IDENTITY.name)}, back to top">
        <svg width="62" height="20" viewBox="0 0 62 20" role="img" aria-hidden="true" focusable="false">
          <text x="0" y="14" font-family="Space Grotesk, sans-serif" font-size="14"
                font-weight="500" letter-spacing="1.2" fill="#EEF2F6">JTM</text>
          <line x1="0" y1="17.5" x2="49" y2="17.5" stroke="#5FE3C4" stroke-width="1.25"/>
          <circle class="monogram__seal" cx="54" cy="17.5" r="3.2" fill="#E9B44C"/>
        </svg>
      </a>`;

const head = ({ title, description, canonical, extraMeta = "", jsonld = "" }) => `<!DOCTYPE html>
<html lang="en" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${attr(description)}">
<link rel="canonical" href="${attr(canonical)}">
<meta name="robots" content="${FLAGS.ALLOW_INDEXING ? "index, follow, max-image-preview:large" : "noindex, nofollow, noarchive, nosnippet"}">
<meta name="theme-color" content="${attr(META.themeColor)}">
<meta name="color-scheme" content="dark light">
<meta name="author" content="${attr(IDENTITY.name)}">
${extraMeta}
<link rel="icon" href="${v("favicon.svg")}" type="image/svg+xml">
<link rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<link rel="manifest" href="site.webmanifest">

<!-- Fonts are self-hosted. No Google Fonts CDN: that request would leak the
     visitor's IP to a third party, which this site does not do. (brand/07) -->
<link rel="preload" href="assets/fonts/space-grotesk-var.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/fonts/inter-var.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${v("css/main.css")}">
<script>document.documentElement.classList.remove('no-js');</script>
${jsonld}
</head>`;

const nav = (isDoc = false) => `
  <header class="nav" id="top">
    ${MONOGRAM}
    <nav class="nav__links" aria-label="Primary">
      ${isDoc
        ? `<a class="nav__link" href="${URL_HOME}">← Back</a>`
        : NAV.links
            .map(
              (l) =>
                `<a class="nav__link${l.label === "Proof" ? " nav__link--proof" : ""}" href="${attr(l.href)}">${esc(l.label)}</a>`
            )
            .join("\n      ")}
      <a class="nav__li" href="${attr(IDENTITY.linkedin)}" aria-label="${attr(IDENTITY.name)} on LinkedIn (opens in a new tab)" target="_blank" rel="noopener">${LINKEDIN_GLYPH}</a>
    </nav>
  </header>`;

const footer = () => `
  <footer class="footer">
    <div class="wrap">
      <div class="footer__top">
        <div class="footer__id">
          <span class="footer__name"><span class="node" aria-hidden="true"></span> ${esc(IDENTITY.name)}</span>
          <span class="footer__role">${esc(IDENTITY.role)}</span>
        </div>
        <div class="footer__links">
          <a href="${attr(IDENTITY.linkedin)}" target="_blank" rel="noopener">LinkedIn</a>
          <a href="mailto:${attr(IDENTITY.email)}">${esc(IDENTITY.email)}</a>
          <a href="${URL_PRIVACY}">Privacy</a>
        </div>
      </div>
      <p class="footer__privacy">${esc(FOOTER.privacyNote)} <a href="${URL_PRIVACY}">${esc(FOOTER.privacyLinkLabel)} →</a></p>
      <p class="footer__copy">© ${year} ${esc(IDENTITY.name)}. Built with respect for your attention and your data.</p>
    </div>
  </footer>`;

/* -- index.html ----------------------------------------------------------- */

const ogMeta = `
<meta property="og:type" content="profile">
<meta property="og:site_name" content="${attr(IDENTITY.name)}">
<meta property="og:title" content="${attr(META.ogTitle)}">
<meta property="og:description" content="${attr(META.ogDescription)}">
<meta property="og:image" content="${attr(IDENTITY.origin)}/og/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${attr(META.ogImageAlt)}">
<meta property="og:url" content="${attr(IDENTITY.origin)}/">
<meta property="profile:first_name" content="${attr(IDENTITY.firstName)}">
<meta property="profile:last_name" content="${attr(IDENTITY.lastName)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${attr(META.twitterTitle)}">
<meta name="twitter:description" content="${attr(META.twitterDescription)}">
<meta name="twitter:image" content="${attr(IDENTITY.origin)}/og/og-image.png">
<meta name="twitter:image:alt" content="${attr(META.ogImageAlt)}">`;

/* Person schema — emitted ONLY when indexing is wanted.
   ---------------------------------------------------------------------------
   This block is not decoration; it is the single strongest discovery signal on
   the page. It states, in a format built for machines to consume, that a named
   person holds a named job at a named employer and is knowledgeable about ten
   named subjects. That is exactly the query shape we are trying not to appear
   in — employer plus "privacy" — and it is Knowledge-Panel-eligible input.

   A noindex directive alone would very probably be enough. Withholding the
   schema means not depending on "very probably". Flip FLAGS.ALLOW_INDEXING to
   restore it; nothing else needs to change.

   NOTE: this deliberately does NOT touch the Open Graph or Twitter tags above.
   Those are read by LinkedIn, Slack and iMessage when a recipient opens a link
   that was sent to them — a sharing feature, not a search signal. Removing
   them would break the preview card and gain nothing. */
const jsonld = !FLAGS.ALLOW_INDEXING ? "" : `<script type="application/ld+json">
${JSON.stringify(
  {
    "@context": "https://schema.org",
    "@type": "Person",
    name: IDENTITY.name,
    jobTitle: IDENTITY.role,
    description:
      "Privacy Product Leader building consumer privacy infrastructure at global scale: DSAR platforms, consent management, GPC signal enforcement, and data governance.",
    url: `${IDENTITY.origin}/`,
    image: `${IDENTITY.origin}/og/og-image.png`,
    email: `mailto:${IDENTITY.email}`,
    sameAs: [IDENTITY.linkedin],
    knowsAbout: [
      "Consumer Privacy Infrastructure", "GDPR", "CPRA", "LGPD", "VPPA",
      "DSAR", "Consent Management", "Global Privacy Control", "Data Governance",
      "Privacy by Design",
    ],
    hasCredential: {
      "@type": "EducationalOccupationalCredential",
      credentialCategory: "certification",
      name: "Certified Information Privacy Manager (CIPM), IAPP",
    },
    worksFor: { "@type": "Organization", name: "Roku" },
  },
  null,
  2
)}
</script>`;

/* Sections ---------------------------------------------------------------- */

const heroSection = () => `
      <section class="section hero" aria-labelledby="hero-title">
        <div class="wrap">
          <p class="hero__name" data-reveal>${esc(IDENTITY.name)}<span class="node node--amber" aria-hidden="true"></span></p>
          <p class="hero__eyebrow" data-reveal>${esc(HERO.eyebrow)}</p>
          <h1 class="hero__title" id="hero-title" data-reveal data-reveal-delay="1">
            ${HERO.headline.map((l) => `<span>${esc(l)}</span>`).join("\n            ")}
          </h1>
          <p class="hero__sub" data-reveal data-reveal-delay="2">${esc(HERO.sub)}</p>
          <p class="hero__proof" data-reveal data-reveal-delay="3">
            <span class="node node--amber" aria-hidden="true"></span>
            <span>${esc(HERO.proof)}</span>
          </p>
          <div class="ctas" data-reveal data-reveal-delay="3">
            <a class="btn btn--primary" href="${attr(HERO.ctaPrimary.href)}" target="_blank" rel="noopener">${esc(HERO.ctaPrimary.label)}</a>
            <a class="btn btn--ghost" href="${attr(HERO.ctaSecondary.href)}">${esc(HERO.ctaSecondary.label)}</a>
          </div>
        </div>
      </section>`;

const thesisSection = () => {
  const paras = THESIS.paragraphs.map((p, i) => {
    const text = p.includes(THESIS.pullPhrase)
      ? esc(p).replace(esc(THESIS.pullPhrase), `<em>${esc(THESIS.pullPhrase)}</em>`)
      : esc(p);
    return `<p data-reveal data-reveal-delay="${Math.min(i, 3)}">${text}</p>`;
  });
  return `
      <section class="section thesis" id="thesis" aria-labelledby="thesis-label">
        <div class="wrap measure">
          <p class="label" id="thesis-label" data-reveal><span class="node" aria-hidden="true"></span> ${esc(THESIS.label)}</p>
          <div class="thesis__body">
            ${paras.join("\n            ")}
          </div>
        </div>
      </section>`;
};

const workSection = () => `
      <section class="section work" id="work" aria-labelledby="work-heading">
        <div class="wrap">
          <div class="work__head">
            <p class="label" data-reveal><span class="node" aria-hidden="true"></span> ${esc(WORK.label)}</p>
            <h2 id="work-heading" data-reveal data-reveal-delay="1">${esc(WORK.heading)}</h2>
          </div>
        </div>
        <div class="wrap">
          <div class="cards">
            ${WORK.cards
              .map(
                (c, i) => `<article class="card" data-reveal data-reveal-delay="${Math.min(i, 3)}">
              <div class="card__top">
                <h3 class="card__title">${esc(c.title)}</h3>
                <span class="card__tag">${esc(c.tag)}</span>
              </div>
              <div class="card__row"><span class="card__k">Broken</span><span class="card__v">${c.broken}</span></div>
              <div class="card__row"><span class="card__k">Built</span><span class="card__v">${c.built}</span></div>
              <div class="card__row card__row--moved"><span class="card__k">Moved</span><span class="card__v">${c.moved}</span></div>
            </article>`
              )
              .join("\n            ")}
          </div>
        </div>
      </section>`;

const ledgerSection = () => `
      <section class="section ledger" id="proof" aria-labelledby="proof-heading">
        <div class="wrap">
          <p class="label" data-reveal><span class="node" aria-hidden="true"></span> ${esc(LEDGER.label)}</p>
          <h2 id="proof-heading" data-reveal data-reveal-delay="1">${esc(LEDGER.heading)}</h2>
          <table class="ledger__table">
            <caption class="visually-hidden">Record of shipped privacy infrastructure and its measured impact</caption>
            <thead><tr><th scope="col">Marker</th><th scope="col">Record</th><th scope="col">Proof</th></tr></thead>
            <tbody>
              ${LEDGER.rows
                .map(
                  (r) => `<tr data-reveal>
                <td class="ledger__mark"><span class="node" aria-hidden="true"></span></td>
                <td class="ledger__record">${esc(r.record)}</td>
                <td class="ledger__proof">${r.proof}</td>
              </tr>`
                )
                .join("\n              ")}
            </tbody>
          </table>
          <div class="scope" data-reveal>
            ${LEDGER.scopeStrip.map((s) => `<span>${esc(s)}</span>`).join("\n            ")}
          </div>
        </div>
      </section>`;

const capabilitiesSection = () => `
      <section class="section capabilities" id="capabilities" aria-labelledby="cap-label">
        <div class="wrap">
          <p class="label" id="cap-label" data-reveal><span class="node" aria-hidden="true"></span> ${esc(CAPABILITIES.label)}</p>
        </div>
        <div class="wrap">
          <div class="pillars">
            ${CAPABILITIES.pillars
              .map(
                (p, i) => `<article class="pillar" data-reveal data-reveal-delay="${i}">
              <span class="pillar__n">0${i + 1}</span>
              <h3 class="pillar__name">${esc(p.name)}</h3>
              <p class="pillar__claim">${esc(p.claim)}</p>
              <p class="pillar__detail">${esc(p.detail)}</p>
            </article>`
              )
              .join("\n            ")}
          </div>
          <article class="emerging" data-reveal>
            <span class="pillar__n">EMERGING</span>
            <h3 class="pillar__name">${esc(CAPABILITIES.emerging.name)}</h3>
            <p class="pillar__claim">${esc(CAPABILITIES.emerging.claim)}</p>
            <p class="pillar__detail">${esc(CAPABILITIES.emerging.detail)}</p>
          </article>
          <p class="competencies" data-reveal>${esc(CAPABILITIES.competencies)}</p>
        </div>
      </section>`;

const aboutSection = () => {
  const p = ABOUT.portrait;
  const portrait = p.ready
    ? `<img src="${attr(p.src)}" alt="${attr(p.alt)}" width="800" height="1000" loading="lazy" decoding="async">`
    : `<span class="portrait__cap">Portrait reserved</span>`;
  return `
      <section class="section about" id="about" aria-labelledby="about-label">
        <div class="wrap">
          <p class="label" id="about-label" data-reveal><span class="node" aria-hidden="true"></span> ${esc(ABOUT.label)}</p>
          <div class="about__grid">
            <figure class="portrait${p.ready ? "" : " portrait--placeholder"}" data-reveal>${portrait}</figure>
            <div class="about__body" data-reveal data-reveal-delay="1">
              ${ABOUT.paragraphs.map((t) => `<p>${esc(t)}</p>`).join("\n              ")}
              <blockquote class="pull">
                <span class="node node--amber" aria-hidden="true"></span>
                <span>${esc(ABOUT.pullQuote)}</span>
              </blockquote>
              <p class="credential">${esc(ABOUT.credential)}</p>
            </div>
          </div>
        </div>
      </section>`;
};

/* §6b — the human proof. Deliberately NOT the Work card treatment: these are
   quiet left-ruled blocks, not boxed panels, because this sits in the stretch
   where the signal quiets. The trailing cell is the LinkedIn hand-off, which
   also squares off the 5-quote grid. Real <blockquote>/<cite> semantics. */
const testimonialsSection = () => `
      <section class="section testimonials" id="testimonials" aria-labelledby="testimonials-label">
        <div class="wrap">
          <p class="label" id="testimonials-label" data-reveal><span class="node" aria-hidden="true"></span> ${esc(TESTIMONIALS.label)}</p>
          <h2 class="testimonials__head" data-reveal data-reveal-delay="1">${esc(TESTIMONIALS.heading)}</h2>
          <p class="testimonials__note" data-reveal data-reveal-delay="1">${esc(TESTIMONIALS.note)}</p>
          <div class="quotes">
            ${TESTIMONIALS.quotes
              .map(
                (q, i) => `<figure class="quote" data-reveal data-reveal-delay="${Math.min(i, 3)}">
              <blockquote class="quote__body"><p>${esc(q.quote)}</p></blockquote>
              <figcaption class="quote__by">
                <span class="node" aria-hidden="true"></span>
                <span><cite class="quote__name">${esc(q.name)}</cite><span class="quote__title">${esc(q.title)}</span></span>
              </figcaption>
            </figure>`
              )
              .join("\n            ")}
            <a class="quote quote--more" href="${attr(TESTIMONIALS.source.href)}" target="_blank" rel="noopener" data-reveal>
              <span class="quote__more-label">${esc(TESTIMONIALS.source.label)}</span>
              <span class="quote__more-go" aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </section>`;

/* Staging override for the tool links.
   ---------------------------------------------------------------------------
   In production both tools answer on this domain: /scrubber/ ships inside the
   Pages project and /vanish is proxied to Netlify by a Cloudflare Worker. That
   Worker is bound to a ROUTE ON THE REAL ZONE, so on a *.pages.dev preview URL
   it does not exist and /vanish would 404 — which makes a pre-DNS review of the
   finished page impossible for exactly the tool most worth reviewing.

   So the link target can be pointed elsewhere at build time:

     STAGING_VANISH_URL=https://xyz.netlify.app/vanish node build.mjs

   The env key is derived from the canonical path, so /scrubber/ takes
   STAGING_SCRUBBER_URL. The SITEMAP deliberately ignores all of this and always
   emits the canonical justintmccain.com URL — a staging build must never
   publish a sitemap pointing at netlify.app.

   A build that used an override announces it loudly at the end, because the
   failure this guards against is shipping a staging build to production and
   leaving a netlify.app link in the page forever. */
const toolHref = (t) => {
  /* 1. Explicit override, for a local staging build:
        STAGING_VANISH_URL=https://… node build.mjs                          */
  const key = `STAGING_${t.href.replace(/\//g, "").toUpperCase()}_URL`;
  if (process.env[key]) return process.env[key];

  /* 2. Automatic, on a Cloudflare Pages PREVIEW branch.
        Pages sets CF_PAGES_BRANCH on every build. On any branch that is not
        production there is no Worker route bound to the preview hostname, so
        a canonical /vanish would 404 on exactly the page a reviewer opens
        first. Netlify names its branch deploys <branch>--<site>.netlify.app
        and Vanish builds from the same commit on the same branch, so the two
        previews can be pointed at each other with no manual step.

        NETLIFY_SITE_NAME is set once in the Pages dashboard. Without it this
        falls through to the canonical path rather than guessing a hostname —
        a 404 on a preview is recoverable; a link to someone else's netlify
        subdomain is not. */
  const branch = process.env.CF_PAGES_BRANCH;
  const netlifySite = process.env.NETLIFY_SITE_NAME;
  const isPreview = branch && branch !== PRODUCTION_BRANCH;

  if (isPreview && netlifySite && t.href === "/vanish") {
    return `https://${branch}--${netlifySite}.netlify.app/vanish`;
  }

  /* 3. Production, or a preview with nothing better to point at. */
  return t.href;
};

/* §6c — the falsifiable proof. Everything above this point is testimony; this
   is the part a reader can check themselves.

   MARKUP NOTE: exactly ONE link per card, and it is the CTA button. The button
   carries a stretched ::after that covers the whole card, so the entire panel
   is clickable while the accessibility tree still sees a single link with a
   complete name ("Vanish — run a scan"). The alternative (wrapping the panel
   in an <a>) would fold the heading, claim, detail, proof and stack line into
   one enormous link name, which is hostile to anyone navigating by link.

   These open in a new tab. The portfolio is the hub: someone evaluating me
   should be able to run a scan and still have this page behind it. */
const toolsSection = () => `
      <section class="section tools" id="tools" aria-labelledby="tools-label">
        <div class="wrap">
          <p class="label" id="tools-label" data-reveal><span class="node" aria-hidden="true"></span> ${esc(TOOLS.label)}</p>
          <h2 class="tools__head" data-reveal data-reveal-delay="1">${esc(TOOLS.heading)}</h2>
          <p class="tools__note" data-reveal data-reveal-delay="1">${esc(TOOLS.note)}</p>
          <div class="tools__grid">
            ${TOOLS.items
              .map(
                (t, i) => `<article class="tool" data-reveal data-reveal-delay="${i}">
              <p class="tool__tag">${esc(t.tag)}</p>
              <h3 class="tool__name">${esc(t.name)}</h3>
              <p class="tool__claim">${esc(t.claim)}</p>
              <p class="tool__detail">${esc(t.detail)}</p>
              <p class="tool__proof"><span class="node node--amber" aria-hidden="true"></span><span>${esc(t.proof)}</span></p>
              <p class="tool__stack">${esc(t.stack)}</p>
              <a class="btn btn--ghost tool__go" href="${attr(toolHref(t))}" target="_blank" rel="noopener"
                 aria-label="${attr(`${t.name} — ${t.cta.toLowerCase()} (opens in a new tab)`)}">${esc(t.cta)}<span class="tool__go-arrow" aria-hidden="true">→</span></a>
            </article>`
              )
              .join("\n            ")}
          </div>
        </div>
      </section>`;

/* Scaffolded but hidden. Flip FLAGS.SHOW_WRITING / SHOW_PORTFOLIO in
   src/content.mjs and re-run this script — nothing else changes. */
const writingSection = () =>
  !FLAGS.SHOW_WRITING
    ? ""
    : `
      <section class="section writing" id="writing" aria-labelledby="writing-label">
        <div class="wrap measure">
          <p class="label" id="writing-label" data-reveal><span class="node" aria-hidden="true"></span> ${esc(WRITING.label)}</p>
          <p class="hero__sub" data-reveal>${esc(WRITING.dek)}</p>
          ${WRITING.posts.length
            ? `<div class="cards">${WRITING.posts
                .map(
                  (post) => `<article class="card" data-reveal>
            <div class="card__top"><h3 class="card__title"><a href="${attr(post.href)}">${esc(post.title)}</a></h3><span class="card__tag">${esc(post.date)}</span></div>
            <p class="card__v">${esc(post.dek)}</p>
          </article>`
                )
                .join("")}</div>`
            : ""}
        </div>
      </section>`;

const portfolioSection = () =>
  !FLAGS.SHOW_PORTFOLIO
    ? ""
    : `
      <section class="section portfolio" id="portfolio" aria-labelledby="portfolio-label">
        <div class="wrap">
          <p class="label" id="portfolio-label" data-reveal><span class="node" aria-hidden="true"></span> ${esc(PORTFOLIO.label)}</p>
          <p class="hero__sub" data-reveal>${esc(PORTFOLIO.dek)}</p>
          ${PORTFOLIO.studies.length
            ? `<div class="cards">${PORTFOLIO.studies
                .map(
                  (s) => `<article class="card" data-reveal>
            <div class="card__top"><h3 class="card__title"><a href="${attr(s.href)}">${esc(s.title)}</a></h3><span class="card__tag">${esc(s.tag)}</span></div>
            <div class="card__row"><span class="card__k">Problem</span><span class="card__v">${s.problem}</span></div>
            <div class="card__row"><span class="card__k">Role</span><span class="card__v">${s.role}</span></div>
            <div class="card__row card__row--moved"><span class="card__k">Outcome</span><span class="card__v">${s.outcome}</span></div>
          </article>`
                )
                .join("")}</div>`
            : ""}
        </div>
      </section>`;

const contactSection = () => `
      <section class="section contact" id="contact" aria-labelledby="contact-heading">
        <div class="wrap">
          <span class="node node--seal contact__seal" aria-hidden="true"></span>
          <h2 id="contact-heading" data-reveal>${esc(CONTACT.heading)}</h2>
          <p class="contact__sub" data-reveal data-reveal-delay="1">${esc(CONTACT.sub)}</p>
          <div class="ctas" data-reveal data-reveal-delay="2">
            <a class="btn btn--primary" href="${attr(CONTACT.ctaPrimary.href)}" target="_blank" rel="noopener">${esc(CONTACT.ctaPrimary.label)}</a>
            <a class="btn btn--ghost" href="${attr(CONTACT.ctaSecondary.href)}">${esc(CONTACT.ctaSecondary.label)}</a>
          </div>
        </div>
      </section>`;

const indexHtml = () => `${head({
  title: META.title,
  description: META.description,
  canonical: `${IDENTITY.origin}/`,
  extraMeta: ogMeta,
  jsonld,
})}
<body>
  <a class="skip" href="#main">Skip to content</a>

  <!-- ONE motion layer for the ENTIRE page. The signal is a single continuous
       element driven by one global scroll value; content scrolls over it.
       Decorative: it conveys nothing that isn't also in text. (brand/04) -->
  <div class="signal" aria-hidden="true" role="presentation" data-signal>
    <img class="signal__media signal__poster" data-signal-poster
         src="${v("assets/img/signal-poster.webp")}" alt=""
         width="1920" height="1080" fetchpriority="high" decoding="async">
    <video class="signal__media signal__film" data-signal-film
           muted playsinline preload="none" tabindex="-1"
           width="1920" height="1080" aria-hidden="true"></video>
    <canvas class="signal__media signal__canvas" data-signal-canvas aria-hidden="true"></canvas>
  </div>

  <div class="page">
${nav()}
    <main id="main">
${heroSection()}
${thesisSection()}
${workSection()}
${ledgerSection()}
${capabilitiesSection()}
${aboutSection()}
${testimonialsSection()}
${toolsSection()}${writingSection()}${portfolioSection()}
${contactSection()}
    </main>
${footer()}
  </div>

  <script src="${v("js/main.js")}" defer></script>
</body>
</html>
`;

/* -- privacy.html --------------------------------------------------------- */

const privacyHtml = () => `${head({
  title: PRIVACY_PAGE.title,
  description:
    "This site collects nothing personal. No cookies, no trackers, no third-party requests. It honors Global Privacy Control. The full, honest details.",
  canonical: `${IDENTITY.origin}${URL_PRIVACY}`,
})}
<body>
  <a class="skip" href="#main">Skip to content</a>
  <div class="page">
${nav(true)}
    <main id="main" class="doc">
      <div class="wrap measure">
        <h1>${esc(PRIVACY_PAGE.heading)}</h1>
        <p class="doc__meta">LAST UPDATED · ${esc(PRIVACY_PAGE.updated)}</p>
        <p class="doc__intro">${esc(PRIVACY_PAGE.intro)}</p>
        ${PRIVACY_PAGE.sections
          .map(
            (s) => `<h2>${esc(s.h)}</h2>
        ${s.p.map((t) => `<p>${esc(t)}</p>`).join("\n        ")}`
          )
          .join("\n        ")}
        <p class="doc__closing">${esc(PRIVACY_PAGE.closing)}</p>
        <a class="doc__back" href="${URL_HOME}"><span class="node" aria-hidden="true"></span> Back to the site</a>
      </div>
    </main>
${footer()}
  </div>
</body>
</html>
`;

/* -- sitemap -------------------------------------------------------------- */
/* The tool URLs are derived from TOOLS rather than typed again here, so adding
   a third tool to content.mjs puts it in the sitemap automatically and cannot
   silently disagree with the section that links to it.

   Both tools are real pages on this origin — /scrubber/ ships inside this
   Pages project, /vanish/ is served through the Cloudflare proxy — so both
   belong here. Each tool's own deploy must point its canonical at the
   justintmccain.com URL or the two origins compete in the index; see
   docs/LAUNCH.md. Priority 0.8: below the landing page, well above privacy,
   because these are the pages worth landing on directly. */
const today = new Date().toISOString().slice(0, 10);
const sitemapXml = () => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${IDENTITY.origin}/</loc><lastmod>${today}</lastmod><priority>1.0</priority></url>
${TOOLS.items
  .map(
    (t) =>
      `  <url><loc>${IDENTITY.origin}${attr(t.href)}</loc><lastmod>${today}</lastmod><priority>0.8</priority></url>`
  )
  .join("\n")}
  <url><loc>${IDENTITY.origin}${URL_PRIVACY}</loc><lastmod>${today}</lastmod><priority>0.3</priority></url>
</urlset>
`;

/* -- emit ----------------------------------------------------------------- */
/* sitemap.xml is emitted ONLY when indexing is wanted. A sitemap is an active
   invitation — it hands a crawler the complete list of URLs including ones it
   would otherwise have to discover. Shipping one alongside a noindex directive
   would be arguing with itself. When ALLOW_INDEXING is false the file is not
   written at all, and robots.txt does not advertise it. */
const out = [
  ["index.html", indexHtml()],
  ["privacy.html", privacyHtml()],
  ...(FLAGS.ALLOW_INDEXING ? [["sitemap.xml", sitemapXml()]] : []),
];

for (const [file, contents] of out) {
  writeFileSync(join(ROOT, file), contents, "utf8");
  console.log(`  ✓ ${file}  (${(Buffer.byteLength(contents) / 1024).toFixed(1)} KB)`);
}

/* Sweep .DS_Store out of the publish directory.
   ---------------------------------------------------------------------------
   Pages publishes site/ wholesale, so a .DS_Store in it is a live URL that
   lists filenames — including any that were meant to be private. Deleting it
   by hand does not hold: Finder writes a new one every time the folder is
   opened, which is often, and nothing about that is visible in a diff. It was
   caught once by the deploy verifier and would otherwise have shipped.

   Cheap, idempotent, and runs on the one code path that always precedes a
   deploy. Scoped to this exact filename — this is a leak guard, not a
   general-purpose cleaner, and it should never delete anything it was not
   explicitly written to delete. */
{
  const swept = [];
  const sweep = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) sweep(full);
      else if (entry.name === ".DS_Store") { unlinkSync(full); swept.push(full); }
    }
  };
  sweep(ROOT);
  if (swept.length) {
    console.log(`  ✓ swept ${swept.length} .DS_Store file(s) from the publish directory`);
  }
}
/* METRICS drift check.
   METRICS claims to be the canonical register of every proof figure, but the
   figures are authored inline in the WORK and LEDGER strings (they have to be,
   because they carry <strong> emphasis mid-sentence). Nothing stopped the two
   from disagreeing. This warns when a registered figure no longer appears in
   the rendered page, which is what "the single source of truth" was supposed
   to guarantee. Distinctive values only: matching a bare "30" would pass on
   almost any page and prove nothing. */
{
  const rendered = out
    .find(([f]) => f === "index.html")[1]
    .replace(/<[^>]+>/g, " ")
    // decode the entities the escaper introduced, or figures containing < or >
    // (">10 days → <2 business days") never match their registered value
    .replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&amp;/g, "&");
  const orphans = Object.entries(METRICS)
    .map(([k, m]) => [k, String(m.value)])
    .filter(([, v]) => v.length >= 4 && !rendered.includes(v));
  if (orphans.length) {
    console.log("\n  ⚠ METRICS not found in the rendered page:");
    orphans.forEach(([k, v]) => console.log(`      ${k} = "${v}"`));
    console.log("      Either the copy changed and the register is stale, or vice versa.");
  }
}

console.log(
  `\n  Flags: SHOW_WRITING=${FLAGS.SHOW_WRITING}  SHOW_PORTFOLIO=${FLAGS.SHOW_PORTFOLIO}` +
    `  ·  portrait.ready=${ABOUT.portrait.ready}  ·  asset v${ASSET_VERSION}`
);

/* Staging-build guard. A build whose tool links point off-domain is fine to
   review and must never reach production, so it says so unmissably rather than
   succeeding quietly and leaving a netlify.app link in the shipped page. */
{
  const overridden = TOOLS.items
    .map((t) => [t.name, t.href, toolHref(t)])
    .filter(([, canonical, used]) => canonical !== used);

  if (overridden.length) {
    console.log(`\n  ${"─".repeat(66)}`);
    console.log("  ⚠  STAGING BUILD — tool links point OFF-DOMAIN. Do not deploy to production.");
    overridden.forEach(([name, canonical, used]) =>
      console.log(`       ${name}: ${canonical}  →  ${used}`)
    );
    console.log("     Re-run `node build.mjs` with no STAGING_*_URL set before shipping.");
    console.log(`  ${"─".repeat(66)}\n`);
  } else {
    console.log("  Tool links: canonical (production-ready)\n");
  }
}
