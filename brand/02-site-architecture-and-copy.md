# Site Architecture & Website Copy

Single-page, scroll-driven, built to grow. Sections in scroll order. Each section notes **[Brand]** (what serves the personal brand) and **[Hire]** (what serves the recruiter). Both live in the same block. Copy below is final, in-voice, drop-in ready, and matches `site/src/content.mjs` exactly.

---

## Copy rules

Four rules govern every string on the site. They exist because breaking them is what makes copy read as machine-written or as a compliance disclosure.

1. **No em dashes.** Use a colon, a period, a comma, or parentheses. En dashes in numeric ranges (`$700K–$1.2M`) are correct typography and stay.
2. **No "actually".** It hedges, and it reads junior. State the thing.
3. **Vary the architecture between sections.** The "Not X. Y." contrast pair and the rule-of-three noun phrase are each strong once. Repeated in every section they stop being a voice and become a template.
4. **Disclosure discipline.** Publish outcome, ownership, and scale. Never root-cause mechanism plus violation-scope plus company attribution together. Any two of those are fine; all three is a compliance admission with a company name on it. This is why no ARPU formula, account count, page-load percentage, or partner count appears anywhere below. Those belong in interview conversations.

A `Broken` field describes **the failure mode of the domain**, never an incident at a named company. "This is where these systems break" is expertise. "This broke here, at this scale, and here is the revenue impact" is a disclosure.

---

## 0. Global chrome (nav + footer)

**Top nav (sticky, minimal, dark):** JTM node-monogram (left) · anchor links `Work · Proof · About · Contact` (center/right) · LinkedIn glyph (correct URL: `https://www.linkedin.com/in/justintmccain/`). Collapses on mobile. Nav background stays transparent over the hero, gains a subtle `#0A0F14` blur-panel after scroll.

- **[Brand]** minimal, confident, gets out of the way of the signal.
- **[Hire]** LinkedIn is one tap from anywhere; anchor links let a recruiter jump straight to Proof.

**Footer:** node atom · `Justin T. McCain` · `Privacy Product Leader` · LinkedIn · email · link to `/privacy` · copyright and year.

**Footer privacy note:**
> This site collects nothing personal. No cookies, no trackers, no ad pixels. Fonts and assets are self-hosted, and it honors your Global Privacy Control signal. [Read the details →]

---

## 1. HERO — "The Signal"
*Motif: The Signal Field (scroll-critical). Motion: the signal ignites and begins to travel.*

**Wordmark (Space Grotesk, above the eyebrow):** `Justin T. McCain` with the amber node as terminal punctuation, per `brand/01` §3.1. Drawn from `IDENTITY.name` so there is one spelling. Sized between the eyebrow and the Display-XL headline: prominent as identity, subordinate to the POV line that is the actual hook.

**Eyebrow (mono, Slate):** `PRIVACY PRODUCT LEAD · GLOBAL PRIVACY INFRASTRUCTURE`

**Headline (Display-XL):**
> I make the safe default
> the real default.

**Sub-headline (Body-lg):**
> I own the consumer privacy infrastructure behind 100M+ user accounts, from signal capture through enforcement to the evidence that proves it happened.

**Proof line (mono, Seal Amber node):**
> ● Recovered ~$1.75M/yr in ad revenue by auditing and hardening opt-out signal enforcement across the web platform.

**CTAs:** primary `Connect on LinkedIn` → LinkedIn URL · secondary `See the work` → anchors to §3.

- **[Brand]** the cinematic signal field plus the challenger headline give the experience and the point of view in five seconds.
- **[Hire]** the eyebrow states seniority, company, and domain; the amber proof line delivers a hard, consumer-scale metric immediately. No scrolling required to know he is senior and quantified.

---

## 2. THE THESIS — "The gap"
*Motif: a single signal line crossing the viewport. Motion: the line crosses the gap, calm and deliberate.*

**Section label (mono):** `THE POINT OF VIEW`

**Body (large editorial type, one idea per paragraph):**
> Privacy has a gap between what's written and what's real.
>
> A policy promises the company honors your choice. Production quietly does not.
>
> I have spent ten years closing that gap as the product leader who owns the infrastructure in between: the signal that gets honored, the deletion that propagates, the evidence that outlasts the account.
>
> Privacy that only lives on paper is exposure with better documentation.

The phrase **"exposure with better documentation"** is emphasised in the final paragraph. It is the shareable line.

- **[Brand]** the manifesto voice; the quotable closing line is the POV in seven words.
- **[Hire]** establishes scope and seniority ("owns the infrastructure," "ten years") and frames every metric that follows.

---

## 3. THE WORK — "Not programs. Products."
*Motif: signal hardening into structure. Motion: the flow crystallises into an enforcement lattice as cards enter.*

