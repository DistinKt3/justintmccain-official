# Justin T. McCain — Brand Guidelines

**Version:** 1.0 · Phase 1 (Brand) complete
**Owner:** Justin T. McCain
**Purpose:** The single source of truth for the personal-brand career site. Detailed enough to execute against without guessing.

**Where copy lives:** every shipped string is in `site/src/content.mjs`, mirrored 1:1 in `brand/02-site-architecture-and-copy.md`. The narratives, proof statements, and headline bank below are the *source material* those are drawn from. Change any of the three and change all three.

**Brand codename:** SIGNAL
**Creative spine:** `signal → enforcement → evidence` (which is also `brand → proof` and `cool → warm`). Every decision serves that journey.

---

## 1. Positioning & Strategy

### Category (the lane)
**Consumer Privacy Infrastructure.** Product leadership that turns privacy law into systems that *enforce*, at consumer scale.

### The claim (POV, the category-of-one line)
> **Privacy, built to be obeyed.**

Most privacy leaders own the *policy*. Justin owns the *product that honors the opt-out*: signal capture, enforcement, durable evidence, for 100M+ households, with the metrics to prove it. That gap is the entire brand.

### Positioning statement
> For consumer companies operating at scale under a thicket of privacy law, **Justin T. McCain is the privacy product leader who turns GDPR, CPRA, LGPD, and VPPA from legal risk into shipped infrastructure**: the systems that capture the signal, enforce the opt-out, and keep the receipts. Unlike privacy leaders who stop at policy and compliance checklists, he owns the product that makes the safe default the real default, and he is the escalation point legal, security, product, and executives trust when it has to be right.

### Dual-audience mandate (non-negotiable)
The site serves two audiences **in parallel, on the same pixels**. Never a separate "for recruiters" mode.

| | Personal-brand audience (peers, privacy community, advisory/speaking) | Hiring audience (execs, hiring managers, recruiters) |
|---|---|---|
| **First 5 seconds must land** | "This person has a real, uncommon POV, and has clearly *built* things I haven't." | "Senior, consumer-scale, owns end-to-end product scope, quantified impact. A safe, high-signal hire." |
| **How one block serves both** | The cinematic experience plus the challenger line is the voice. | The same block's supporting line is a hard metric (~$1.75M/yr recovered, 100M+ households, owns end-to-end consent and DSAR). |

**Resolution rule:** when a design or copy choice forces a trade-off, keep the brand voice on the surface and thread the hiring proof *through* it (a cinematic section whose supporting line is a hard metric). Never bolt on a plain résumé block to appease recruiters.

### Competitive whitespace
- **The norm:** text-only LinkedIn-clone sites or nothing. IAPP-badge résumés, "trust & privacy consultant" templates, padlocks, shields, blue corporate gradients, hooded-hacker stock. The few genuine thought leaders live on LinkedIn newsletters and conference stages, rarely a crafted site.
- **The empty triangle Justin owns:** almost no one pairs **(1) real product and engineering fluency**, **(2) a distinctive, quotable POV**, and **(3) best-in-class web craft.** Holding all three means standing alone in the frame.
- **The meta-move nobody makes:** a privacy site that visibly *respects privacy* (no creepy analytics, honest consent posture). For Justin specifically, the site practicing what it preaches is proof, not decoration.

### Messaging hierarchy
**Primary message:** *I make the safe default the real default, and I can prove it.*

**Three pillars** (each carries brand POV plus recruiter proof):
1. **Signal → Enforcement.** I build the systems that honor opt-outs at scale.
   *Proof:* ~$1.75M/yr in ad revenue recovered by auditing and hardening opt-out signal enforcement · GPC scaled enterprise-wide in 90 days (Cengage).
2. **0→1 Product Ownership.** End-to-end privacy *products*, owned from strategy through production.
   *Proof:* DSR email intake automated from 8 days to same-day kickoff · end-to-end DSAR product on Ketch · first API-first partner-deletion pilot · enterprise consent framework for a 100k-person business across 80+ countries · 309 launches across 55 countries.
