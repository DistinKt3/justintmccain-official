/**
 * ============================================================================
 * Justin T. McCain — SIGNAL
 * SINGLE SOURCE OF TRUTH for every word and every number on the site.
 * ============================================================================
 *
 * Change a metric HERE and it updates everywhere it appears (hero proof line,
 * work cards, the ledger, meta descriptions, OG tags). Nothing is typed twice.
 *
 * After editing this file run:   node build.mjs
 * That regenerates index.html + privacy.html. Commit both.
 *
 * ----------------------------------------------------------------------------
 * HOUSE RULES FOR THIS FILE (2026-07 executive pass)
 * ----------------------------------------------------------------------------
 *
 * 1. NO EM DASHES. Use a colon, a period, a comma, or parentheses. The em dash
 *    is the single most recognisable machine-writing tell and it was previously
 *    load-bearing in almost every sentence here. En dashes in ranges and
 *    compound ranges ($700K–$1.2M) are correct typography and stay.
 *
 * 2. NO "actually". It was a tic across seven strings ("systems that actually
 *    honor", "the signal that actually gets honored"). It reads as hedging and
 *    it reads as junior. State the thing.
 *
 * 3. VARY THE ARCHITECTURE BETWEEN SECTIONS. The old copy ran the same two
 *    devices everywhere: the "Not X. Y." contrast pair and the rule-of-three
 *    noun phrase. Each is good once. Repeated in every section they stop
 *    sounding like a voice and start sounding like a template.
 *
 * 4. DISCLOSURE DISCIPLINE. Publish outcome, ownership and scale. Never
 *    root-cause mechanism + violation-scope + company attribution together.
 *    Any two of those three is fine; all three is a compliance admission with
 *    a company name attached. This is why there is no ARPU formula, no account
 *    count, no page-load percentage and no partner count anywhere below.
 *    Those figures live in interview conversations, not on a public page.
 *
 * This file and brand/02-site-architecture-and-copy.md are 1:1. Change both
 * together, or the brand doc stops being the reference it claims to be.
 */

/* ---------------------------------------------------------------------------
 * FEATURE FLAGS — flip to true to reveal a scaffolded section.
 * Components and styles already exist; nothing else needs to change.
 * ------------------------------------------------------------------------- */
export const FLAGS = {
  SHOW_WRITING: false,
  SHOW_PORTFOLIO: false,

  /* ---------------------------------------------------------------------
   * ALLOW_INDEXING — false means this site is SHARED, not FOUND.
   *
   * The intent: this page should reach people Justin hands it to, from a
   * résumé or a LinkedIn message. It should NOT be what someone lands on
   * while searching his employer plus "privacy". A privacy portfolio that
   * quietly optimises itself for discovery is arguing against itself.
   *
   * Setting this false does four things in build.mjs:
   *   - emits `noindex, nofollow` instead of `index, follow`
   *   - drops the Person JSON-LD entirely (see the note below)
   *   - stops emitting sitemap.xml
   *   - leaves the Open Graph and Twitter tags UNTOUCHED, on purpose
   *
   * That last point is the whole trick. og:* is read by LinkedIn, Slack and
   * iMessage when someone opens a link you sent them; it is not a search
   * signal. Sharing keeps its preview card, search loses the page.
   *
   * THE JSON-LD IS THE REAL REASON THIS FLAG EXISTS. A Person schema naming
   * jobTitle, worksFor: Roku and ten knowsAbout topics is machine-readable
   * "index me as this entity, against these subjects, at this employer" —
   * precisely the search path we are trying not to be in. noindex alone
   * would probably suffice; removing the schema means not relying on
   * probably.
   *
   * WHAT THIS DOES NOT DO — accepted knowingly:
   *   - anyone with the URL still sees everything; this is not access control
   *   - the hostname is public in Certificate Transparency logs the moment a
   *     TLS cert is issued, and that is permanent
   *   - crawlers that ignore robots directives ignore these too
   * If the requirement ever becomes "only people I authorise", that is
   * Cloudflare Access or a signed URL, not a meta tag.
   * ------------------------------------------------------------------- */
  ALLOW_INDEXING: false,
};