**Section intro (mono label + H2):**
`WHAT I'VE SHIPPED` · **Not programs. Products. Here's what shipped, and what it moved.**

Six flagship cards. Each card format: **Broken → Built → Moved**. Company tag in mono. On wide screens the cards run two-up, so six read as a clean 2 + 2 + 2. The CSS still spans an odd last card to full width, so adding or removing one never strands a card in a half-empty row.

**Card 1 — Hardening the opt-out signal** `ROKU`
- *Broken:* Opt-out signal enforcement looks simple and rarely is. Regional carve-outs, legacy integrations, and browser-level nuance are where it quietly breaks.
- *Built:* Audited and hardened signal enforcement across the web governance stack, end to end.
- *Moved:* **~$1.75M/yr in recovered ad revenue.**

**Card 2 — DSAR, from inbox to product** `ROKU`
- *Broken:* Hundreds of data-subject requests arrived as email and were triaged by hand, one at a time. Slow, unauditable, and impossible to prove after the fact.
- *Built:* Owned the end-to-end DSAR product: automated parsing, system routing, verification, and audit logging. Held **zero regression** through a major CRM migration that could easily have broken deletion compliance at cutover.
- *Moved:* Time to kick off a request fell from **8 days to same day**, and a manual liability became an audited, scalable product.

**Card 3 — Deletion that scales** `ROKU`
- *Broken:* Partner deletion ran on manual email and CSV hand-offs. Brittle, unauditable, impossible to scale.
- *Built:* Led the **first API-first partner-deletion pilot**, replacing a legacy manual process with an automated, auditable one.
- *Moved:* Proved a scalable path off brittle process for the entire partner ecosystem.

**Card 4 — Evidence that outlives the account** `ROKU`
- *Broken:* Consent evidence is only as good as its ability to survive the deletion it is meant to prove.
- *Built:* Architected server-side, first-party consent enforcement and a **durable, append-only evidence layer that survives account deletion**, moving vendor collection onto systems we control.
- *Moved:* Turned a compliance claim into a defensible record.

**Card 5 — A privacy program, stood up fast** `CENGAGE`
- *Broken:* Enterprises this size often run privacy as a legal checklist rather than a product: no unified opt-out handling, no formal risk program, reactive by default.
- *Built:* Shipped Global Privacy Controls enterprise-wide in **90 days**, rebuilt DSAR to cover deletion, access, and rectification within six months, and stood up the company's **first Privacy Risk Register** with KRIs, KPIs, and a maturity scorecard benchmarked to NIST.
- *Moved:* Privacy became an auditable, benchmarked product function in under two quarters.

**Card 6 — Consent, rebuilt for a global enterprise** `BAYER`
- *Broken:* A 100,000-person enterprise operating in more than 80 countries had no single way to capture or honor consent. Every region solved it locally, so no one could answer a basic question about what a person had agreed to.
- *Built:* Built the enterprise consent framework and the platform beneath it, integrating **20+ source systems** and harmonizing **~40M user profiles** into one record.
- *Moved:* One consent record, one answer, in every market.

- **[Brand]** the Broken→Built→Moved narrative is craft and storytelling; the "signal hardening into ledger" motion is the brand thesis enacted.
- **[Hire]** every card ends in scope and an outcome; company tags signal consumer scale; instantly scannable for what he owns.

*(Architecture note: cards are a repeatable component. Bayer and TD Ameritrade wins live in §4 Ledger to keep §3 focused. Easy to add or reorder.)*

---

## 4. THE LEDGER — "Receipts, not promises"
*Rendered on **Evidence Paper** (light surface, 90% opacity so the signal stays faintly visible travelling behind the record). Motif: append-only ledger rows. Motion: the film resolves into fixed, stamped rows. This is the recruiter's block, and it is on-brand as "the receipts."*

**Section label (Mint Ink on paper):** `THE EVIDENCE`
**H2 (ink):** Privacy you can measure, ship, and defend.

**Ledger (mono rows, amber seal on the figure):**
| # | Record | Proof |
|---|---|---|
| ● | Opt-out signal enforcement hardened | **~$1.75M/yr** recovered |
| ● | Consent lifecycle owned | **100M+** user accounts |
| ● | DSR email intake automated | **8 days → same day** to kick off |
| ● | Privacy-complaint closure process rebuilt | **>10 days → <2 business days** |
| ● | Partner deletion automated (API-first) | Replaced a manual email and CSV process |
| ● | Enterprise consent framework built 0→1 | **100k-person** enterprise across **80+** countries |
| ● | Consent platform integration | **20+** systems · **~40M** profiles harmonized |
| ● | Global privacy delivery | **309** launches across **55** countries |
| ● | CCPA program built 0→1 | Enterprise-wide DSAR rollout · led a **100+** associate project team |
| ● | Engineering teams led | Up to **30** engineers across time zones |
| ● | Program maturity | First Privacy Risk Register, benchmarked to **NIST** |
| ● | Incident response led | **3** incidents, intake to notification decision |
| ● | Cross-border transfer risk | Enterprise **Schrems II** remediation |
| ● | Budget ownership | **$700K–$1.2M** |