3. **Durable Evidence & Trusted Escalation.** I make privacy *provable*, and I am the escalation point when it has to be right.
   *Proof:* append-only consent-evidence layer that survives account deletion · privacy-complaint closure cut from >10 days to <2 business days with SLAs · 3 incidents led from intake to notification decision · enterprise Schrems II remediation · Privacy Risk Register benchmarked to NIST.

**Rising thread, "Privacy × AI":** key privacy stakeholder in AI governance and DLP, honestly scoped as stakeholder rather than owner. Woven through copy as a *forward* signal. Reinforced by Justin using AI in his own workflow (Claude Enterprise, Claude Code, Glean), practicing the frontier he governs. High-leverage for a 2026 brand, and almost nobody in privacy-product credibly holds it.

---

## 2. Verbal Identity

### Voice archetype
**POV-forward challenger.** Authoritative because *specific*. Confidence comes from concrete detail, never adjectives. Technical but not dry, human but not soft.

### Copy rules (binding on every shipped string)

1. **No em dashes.** Use a colon, a period, a comma, or parentheses. En dashes in numeric ranges and compound place names are correct typography and stay.
2. **No "actually".** It hedges, and it reads junior. State the thing.
3. **Vary the architecture between sections.** The "Not X. Y." contrast pair and the rule-of-three noun phrase are each strong once. Repeated in every section they stop being a voice and become a template.
4. **Disclosure discipline.** Publish outcome, ownership, and scale. Never root-cause mechanism plus violation-scope plus company attribution together. Any two are fine; all three is a compliance admission with a company name on it.

Rule 4 is the one with teeth. A named current employer plus a specific enforcement mechanism plus a quantified failure scope is not a résumé bullet, it is a dated public statement that a regulator or opposing counsel can quote. This is why no ARPU formula, account count, page-load percentage, or partner count appears in any shipped string. Those belong in interview conversations, where they are persuasive and unindexed.

### Tagline
**Primary:** *Privacy, built to be obeyed.*
**Alternates:** (1) *Signal. Enforcement. Evidence.* (2) *I make the opt-out mean something.* (3) *The safe default, made the real one.*

### Brand narrative, short (bio/meta/hero support)
> Justin T. McCain builds consumer privacy infrastructure at 100M-household scale: the systems that capture the signal, enforce the opt-out, and keep the receipts. He turns GDPR, CPRA, LGPD, and VPPA into shipped product, and he is who legal, security, and executives escalate to when it has to be right.

### Brand narrative, long (about-page spine)
> Privacy has a gap between what's written and what's real. A policy says the company honors your opt-out; production quietly does not. Justin T. McCain has spent ten years closing that gap as the product leader who owns the infrastructure in between. He started at the 0→1 edge, standing up CCPA, DSAR, and consent tooling at TD Ameritrade, scaled it across 55 countries and ~40M user profiles at Bayer, built the privacy program enterprise-wide at Cengage, and now owns the end-to-end consent lifecycle for one of the largest streaming platforms on earth. His work is unglamorous and consequential: the signal that gets honored, the deletion that propagates, the evidence that outlasts the account. He partners as deeply with engineers as with lawyers, because privacy that only lives on paper is exposure with better documentation.

### About story (first person, on-site voice)
*Shipped verbatim as §6 of `brand/02` and `ABOUT.paragraphs` in `content.mjs`.*

> Anyone can publish a policy that promises to honor your choices. Building the system that does it, and proving it did, is the harder and more interesting problem. That is the part I own.
>
> For ten years I have worked where privacy law meets production code, turning GDPR, CPRA, LGPD, and VPPA into products that make the safe thing the default thing. I have recovered seven figures by auditing a single opt-out signal most teams never look at twice. I replaced manual, email-based deletion with API-first infrastructure, and built consent evidence that outlives the account it belonged to.
>
> I sit at an uncommon intersection of product management, engineering fluency, and enough legal literacy to argue the edge cases. That combination is why legal, security, and executive teams escalate to me when the answer has to be right. I am a builder. I like the version of privacy you can measure, ship, and defend.