/* ---------------------------------------------------------------------------
 * IDENTITY — used in nav, hero, contact, footer, JSON-LD, and meta.
 * ------------------------------------------------------------------------- */
export const IDENTITY = {
  name: "Justin T. McCain",
  firstName: "Justin",
  lastName: "McCain",
  role: "Privacy Product Leader",
  linkedin: "https://www.linkedin.com/in/justintmccain/",
  email: "JustinTMcCain@protonmail.com",
  /* www IS THE CANONICAL HOST. The apex redirects to it at the Cloudflare edge,
     so both hostnames resolve and exactly one of them is ever the URL.
     Chrome elides "www." in the address bar, so a visitor still reads
     "justintmccain.com" while the real URL underneath is the www one.

     `origin` is what every canonical link, og:url, twitter:image and sitemap
     entry is built from — change it here and all of them follow.
     `domain` is the bare name kept for display; nothing in build/ reads it
     today, so it stays apex-form on purpose. */
  domain: "justintmccain.com",
  origin: "https://www.justintmccain.com",
};

/* ---------------------------------------------------------------------------
 * METRICS — the proof numbers. Centralised so a figure changes in ONE place.
 *
 * Deliberately ABSENT (see house rule 4): ARPU, account counts, US page-load
 * percentage, partner counts. Do not reintroduce them. They add no persuasive
 * weight a rounded figure does not already carry, and they convert a
 * competence claim into a quantified compliance disclosure.
 * ------------------------------------------------------------------------- */
export const METRICS = {
  revenueRecovered:  { value: "~$1.75M", unit: "/yr", countUp: true },
  userAccounts:      { value: "100M+",   unit: " user accounts", countUp: true },
  dsrKickoff:        { value: "8 days → same day" },
  enterpriseSize:    { value: "100k-person", unit: " enterprise" },
  enterpriseCountries: { value: "80+",   unit: " countries" },
  engineersLed:      { value: "30",      unit: " engineers" },
  complaintClosure:  { value: ">10 days → <2 business days" },
  consentSystems:    { value: "20+",     unit: " systems" },
  consentProfiles:   { value: "~40M",    unit: " profiles" },
  countries:         { value: "55",      unit: " countries" },
  launches:          { value: "309",     unit: " launches" },
  ccpaAssociates:    { value: "100+",    unit: " associates" },
  incidentsLed:      { value: "3",       unit: " incidents led end to end" },
  budgetManaged:     { value: "$700K–$1.2M" },
};

/* ---------------------------------------------------------------------------
 * SEO / METADATA — brand/03-seo-and-metadata.md
 * ------------------------------------------------------------------------- */
export const META = {
  title: "Justin T. McCain | Privacy Product Leader, Consumer Privacy Infrastructure",
  description:
    "Justin T. McCain builds consumer privacy infrastructure at 100M+ user-account scale, from signal capture through enforcement to durable evidence. Privacy Product Leader across streaming, edtech, pharma, and fintech (Roku, Cengage, Bayer, TD Ameritrade). CIPM.",
  ogTitle: "Justin T. McCain | Privacy, built to be obeyed.",
  ogDescription:
    "Privacy Product Leader who turns GDPR, CPRA, LGPD, and VPPA into shipped infrastructure. Owns the consent lifecycle for 100M+ user accounts, from signal capture through enforcement to durable evidence.",
  ogImageAlt:
    "Justin T. McCain, Privacy Product Leader. A luminous mint signal resolving into an amber-sealed node on near-black.",
  twitterTitle: "Justin T. McCain | Privacy, built to be obeyed.",
  twitterDescription:
    "Consumer privacy infrastructure at 100M+ user-account scale. Signal, enforcement, evidence. Recovered ~$1.75M/yr by hardening opt-out signal enforcement.",
  themeColor: "#0A0F14",
};

/* ---------------------------------------------------------------------------
 * NAV — brand/02 §0
 * ------------------------------------------------------------------------- */