The 0→1 rows name **what** was built from nothing. "CCPA 0→1" on its own told a reader nothing about scope or ownership.

**Scope-at-a-glance strip (mono):** `Roku · Cengage · Bayer · TD Ameritrade` · `GDPR · CPRA · LGPD · VPPA · GLBA` · `CIPM · 10+ years`.

- **[Brand]** "receipts, not promises" made literal. The ledger *is* the brand argument.
- **[Hire]** the single most scannable proof-of-seniority block on the site: outcomes, regulations, companies, team sizes, incident response, budget, and cert in one glance.

---

## 5. WHAT I OWN — Capabilities
*Motif: three signal paths (pillars) plus a fourth emerging path (Privacy × AI). Motion: paths light in sequence.*

**Section label:** `WHAT I OWN`

**Pillar 1 — Signal → Enforcement.** I build the systems that honor opt-outs at scale. *GPC and DNSS enforcement · consent signal capture · web governance.*

**Pillar 2 — 0→1 Product Ownership.** End-to-end privacy products, owned from strategy through production. *DSAR automation (Ketch, OneTrust) · consent management at scale · API-first deletion.*

**Pillar 3 — Durable Evidence & Trusted Escalation.** I make privacy provable, and I am the escalation point when it has to be right. *Append-only evidence · data governance and retention · incident response · third-party risk · NIST-benchmarked risk register.*

**Emerging — Privacy × AI.** Key stakeholder in AI governance and DLP, aligning privacy controls with enterprise AI strategy. *I build with AI daily (Claude Enterprise, Claude Code, Glean), so I govern the frontier from inside it.*

**Competencies strip (mono):** DSAR Product & Automation · Consent Management at Scale · Data Governance & Retention · Privacy-by-Design · Incident Response · Cross-Border Transfer Strategy · Global Privacy Regs (GDPR · CPRA · LGPD · VPPA · GLBA) · Ketch · OneTrust · Acryl/DataHub.

- **[Brand]** the pillars are the POV structured; the AI thread signals where the category is going.
- **[Hire]** maps cleanly to job-description language; the tool names are recruiter keyword-matches.

---

## 6. ABOUT — first person
*Motif: The Human. Motion: the line quiets; the human moment.*

**Section label:** `WHO'S BEHIND THIS`

**Copy:**
> Anyone can publish a policy that promises to honor your choices. Building the system that does it, and proving it did, is the harder and more interesting problem. That is the part I own.
>
> For ten years I have worked where privacy law meets production code, turning GDPR, CPRA, LGPD, and VPPA into products that make the safe thing the default thing. I have recovered seven figures by auditing a single opt-out signal most teams never look at twice. I replaced manual, email-based deletion with API-first infrastructure, and built consent evidence that outlives the account it belonged to.
>
> I sit at an uncommon intersection of product management, engineering fluency, and enough legal literacy to argue the edge cases. That combination is why legal, security, and executive teams escalate to me when the answer has to be right. I am a builder. I like the version of privacy you can measure, ship, and defend.

**Pull-quote (Display, amber node):** *"I like the version of privacy you can measure, ship, and defend."*

**Credential line (mono):** `CIPM, IAPP · 10+ years · Roku · Cengage · Bayer · TD Ameritrade`

**Portrait:** 4:5, left column at 20rem. A real studio headshot graded into the palette (see `site/assets/ASSET-LOG.md`). The panel border is removed when a real portrait is present, because a frame around a vignette draws a rectangle exactly where the image is dissolving. A placeholder path remains and reserves identical dimensions, so there is no layout shift either way.

- **[Brand]** the human, the voice, the portrait: warmth and a memorable line.
- **[Hire]** the rare product, engineering, and legal intersection stated plainly; cert and tenure visible.

---

## 6b. TESTIMONIALS — "The corroboration"
*Sits between About and Contact. The Ledger is the metric proof; this is the human proof, and it hands off warm to the CTA. Motion: the paths converge into one warm line, held.*

Deliberately **not** the Work card treatment. Boxed panels would echo §3 and re-assert structure exactly where the journey is meant to quiet. These are open, left-ruled blocks using the same hairline vocabulary as the hero proof line, at rest. Two-up on wide screens; the LinkedIn hand-off is the trailing cell, which both sends people to the source and squares off a five-quote grid.

**Section label:** `THE CORROBORATION`
**H2:** Ask the people who shipped it with me.
**Note (mono):** Excerpts. The full set lives on LinkedIn.

These are other people's published words. Excerpted, never reworded. **The copy rules above do not apply inside these quotes.** They are quotations, not our copy. Do not edit them for voice or punctuation.