### Voice & tone, do / don't
| Do | Don't |
|---|---|
| Lead with the claim, then the number. *"I make the opt-out mean something. ~$1.75M/yr in recovered revenue proves it."* | Stack buzzwords. *"Passionate privacy evangelist leveraging synergies."* |
| Name the broken thing as a **failure mode of the domain**. *"Enforcement looks simple and rarely is."* | Name it as an **incident at a named company**. *"Production quietly didn't honor it."* That is a disclosure, not a credential. |
| Use concrete systems and real nouns. *"append-only consent-evidence layer."* | Hedge ownership. *"Helped support privacy initiatives."* |
| Translate internal vocabulary for a stranger. *"a migration that could have broken deletion compliance at cutover."* | Ship internal system names. *"a shared holding-queue bridge."* |
| Short declaratives. Technical precision, human warmth. | Compliance-theater filler. *"We take your privacy seriously."* |
| Let a dry, confident wit show up, sparingly. | Try to be funny every line, or perform edginess. |

**Governing principle:** *authoritative because specific*, where "specific" means specific about the **problem domain and the outcome**, not about who failed and by how much.

### Proof-statement bank
**Core set (lead everywhere, outcome-first, dual-audience):**
1. Recovered ~**$1.75M/yr** in ad revenue by auditing and hardening opt-out signal enforcement across the web platform.
2. Own the **end-to-end consent lifecycle for 100M+ user accounts**: signal capture, enforcement, evidence, and web governance.
3. Cut privacy-complaint closure from **>10 days to <2 business days** by rebuilding intake with SLAs and fully auditable tracking.
4. Automated **DSR email intake** into the request system, cutting time-to-kickoff from **8 days to same day**.
5. Built the first **API-first partner-deletion pilot**, replacing a legacy manual email and CSV process.
6. Turned manual DSAR triage into an **automated product on Ketch**: parsing, routing, verification, and audit logging across access, deletion, rectification, and VPPA.
7. Built an **enterprise consent framework 0→1** for a **100k-person** business operating across **80+ countries**, integrating 20+ source systems and harmonizing ~40M profiles.
8. Built an **append-only consent-evidence layer that survives account deletion**, so "we honored it" is a fact rather than a claim.
9. Scaled privacy delivery across **55 countries and 309 launches**.
10. Stood up a privacy program **0→1 at Cengage**: GPC enterprise-wide in 90 days, DSAR rebuilt in six months, and the first Privacy Risk Register benchmarked to NIST.
11. Built **CCPA compliance 0→1**: led an enterprise-wide DSAR rollout with a **100+ associate** project team. Have led engineering teams of up to **30** across time zones.

**Extended library (draw from across sections):**
- Led **3 incident responses** end to end, from intake through notification decision.
- Ran enterprise **Schrems II remediation** and a division-wide data-minimization strategy, reducing cross-border transfer risk.
- Managed **$700K–$1.2M** in product and compliance budgets.
- Run **global third-party risk assessment and compliance escalations** across Legal, Compliance, and Security.
- Key privacy stakeholder in **AI governance and DLP**, aligning privacy controls with enterprise AI strategy.
- Stood up enterprise **data mapping and Privacy Impact Assessment** processes. *You can't enforce what you can't see.*
- Designed **data-usage labeling** and annual privacy-policy audits for NA, making data use legible rather than buried.
- Unified **10M+ profiles across Adobe, Qualtrics, and Salesforce** via enterprise identity resolution.
- First **Privacy Risk Register benchmarked to NIST**: KRIs, KPIs, board-ready scorecards.
- Operated as the **Enterprise Data Governance Authority privacy lead** (TD Ameritrade).
- Built **privacy literacy** across business units via trainings and lunch-and-learns.