export const NAV = {
  links: [
    /* ORDER MUST MATCH THE DOM ORDER OF THE SECTIONS, which is:
       work, proof, capabilities, about, testimonials, tools, contact.
       Tools used to sit before About here while About comes first on the page,
       so clicking straight down the nav jumped past About, then back up to it.
       If a section is ever reordered, reorder this with it. */
    /* keepOnMobile survives the ≤26rem collapse, where there is not room for
       five links. It used to be Proof alone, hardcoded by label in build.mjs,
       which meant the phone nav had no entry to the tools or the contact block
       — on the arrival path that matters most, since a LinkedIn link is opened
       on a phone. Tools carries the MVPs and Contact is the conversion, so both
       earn their place over Work (the first section anyway) and About.
       Re-measure nav.scrollWidth vs clientWidth at 360px if this set grows. */
    { label: "Work",    href: "#work" },
    { label: "Proof",   href: "#proof",   keepOnMobile: true },
    { label: "About",   href: "#about" },
    { label: "Tools",   href: "#tools",   keepOnMobile: true },
    { label: "Contact", href: "#contact", keepOnMobile: true },
  ],
};

/* ---------------------------------------------------------------------------
 * §1 HERO — "The Signal"
 * ------------------------------------------------------------------------- */
export const HERO = {
  /* The name renders as the wordmark above the headline (brand/01 §3.1: Space
     Grotesk, tight tracking, the node as terminal punctuation). It is drawn
     from IDENTITY.name rather than repeated here, so there is one spelling. */
  eyebrow: "PRIVACY PRODUCT LEAD · GLOBAL PRIVACY INFRASTRUCTURE",
  headline: ["I make the safe default", "the real default."],
  sub:
    "I own the consumer privacy infrastructure behind 100M+ user accounts, from signal capture through enforcement to the evidence that proves it happened.",
  proof:
    "Recovered ~$1.75M/yr in ad revenue by auditing and hardening opt-out signal enforcement across the web platform.",
  ctaPrimary:   { label: "Connect on LinkedIn", href: IDENTITY.linkedin },
  ctaSecondary: { label: "See the work",        href: "#work" },
  motionAlt:
    "A single luminous mint signal traveling across a dark field of nodes and being honored at an amber-sealed gate.",
};

/* ---------------------------------------------------------------------------
 * §2 THESIS — "The gap"
 * ------------------------------------------------------------------------- */
export const THESIS = {
  label: "THE POINT OF VIEW",
  paragraphs: [
    "Privacy has a gap between what's written and what's real.",
    "A policy promises the company honors your choice. Production quietly does not.",
    "I have spent ten years closing that gap as the product leader who owns the infrastructure in between: the signal that gets honored, the deletion that propagates, the evidence that outlasts the account.",
    "Privacy that only lives on paper is exposure with better documentation.",
  ],
  /* The quotable line — emphasised in the last paragraph. */
  pullPhrase: "exposure with better documentation",
};

/* ---------------------------------------------------------------------------
 * §3 THE WORK — "Not programs. Products."
 * Repeatable card component: Broken → Built → Moved.
 * To add a case study later, copy a card object and add `caseStudy: "slug"`.
 *
 * NOTE ON THE "BROKEN" FIELD: it describes the FAILURE MODE OF THE DOMAIN, not
 * an incident at a named company. "This is where these systems break" is
 * expertise. "This broke here, at this scale, and here is the revenue impact"
 * is a disclosure. Keep new cards on the first side of that line.
 * ------------------------------------------------------------------------- */