> "Justin is, without a doubt, the most exceptional product manager I have ever worked with. His ability to navigate complex projects with precision, clarity, and efficiency is truly remarkable. A gifted communicator with a razor-sharp mind, he keeps projects moving forward seamlessly, ensuring that every team member is aligned and motivated."
> — **Ashley Kilgore-Crowley**, Sr. UX Designer

> "Time and again, I found myself wondering, how does he stay so on top of everything? Every project I worked on with him was well-run, well-supported, and delivered exceptional value from day one to launch. Thanks to his strategic mindset, execution skills, and unwavering commitment to success."
> — **Ryan Stiers**, Lead Product Designer

> "Justin is easily one of the sharpest minds I've ever worked with. I am always excited when I get the opportunity to work directly with his team, because I know the work will be well thought out, organized, and fun to do. He is a true leader, with the ability to effortlessly bring people together around an idea."
> — **Rachel Guethle**, Sr. Digital Marketing Automation Professional

> "Working with Justin McCain was the best and most collaborative experience I've had in my professional history. I not only felt encouraged but also empowered to be innovative. The successes I've had in my role working for Justin are due in part to his leadership."
> — **René Morales**, Product Specialist

> "I have had the pleasure of working under Justin McCain's leadership and have been impressed with his ability to manage and drive forward complex business implementations and the people delivering those products. He has set the bar high with how to manage properly and moving forward his example will both be a goal for me to meet and an example to measure others against."
> — **Jimi Figueredo**, Product Specialist

*(Jimi's source text reads "a example to measure others against"; the article is corrected on the site. The correction is flagged in `content.mjs` so it can be reverted to verbatim.)*

**Trailing cell:** `All recommendations on LinkedIn →` linking to `https://www.linkedin.com/in/justintmccain/details/recommendations/?detailScreenTabIndex=0`.

- **[Brand]** the ledger argues with numbers; this argues in other people's voices. Same claim, different register.
- **[Hire]** peer and report testimony on execution, communication, and leadership, which no metric conveys.

---

## 7. WRITING & SPEAKING — [SCAFFOLDED / HIDDEN]
*Built but not shown until populated. Same pattern as the portfolio slot.*

- Component and section exist (`#writing`), hidden via `SHOW_WRITING = false` in `src/content.mjs`.
- Empty-state copy ready for when it flips on: **`FROM THE FIELD`** · *"Notes on making privacy real: signal enforcement, consent evidence, and what privacy-by-default actually costs to build."*
- Card component matches §3 (title, mono date, one-line dek, link).
- **Positioning now:** the Thesis (§2) carries the thought-leadership weight until real artifacts exist.

- **[Brand]** reserves the authority-platform surface for when talks and writing land.
- **[Hire]** neutral when hidden; adds credibility when active.

---

## 8. PORTFOLIO — [SCAFFOLDED / HIDDEN]
*Reserved, clean slot. Hidden until populated.*

- Section `#portfolio` and a case-study component exist; hidden via `SHOW_PORTFOLIO = false`.
- Case-study template ready: problem, role, outcome metrics. Mirrors §3 card language so a case study is an expanded card.
- **[Brand]** keeps the option open without cluttering v1.
- **[Hire]** when active, deep-dive proof; when hidden, zero cost.

---

## 9. CONTACT / CTA
*Motif: the node, honored (amber). Motion: the signal arrives at the threshold and seals.*

**H2:** Building privacy that's meant to be obeyed?
**Sub:** Whether you're hiring, comparing notes, or looking for a privacy escalation point who ships, let's talk.

**Primary CTA:** `Connect on LinkedIn` → `https://www.linkedin.com/in/justintmccain/`
**Secondary:** `Email` → `mailto:JustinTMcCain@protonmail.com` (mailto only, no form, no data collection, on-brand).

- **[Brand]** closes on the tagline; the honored-node seal completes the signal→evidence journey.
- **[Hire]** unmistakable, correct LinkedIn link and direct email; frictionless for a recruiter.

---

## Content-map summary
`Nav → Hero(Signal) → Thesis → Work(6 cards) → Ledger(Evidence Paper) → Capabilities → About(portrait) → Testimonials → [Writing hidden] → [Portfolio hidden] → Contact → Footer(privacy note)`

**Update points (see `00-README.md` and `site/README.md`):** every word and number lives in `site/src/content.mjs`; run `node build.mjs` to regenerate. `SHOW_WRITING` / `SHOW_PORTFOLIO` flags control the hidden sections. Proof metrics are centralised so a figure changes in one place.

**Adding or removing a section changes the motion.** Scroll progress is normalised to total page height, so a new section shifts every earlier beat against its section. Re-measure where the sections land and re-cut the master film if the beats have moved. See `site/assets/ASSET-LOG.md`.