### Headline bank
- "I make the safe default the real default."
- "Privacy law gets written. I build the part that enforces it."
- "The opt-out only matters if something honors it. I build that something."
- Section-intro (Work): *"Not programs. Products. Here's what shipped, and what it moved."*
- Section-intro (Evidence): *"Privacy you can measure, ship, and defend."*
- Section-intro (Corroboration): *"Ask the people who shipped it with me."*

---

## 3. Visual Identity

### 3.1 Logo / wordmark / monogram
**Brand atom — "the node":** a single filled circle = the point where a signal is captured and *honored*, with an optional faint concentric pulse-ring. Recurs as list bullets, section markers, the end-of-line "receipt" after a proof stat, and the favicon. Smallest unit of "built to be obeyed."

- **Primary wordmark:** `JUSTIN T. McCAIN`, precise technical grotesque (Space Grotesk), tight tracking, **the node as terminal punctuation** (the period that means *honored*).
- **Monogram:** `JTM` sharing a single horizontal **signal baseline** running through all three letters, terminating in a filled node on the right (signal enters → enforced → stops clean).
- **Favicon / avatar glyph:** the **node-at-the-gate** — a mint node resting against a vertical amber threshold line. Scales to 16px.
- **Buildability:** wordmark, monogram, and glyph are CSS/SVG — no heavy asset dependency; crisp and fast at any size.

**Logo usage do/don't:** never re-color the node outside Signal Mint (live) or Seal Amber (honored/sealed) · never add drop shadows/bevels/gradients to the mark · maintain clear space ≥ the node diameter × 2 on all sides · never stretch or rotate the wordmark · monogram minimum 24px, favicon glyph minimum 16px.

### 3.2 Color system (roles + hex)
| Role | Name | Hex | Use |
|---|---|---|---|
| Background (primary) | Signal Black | `#0A0F14` | The infrastructure/backend space where enforcement lives |
| Surface (secondary) | Deck | `#131A22` | Elevated panels, cards |
| Line / border | Grid | `#212B35` | Hairlines, lattice, dividers |
| Text primary | Daylight | `#EEF2F6` | Headlines, body |
| Text secondary | Slate | `#A6B2BF` | Muted/labels (AA-safe on Signal Black, ~8.6:1) |
| **Accent 1 — cool** | **Signal Mint** | `#5FE3C4` | Live signal, flow, links, motion, interactive |
| **Accent 2 — warm** | **Seal Amber** | `#E9B44C` | Honored endpoint, key metrics, the "receipt/stamp" |
| Light semantic surface | Evidence Paper | `#F5F3ED` (ink `#14181D`) | Proof/ledger sections as a printed record |
| Signal Mint (dark) | Mint Ink | `#0B6B58` | **Required** for mint text/links/small marks *on Evidence Paper* (light-surface contrast) |

**Rationale (psychology):** near-black = depth, infrastructure, the unglamorous backend where real enforcement happens. Signal Mint deliberately rejects "privacy blue" — it reads *live, safe, go* (the opt-out moving and being honored) and is ownable. Seal Amber is the human warmth of a *record made real* — the stamp on a receipt, the moment a promise becomes proof. Cool→warm across the page = signal→evidence = the brand's argument, felt not explained.

**Accent discipline:** Signal Mint and Seal Amber are the *only* chromatic accents. Everything else is tonal (the black→slate→daylight ramp). Never introduce a third hue. Amber is rationed — reserved for the honored/proof moment and top-line metrics, so it stays meaningful.

### 3.3 Mode decision (LOCKED)
**Dark-primary is canonical.** SIGNAL only works luminous-on-dark; the cinematic scroll, the 3D signal-field, and the "survives deletion" moment all live in dark. **Light is deployed semantically**, not as a coin-flip: the Evidence Paper surface renders proof/ledger sections as a *printed record* (the recruiter-scannable, high-contrast, authoritative moment — reinforcing "receipts, not promises"). So dual-audience resolves in the palette itself: **dark = the signal (brand); light = the ledger (proof).** A respectful **optional full light theme** honors `prefers-color-scheme: light` as progressive enhancement.