export const WORK = {
  label: "WHAT I'VE SHIPPED",
  heading: "Examples of what I've shipped, how fast, and what it moved.",
  cards: [
    {
      title: "Hardening the opt-out signal",
      tag: "ROKU",
      broken: "Opt-out signal enforcement looks simple and rarely is. Regional carve-outs, legacy integrations, and browser-level nuance are where it quietly breaks.",
      built:  "Audited and hardened signal enforcement across the web governance stack, end to end. Enforced <strong>Global Privacy Controls (GPC)</strong> across Roku ecosystem domains for true governance, applied correctly by jurisdiction.",
      moved:  "<strong>~$1.75M/yr in recovered ad revenue</strong>, inside my first five months.",
    },
    {
      title: "A new front door for privacy rights",
      tag: "ROKU",
      broken: "A legacy rights portal can no longer be iterated against or upgraded, only replaced. The regulation that forces the rebuild sets the date for compliance, and the date does not move.",
      built:  "Led vision and strategy for Roku's Privacy Rights Portal, with updated security, compliance and simple ease of expansion built in the MVP, not as a fast follow. Shipped <strong>EU Data Act functionality</strong> along with launch.",
      moved:  "One front door and backend system, in the same design language as Roku's Design System &amp; Device Settings (easy on purpose). Figma to prototype in <strong>3 days</strong> with AI, a <strong>15-week plan delivered in weeks</strong>, inside my first nine months.",
    },
    {
      title: "DSAR, from inbox to product",
      tag: "ROKU",
      broken: "Data-subject requests arrive as email and get triaged by hand, one at a time. It is slow, and it leaves nothing behind that proves the request was honored.",
      built:  "Automated emailed Data Subject Requests for backend system parsing, system routing, and audit logging. Simplified processing Authorized Agent Request time to <strong>minutes</strong> while still maintaining a Human-In-The-Loop where necessary.",
      moved:  "Time to kick off a request fell from <strong>8 days to same day</strong>, and a manual liability became an audited, scalable product. Delivered in my first five months.",
    },
    {
      title: "Deletion that scales",
      tag: "ROKU",
      broken: "Partner deletion tends to run on manual email and CSV hand-offs. Brittle, hard to evidence, and impossible to scale past a handful of partners.",
      built:  "Led the <strong>first API-first partner-deletion pilot</strong>, replacing a legacy manual process with an automated, auditable one.",
      moved:  "Proved a scalable path off brittle process for the entire partner ecosystem. Delivered in my first five months.",
    },
    {
      title: "A privacy program, stood up fast",
      tag: "CENGAGE",
      broken: "Enterprises this size often run privacy as a legal checklist rather than a product: no unified opt-out handling, no jurisdictional consent model, reactive by default.",
      built:  "Shipped Global Privacy Controls enterprise-wide in the <strong>first 90 days</strong>. Rebuilt the enterprise consent management framework at <strong>six months</strong>, including automated opt-in and opt-out jurisdictional models across 30+ root domains. Rebuilt the DSAR framework to cover access requests by <strong>month nine</strong>.",
      moved:  "Privacy stopped being a checklist and started being enforced: opt-out honored automatically, consent governed by jurisdiction, and access requests answered by a framework instead of by hand.",
    },
    {
      title: "Consent, rebuilt for a global enterprise",
      tag: "BAYER",
      broken: "Enterprises operating across 80+ countries tend to accumulate a consent model per region. Each one works locally, and together they cannot answer a basic question about what a person actually agreed to.",
      built:  "Built the enterprise consent framework and the platform beneath it, integrating <strong>20+ source systems</strong> and harmonizing <strong>~40M user profiles</strong> into one record. Owned <strong>350+ consent banners</strong> enterprise-wide.",
      moved:  "One consent record, one answer, in every market.",
    },
    {
      /* Title is deliberately short. "TD AMERITRADE" is the only two-word tag on
         the page and always wraps to two lines against the 45% max-width on
         .card__tag, which leaves .card__title ~85px. A longer title tips it to
         five lines, past the four-line ceiling every other card holds. */
      title: "CCPA across 55 sites",
      tag: "TD AMERITRADE",
      broken: "CCPA arrives with a fixed date and no partial credit. The consent platform had not been chosen, and the hard part turned out not to be the tool but the pixel governance and auditable process underneath it.",
      built:  "Ran the enterprise RFP and led the project team from inception to launch. I owned the platform: consent management across <strong>55 front-facing websites</strong>, live to <strong>200,000 users on day one</strong>, and the data-subject-request solution beside it. Owned pixel governance jointly with the Chief Privacy Officer and MarTech.",
      moved:  "<strong>This is how the enterprise met CCPA.</strong> The platform stayed mine to run and iterate after launch.",
    },
  ],
};

/* ---------------------------------------------------------------------------
 * §4 THE LEDGER — "Receipts, not promises"  (Evidence Paper / light surface)
 * ------------------------------------------------------------------------- */
