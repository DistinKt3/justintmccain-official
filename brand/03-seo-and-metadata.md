# SEO & Metadata

Goal: rank and share well for **"Justin McCain privacy"**, **"Justin T. McCain privacy product"**, and adjacent ("privacy product leader," "consumer privacy infrastructure"). Single-page site, so on-page semantics + structured data do the heavy lifting.

All values below are generated from `META` in `site/src/content.mjs` and the JSON-LD block in `site/build.mjs`. Edit there; this file documents what ships.

**Metadata is subject to the same copy rules as on-page text** (`brand/01` §2): no em dashes, no "actually", and no root-cause plus violation-scope plus company attribution. Meta descriptions and JSON-LD are arguably *more* exposed than the page, because they surface in search results and link previews without a click, and structured data is what search engines use to build an entity record for a person.

## Primary tags
```html
<title>Justin T. McCain | Privacy Product Leader, Consumer Privacy Infrastructure</title>
<meta name="description" content="Justin T. McCain builds consumer privacy infrastructure at 100M+ user-account scale, from signal capture through enforcement to durable evidence. Privacy Product Leader across streaming, edtech, pharma, and fintech (Roku, Cengage, Bayer, TD Ameritrade). CIPM.">
<link rel="canonical" href="https://justintmccain.com/">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta name="theme-color" content="#0A0F14">
```

- **Title:** leads with the full name, then the category. Keeps "Privacy Product Leader" adjacent to the name for the target query.
- **Description:** in-voice, front-loads the differentiator and the company names (entity signals). No keyword stuffing.

## Open Graph / Twitter
```html
<meta property="og:type" content="profile">
<meta property="og:site_name" content="Justin T. McCain">
<meta property="og:title" content="Justin T. McCain | Privacy, built to be obeyed.">
<meta property="og:description" content="Privacy Product Leader who turns GDPR, CPRA, LGPD, and VPPA into shipped infrastructure. Owns the consent lifecycle for 100M+ user accounts, from signal capture through enforcement to durable evidence.">
<meta property="og:image" content="https://justintmccain.com/og/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Justin T. McCain, Privacy Product Leader. A luminous mint signal resolving into an amber-sealed node on near-black.">
<meta property="og:url" content="https://justintmccain.com/">
<meta property="profile:first_name" content="Justin">
<meta property="profile:last_name" content="McCain">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Justin T. McCain | Privacy, built to be obeyed.">
<meta name="twitter:description" content="Consumer privacy infrastructure at 100M+ user-account scale. Signal, enforcement, evidence. Recovered ~$1.75M/yr by hardening opt-out signal enforcement.">
<meta name="twitter:image" content="https://justintmccain.com/og/og-image.png">
<meta name="twitter:image:alt" content="Justin T. McCain, Privacy Product Leader. A luminous mint signal resolving into an amber-sealed node on near-black.">
```

**OG image spec:**
- 1200×630, `#0A0F14` background.
- Left: `JUSTIN T. McCAIN` wordmark (Space Grotesk) + `Privacy Product Leader` (mono, Slate).
- Center/right: the hero motif still, a mint signal line resolving into an amber-sealed node.
- One proof chip (mono, amber): `~$1.75M/yr recovered`. **Nothing else.** Text baked into an image cannot be revised by editing a string, and it renders in every link preview, so the disclosure rules apply here more strictly than anywhere else. No percentages, no account counts, no scope-of-problem figures.
- No busy background; must stay legible as a small timeline thumbnail. Text ≥ 32px.
- Source: `site/og/compose.html` renders the card with the real self-hosted fonts.

## Structured data (JSON-LD, `Person`)
```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Justin T. McCain",
  "jobTitle": "Privacy Product Leader",
  "description": "Privacy Product Leader building consumer privacy infrastructure at global scale: DSAR platforms, consent management, GPC signal enforcement, and data governance.",
  "url": "https://justintmccain.com/",
  "image": "https://justintmccain.com/og/og-image.png",
  "email": "mailto:JustinTMcCain@protonmail.com",
  "sameAs": ["https://www.linkedin.com/in/justintmccain/"],
  "knowsAbout": ["Consumer Privacy Infrastructure","GDPR","CPRA","LGPD","VPPA","DSAR","Consent Management","Global Privacy Control","Data Governance","Privacy by Design"],
  "hasCredential": {"@type":"EducationalOccupationalCredential","credentialCategory":"certification","name":"Certified Information Privacy Manager (CIPM), IAPP"},
  "worksFor": {"@type":"Organization","name":"Roku"}
}
```

`knowsAbout` is an entity-association field: whatever is listed here is what a search engine attaches to the person record, whether or not it appears anywhere on the page. Keep it to regulations actually claimed on the site. The same caution applies to any field added later that names an institution, an employer, or a credential, because structured data is invisible in the browser and therefore easy to leave stale.

## On-page semantics
- Exactly one `<h1>` (the hero headline). Section headings step down `h2 → h3`; never skip levels.
- Every proof metric in real text (not baked into images) so it's crawlable and accessible.
- Descriptive anchor text; nav links are real `<a href="#…">`.
- `<html lang="en">`, meaningful `<title>`, and a short crawlable `/privacy` page (also reinforces the privacy-leader entity).
- Fast load and Core Web Vitals are a ranking factor — see `06-performance-and-tech-fit.md`.

## Housekeeping
- `sitemap.xml` (even for one page + `/privacy`), `robots.txt` allowing all, favicon set (node glyph) incl. `apple-touch-icon` and `.ico`, `site.webmanifest` with `theme_color:#0A0F14`, `background_color:#0A0F14`.
- Verify LinkedIn URL is exact and appears in `sameAs`, footer, hero CTA, and contact — consistent entity signal.