### 3.4 Typography
- **Display / headlines — Space Grotesk** (500 / 700). Technical, precise, mono-derived — echoes the signal/data theme. Tracking −0.02em. *Premium upgrade path: Söhne / Neue Haas Grotesk Display.*
- **Body / UI — Inter** (400 / 500). Neutral, workhorse legibility. *Premium path: Söhne.*
- **Mono / evidence & data — IBM Plex Mono** (400 / 500). Metrics, receipts, section labels, node captions, ledger rows. The texture that makes "evidence" feel real.

**All fonts self-hosted** (no Google Fonts CDN) — required by the privacy posture (see `07-analytics-and-privacy.md`). Subset to Latin.

**Type scale (fluid clamp):**
| Token | Size |
|---|---|
| Display-XL (hero) | `clamp(3rem, 6vw, 6.5rem)` |
| H1 | `clamp(2.25rem, 4vw, 4rem)` |
| H2 | `clamp(1.75rem, 3vw, 2.75rem)` |
| H3 | `1.5–1.875rem` |
| Body-lg | `1.125–1.25rem` |
| Body | `1rem` |
| Mono-caption | `0.8125rem`, uppercase labels tracked `+0.08em` |

### 3.5 Motion & interaction principles
*Restraint over spectacle — the site earns its motion.*
1. **Signal, not decoration.** Every animation represents signal→enforcement→evidence. No meaning → cut it.
2. **One hero motion per view.** No competing animations in a single scene.
3. **Easing:** confident expo-out `cubic-bezier(0.16, 1, 0.3, 1)` for entrances; 200–500ms micro, 600–1200ms scroll scenes. Calm and deliberate — privacy isn't frantic.
4. **Scroll spine:** the hero signal-flow is scrub-linked to scroll (the signal *travels* as you descend), then **hardens** into static ledger/structure at the proof sections — brand motion resolving into recruiter-legible fact.
5. **Micro-interactions:** hover pulses the node atom; metrics count-up once on reveal.
6. **Reduced-motion (non-negotiable):** every scene has a static, fully-legible fallback; count-ups show final numbers instantly; parallax/3D off; content identical.
7. **3D, restrained:** a single lightweight hero signal-field/node-lattice; degrades to a static render on mobile/low-power.

### 3.6 Imagery & art direction
Abstract-first infrastructure. **Banned outright:** padlocks, shields, keys, hoodies, binary rain, fingerprint clichés, glossy corporate 3D, stock-photo people at laptops. **Rules:** dramatic single-source directional light; deep shadow; fine grain/noise + precise linework; the only chromatic accents are Signal Mint + Seal Amber against near-black; everything else tonal.

**Five motifs** (full shot list + prompts in `05-higgsfield-asset-brief.md`):
1. **The Signal Field** — vast dark space, fine luminous mint paths propagating across a field of faint nodes (households); one signal pulses, reaches a gate, is honored (node seals warm amber). *Hero; scroll-critical.*
2. **The Enforcement Lattice** — precise architectural gates/thresholds; blueprint-like, cool, structural.
3. **The Ledger** — luminous horizontal strata stacking like a tamper-evident append-only record; monospace receipt fragments; a warm amber seal. *Rendered on Evidence Paper for proof sections.*
4. **Survives Deletion** — the signature image: a field of data dissolving/being deleted while a single thread of *evidence* remains, glowing and intact. *Hero-secondary; carries the differentiator.*
5. **The Human** — 1–2 editorial portraits: Justin in a dark, architectural, infrastructure-as-cathedral setting (abstracted, never a literal server room), single-source mint or amber key light, confident and human. Not a corporate headshot — a cinematic frame.

---

## 4. Do / Don't summary
**Do:** lead with POV then metric · keep dark as home, light as ledger · ration amber · self-host fonts · respect reduced-motion and GPC · let the node atom carry the system.
**Don't:** privacy-blue, padlocks, or hooded hackers · résumé-mode silos · third accent color · buzzwords or hedging · motion without meaning · any analytics that would embarrass a privacy leader.