export const LEDGER = {
  label: "THE EVIDENCE",
  heading: "Privacy you can measure, ship, and defend.",
  /* Ordered so the 0→1 build rows say WHAT was built from nothing, not just
     that something was. "CCPA 0→1" on its own told a reader nothing. */
  rows: [
    { record: "Opt-out signal enforcement hardened",   proof: "<strong>~$1.75M/yr</strong> recovered" },
    { record: "Consent lifecycle owned",               proof: "<strong>100M+</strong> user accounts" },
    { record: "DSR email intake automated",            proof: "<strong>8 days → same day</strong> to kick off" },
    { record: "Privacy-complaint closure process rebuilt", proof: "<strong>&gt;10 days → &lt;2 business days</strong>" },
    /* Must not outrun its own card. The work card calls this a PILOT that
       "proved a scalable path"; this row previously said "automated" and
       "Replaced", which is the stronger claim of the two. A reader who sees
       both believes the weaker one and discounts the rest of the table. */
    { record: "Partner deletion pilot (API-first)", proof: "Proved a scalable path off manual email and CSV" },
    { record: "Enterprise consent framework built 0→1", proof: "<strong>100k-person</strong> enterprise across <strong>80+</strong> countries" },
    { record: "Consent platform integration",          proof: "<strong>20+</strong> systems · <strong>~40M</strong> profiles harmonized" },
    { record: "Global privacy delivery",               proof: "<strong>309</strong> launches across <strong>55</strong> countries" },
    { record: "CCPA program built 0→1",                proof: "Enterprise-wide DSAR rollout · led a <strong>100+</strong> associate project team" },
    { record: "Engineering teams led",                 proof: "Up to <strong>30</strong> engineers across time zones" },
    { record: "Incident response led",                 proof: "<strong>3</strong> incidents, intake to notification decision" },
    { record: "Cross-border transfer risk",            proof: "Enterprise <strong>Schrems II</strong> remediation" },
    { record: "Budget ownership",                      proof: "<strong>$700K–$1.2M</strong>" },
  ],
  scopeStrip: [
    "Roku · Cengage · Bayer · TD Ameritrade",
    "GDPR · CPRA · LGPD · VPPA · GLBA",
    "CIPM · 10+ years",
  ],
};

/* ---------------------------------------------------------------------------
 * §5 WHAT I OWN — Capabilities
 * ------------------------------------------------------------------------- */
export const CAPABILITIES = {
  label: "WHAT I OWN",
  pillars: [
    {
      name: "Signal → Enforcement",
      claim: "I build the systems that honor opt-outs at scale.",
      detail: "GPC and DNSS enforcement · consent signal capture · web governance.",
    },
    {
      name: "0→1 Product Ownership",
      claim: "End-to-end privacy products, owned from strategy through production.",
      detail: "DSAR automation (Ketch, OneTrust) · consent management at scale · API-first deletion.",
    },
    {
      name: "Durable Evidence & Trusted Escalation",
      claim: "I make privacy provable, and I am the escalation point when it has to be right.",
      detail: "Append-only evidence · data governance and retention · incident response · third-party risk.",
    },
  ],
  emerging: {
    name: "Privacy × AI",
    claim: "Key stakeholder in AI governance and DLP, aligning privacy controls with enterprise AI strategy.",
    detail: "I build with AI daily (Claude Enterprise, Claude Code, Glean), so I govern the frontier from inside it.",
  },
  competencies:
    "DSAR Product & Automation · Consent Management at Scale · Data Governance & Retention · Privacy-by-Design · Incident Response · Cross-Border Transfer Strategy · Global Privacy Regs (GDPR · CPRA · LGPD · VPPA · GLBA) · Ketch · OneTrust · Acryl/DataHub.",
};

/* ---------------------------------------------------------------------------
 * §6 ABOUT — first person
 * ------------------------------------------------------------------------- */
export const ABOUT = {
  label: "WHO'S BEHIND THIS",
  paragraphs: [
    "Anyone can publish a policy that promises to honor your choices. Building the system that does it, and proving it did, is the harder and more interesting problem. That is the part I own.",
    "For ten years I have worked where privacy law meets production code, turning GDPR, CPRA, LGPD, and VPPA into products that make the safe thing the default thing. I have recovered seven figures by auditing a single opt-out signal most teams never look at twice. I replaced manual, email-based deletion with API-first infrastructure, and built consent evidence that outlives the account it belonged to.",
    "I sit at an uncommon intersection of product management, engineering fluency, and enough legal literacy to argue the edge cases. That combination is why legal, security, and executive teams escalate to me when the answer has to be right. I am a builder. I like the version of privacy you can measure, ship, and defend.",
  ],
  pullQuote: "I like the version of privacy you can measure, ship, and defend.",
  credential:
    "CIPM, IAPP · 10+ years · Roku · Cengage · Bayer · TD Ameritrade",
  portrait: {
    ready: true,
    src: "assets/img/portrait.webp",
    alt: "Justin T. McCain, a black-and-white editorial portrait against deep shadow.",
  },
};

/* ---------------------------------------------------------------------------
 * §6b TESTIMONIALS — "The corroboration"
 *
 * Numbered 6b rather than 7 so the section numbers in
 * brand/02-site-architecture-and-copy.md keep meaning what they say. This sits
 * between About and Contact: the Ledger is the metric proof, this is the human
 * proof, and it hands off warm to the CTA.
 *
 * These are other people's published words. Excerpted, never reworded. The
 * house style rules above DO NOT apply inside these quotes: they are quotations,
 * not our copy. Do not edit them for voice, punctuation, or em dashes.
 * ------------------------------------------------------------------------- */
export const TESTIMONIALS = {
  label: "THE CORROBORATION",
  heading: "Ask the people who shipped it with me.",
  note: "Excerpts. The full set lives on LinkedIn.",
  source: {
    label: "All recommendations on LinkedIn",
    href: "https://www.linkedin.com/in/justintmccain/details/recommendations/?detailScreenTabIndex=0",
  },
  quotes: [
    {
      quote:
        "Justin is, without a doubt, the most exceptional product manager I have ever worked with. His ability to navigate complex projects with precision, clarity, and efficiency is truly remarkable. A gifted communicator with a razor-sharp mind, he keeps projects moving forward seamlessly, ensuring that every team member is aligned and motivated.",
      name: "Ashley Kilgore-Crowley",
      title: "Sr. UX Designer",
    },
    {
      quote:
        "Time and again, I found myself wondering, how does he stay so on top of everything? Every project I worked on with him was well-run, well-supported, and delivered exceptional value from day one to launch. Thanks to his strategic mindset, execution skills, and unwavering commitment to success.",
      name: "Ryan Stiers",
      title: "Lead Product Designer",
    },
    {
      quote:
        "Justin is easily one of the sharpest minds I've ever worked with. I am always excited when I get the opportunity to work directly with his team, because I know the work will be well thought out, organized, and fun to do. He is a true leader, with the ability to effortlessly bring people together around an idea.",
      name: "Rachel Guethle",
      title: "Sr. Digital Marketing Automation Professional",
    },
    {
      quote:
        "Working with Justin McCain was the best and most collaborative experience I've had in my professional history. I not only felt encouraged but also empowered to be innovative. The successes I've had in my role working for Justin are due in part to his leadership.",
      name: "René Morales",
      title: "Product Specialist",
    },
    {
      // NOTE: the source reads "a example to measure others against" — corrected
      // to "an example". Revert this word if you would rather quote it verbatim.
      quote:
        "I have had the pleasure of working under Justin McCain's leadership and have been impressed with his ability to manage and drive forward complex business implementations and the people delivering those products. He has set the bar high with how to manage properly and moving forward his example will both be a goal for me to meet and an example to measure others against.",
      name: "Jimi Figueredo",
      title: "Product Specialist",
    },
  ],
};

/* ---------------------------------------------------------------------------
 * §6c TOOLS — "The demonstration"
 *
 * Sits between the testimonials and the CTA on purpose. Everything above this
 * point is testimony: my account of my work, then other people's account of me.
 * This is the one section a reader can falsify without asking anyone. They open
 * the thing and it either works or it doesn't.
 *
 * HOUSE RULE FOR THIS SECTION: every claim here must be checkable in under a
 * minute by the person reading it. `proof` is not a benefit statement — it is
 * the specific, countable fact that a skeptic could verify from the running
 * tool or its source. If a new tool cannot produce a line like that, it does
 * not belong in this section.
 *
 * The two numbers below are read from the shipped source, not estimated:
 *   - 23 brokers  = src/data/brokers.json, all entries enabled, each carrying
 *                   verifiedAt + legalBasis + CPPA-registry provenance.
 *   - 4 formats   = src/lib/scrub/{jpeg,png,heic,pdf}.ts
 * Re-count both if either tool changes. A stale number here is worse than no
 * number, because this is the section that invites verification.
 * ------------------------------------------------------------------------- */
export const TOOLS = {
  label: "THE DEMONSTRATION",
  /* The turn this heading is making: the Corroboration section immediately above
     says "Ask the people who shipped it with me" — evidence you have to take on
     someone's word. This is the one section where you don't have to. Keep that
     contrast if you rewrite it, and keep the invitation warm: it is asking a
     hiring manager to spend two minutes, not daring them to find a bug.

     "MVPs" is doing real work and is not modesty: it scopes the claim honestly
     before anyone clicks, so a rough edge reads as expected rather than as a
     defect. On a site whose thesis is the gap between what is written and what
     is real, overselling these would be the one unforced error.

     NOTE: the count is hard-coded here. Adding a third tool means rewriting the
     line — the right trade for a heading this short.

     The note deliberately no longer repeats authorship ("Built solo, end to
     end"): the heading now carries it, so the note is free to be the specific
     list of what "built by me" actually covered. */
  /* The space between "2" and "MVPs" is a NON-BREAKING SPACE (U+00A0), not a
     normal one. At the 24ch measure this heading is set to, text-wrap:balance
     otherwise breaks the line right after the numeral and orphans it from the
     noun it counts — "See for yourself. 2 / MVPs, built by me." With the
     nbsp the line can only break at the sentence boundary, which is where it
     wants to break anyway. Do not "clean up" this character. */
  heading: "See for yourself. 2 MVPs, built by me.",
  note: "Product, code, copy, and threat model.",
  items: [
    {
      name: "Vanish",
      /* Path, not subdomain: these are part of the portfolio, not adjacent to
         it.

         NO trailing slash, unlike /scrubber/ below, and the difference is not
         cosmetic. Vanish is a Next app whose basePath IS "/vanish", and Next
         defaults to trailingSlash:false, so "/vanish" is the canonical URL and
         "/vanish/" answers with a 301 to it. The Scrubber is the opposite: a
         static directory where Pages serves index.html off the slashed form and
         redirects the bare one. Written this way, the two primary CTAs on this
         section both resolve in a single hop. */
      href: "/vanish",
      tag: "DATA BROKER OPT-OUT",
      claim: "Find out which people-search sites are selling you, then make them stop.",
      detail:
        "Scans the brokers that publish your name, address, and relatives, tells you where you actually appear, and generates the removal request for each one. Your identity is posted once, held in memory for the length of the scan, and never written down.",
      /* Provenance is split and MUST be stated as such. brokers.json carries a
         `source` field: 14 entries are "ca-registry", 9 are "published". An
         earlier version of this line said "23 brokers, each verified against
         the California data broker registry", which is false for 9 of them
         (TruePeopleSearch and FastPeopleSearch are not registrants). In the one
         section whose rule is that a sceptic can falsify the claim from the
         running tool, an overstated verification claim is the worst possible
         error. Re-count both numbers if brokers.json changes. */
      proof: "23 brokers. 14 verified against the California data broker registry, 9 confirmed by published listing.",
      stack: "Next.js · one server route · no accounts, no logs",
      cta: "Run a scan",
    },
    {
      name: "Metadata Scrubber",
      href: "/scrubber/",
      tag: "EXIF + GPS STRIPPER",
      claim: "See what your photos say about you, then strip it.",
      detail:
        "Every photo carries where you stood, what device you used, and the second you pressed the shutter. Drop a file in and it comes back clean, with a plain-language report of exactly what was removed.",
      proof: "JPEG, PNG, HEIC, and PDF. Turn your wifi off first. It still works.",
      stack: "React · no network calls after load · enforced by CSP, not by promise",
      cta: "Scrub a file",
    },
  ],
};

/* ---------------------------------------------------------------------------
 * §7 WRITING — SCAFFOLDED / HIDDEN (FLAGS.SHOW_WRITING)
 * ------------------------------------------------------------------------- */
export const WRITING = {
  label: "FROM THE FIELD",
  dek: "Notes on making privacy real: signal enforcement, consent evidence, and what privacy-by-default actually costs to build.",
  posts: [], // { title, date, dek, href }
};

/* ---------------------------------------------------------------------------
 * §8 PORTFOLIO — SCAFFOLDED / HIDDEN (FLAGS.SHOW_PORTFOLIO)
 * Case-study template mirrors the Work card: an expanded card.
 * ------------------------------------------------------------------------- */
export const PORTFOLIO = {
  label: "CASE STUDIES",
  dek: "Deep dives into the systems behind the numbers.",
  studies: [], // { title, tag, problem, role, outcome, href }
};

/* ---------------------------------------------------------------------------
 * §9 CONTACT
 * ------------------------------------------------------------------------- */
export const CONTACT = {
  heading: "Building privacy that's meant to be obeyed?",
  sub: "Whether you're hiring, comparing notes, or looking for a privacy escalation point who ships, let's talk.",
  ctaPrimary:   { label: "Connect on LinkedIn", href: IDENTITY.linkedin },
  ctaSecondary: { label: "Email",               href: `mailto:${IDENTITY.email}` },
};

/* ---------------------------------------------------------------------------
 * FOOTER + PRIVACY — brand/02 §0, brand/07
 * ------------------------------------------------------------------------- */
export const FOOTER = {
  privacyNote:
    "This site collects nothing personal. No cookies, no trackers, no ad pixels. Fonts and assets are self-hosted, and it honors your Global Privacy Control signal.",
  privacyLinkLabel: "Read the details",
};

export const PRIVACY_PAGE = {
  title: "Privacy | Justin T. McCain",
  heading: "This site collects nothing.",
  updated: "July 2026",
  intro:
    "I build privacy infrastructure for a living. It would be strange to run a site that quietly did the opposite, so this one doesn't. Here is the whole truth about it, in plain language.",
  sections: [
    {
      h: "What's collected",
      p: [
        "Nothing personal. No cookies are set. No localStorage or sessionStorage is used to identify or follow you. There is no analytics script, no tag manager, no advertising pixel, no session recording, no fingerprinting, and no cross-site identifier of any kind.",
        "You can verify this yourself: open your browser's developer tools, load this page, and look at Application → Cookies (empty) and the Network tab (first-party requests only).",
      ],
    },
    {
      h: "Third parties",
      p: [
        "There are none on this page. Fonts, images, motion, styles, and scripts are all served from this domain. Notably there is no Google Fonts request, because that CDN would see your IP address and there is no reason for it to.",
        "The only third-party destinations here are links you choose to click: LinkedIn, and a mailto: link to my inbox. Clicking them takes you to those services under their own policies, not mine.",
      ],
    },
    {
      h: "Global Privacy Control",
      p: [
        "This site honors GPC and Do Not Track. In practice that commitment is trivially met, because there is nothing here to opt out of. No tracking runs whether or not you send the signal. If analytics are ever added, they will be cookieless and aggregate, they will skip counting when GPC or DNT is present, and this page will be updated before that ships, not after.",
      ],
    },
    {
      h: "Contact and forms",
      p: [
        "There is no contact form, by design. A form means a server, a database, and a retention question. Instead there is a mailto: link. You email me directly, from your own client, and the message lives in my inbox and nowhere else. Nothing about you reaches this site.",
      ],
    },
    {
      h: "Server logs",
      p: [
        "Whoever hosts this site may keep standard, short-lived request logs, the ordinary plumbing of serving a web page. I don't build profiles from them, I don't sell or share them, and I don't combine them with anything else.",
      ],
    },
  ],
  closing:
    "If any of the above ever stops being true, this page changes first. That's the same standard I hold the products I build to.",
};
