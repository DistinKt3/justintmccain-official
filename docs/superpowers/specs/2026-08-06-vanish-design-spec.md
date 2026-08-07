# Vanish — Design Spec

**Date:** 2026-08-06
**Status:** Draft, revised after `emil-design-eng` + `impeccable` passes — pending final user review
**Source:** `Vanish_PRD.docx` (v1.3, MVP / zero-database / zero-log edition)
**Brand source:** `career-planning-tools/brand/01-brand-guidelines.md` + `site/css/main.css` (SIGNAL system)

This spec covers the *visual, UX, and content* design of Vanish. It does not cover code architecture, data model, or build sequence — those live in the companion **implementation spec** (`2026-08-06-vanish-implementation-spec.md`).

---

## 1. Relationship to the SIGNAL brand

Vanish ships as a **separate Next.js app**, not embedded in the `career-planning-tools/site` codebase. It links from the brand site as a project entry and shares the SIGNAL visual system by direct reuse of its design tokens — it does not redefine colors, type, or motion primitives; it imports them.

The fit is not incidental: Vanish *is* signal → enforcement → evidence, literally — a user's data is the signal, the opt-out request is the enforcement, the PDF report is the evidence. Design decisions below lean into that instead of treating it as a coincidence.

**Why dark stays the default here (not inherited without asking):** the user arrives having just discovered exposed personal data — often alone, at a screen, in a moment closer to "checking something worrying" than "browsing a portfolio." Dark suits that moment; it doesn't feel institutional or performatively "safe," it feels like the private, unhurried space the zero-log promise is actually describing. The one deliberate break — Evidence Paper on `/report` (§3.6) — isn't decoration, it's the payoff: the moment of worry resolves into a printed, keepable fact. Dark-to-light across the flow mirrors the product's own arc, not just the parent brand's.

### 1.1 Product identity

| Element | Treatment |
|---|---|
| Wordmark | `VANISH`, Space Grotesk, tight tracking (`-0.02em`), same weight rules as the JTM wordmark (500/700). |
| Mark | The node atom, terminal position, rendered as a **left-to-right opacity fade (100% → 0%)** instead of the brand's solid "honored" node. Signals *erasure*, not capture — the visual inverse of the JTM mark's meaning, using the same primitive. |
| Favicon | Node-at-gate glyph; gate rendered as a closing bracket (vs. the brand's open threshold line) — same "gate" concept, now closing behind the user. |
| Relationship to JTM brand | Sub-brand. Footer credits "A SIGNAL project by Justin T. McCain" with a link out; Vanish never presents itself as a company or claims a separate identity beyond the product surface. |

### 1.2 Design tokens (reused verbatim, zero new values)

```css
/* Pulled directly from career-planning-tools/site/css/main.css — do not fork */
--signal-black: #0a0f14;   /* app background */
--deck:         #131a22;   /* cards, elevated surfaces */
--grid:         #212b35;   /* hairlines, borders, dividers */
--daylight:     #eef2f6;   /* primary text */
--slate:        #a6b2bf;   /* secondary text, help copy, labels */
--mint:         #5fe3c4;   /* live / in-progress / primary interactive */
--amber:        #e9b44c;   /* honored / done — rationed, see §3.4 */
--paper:        #f5f3ed;   /* Evidence Paper — /report screen only */
--ink:          #14181d;   /* text on Evidence Paper */
--mint-ink:     #0b6b58;   /* mint accents on Evidence Paper (contrast-safe) */

--font-display: "Space Grotesk", ui-sans-serif, system-ui, sans-serif;
--font-body:    "Inter", ui-sans-serif, system-ui, -apple-system, sans-serif;
--font-mono:    "IBM Plex Mono", ui-monospace, "SF Mono", Menlo, monospace;

--ease:      cubic-bezier(0.16, 1, 0.3, 1);
--dur-micro: 240ms;

--gut:     clamp(1.25rem, 5vw, 2.5rem);   /* horizontal gutter */
--section: clamp(5rem, 12vh, 9rem);       /* vertical rhythm between major blocks */
```

No third chromatic accent is introduced. Amber stays rationed to the "honored/done" moment exactly as the brand doc requires — see §3.4 for the one place it appears solid.

### 1.3 Voice

Calm, plain-spoken, concrete. The audience is someone who just found their home address on a people-search site — not a peer evaluating Justin's product craft. Brand discipline (no hedging, no buzzwords, short declaratives, real nouns) carries over; the *challenger edge* does not.

**Do:** "We found you on 9 sites. Here's exactly what we'll send, and you're the one who sends it."
**Don't:** "Your digital footprint is at risk — take control of your privacy today!" (scare copy, vague nouns, exclamation-point urgency)
**Don't:** "Privacy, built to be obeyed" energy in-product (that's the JTM brand voice, not Vanish's)

Mono type carries the "evidence" feeling in place of adjectives — a confidence score, a status chip, a request-log row read as *fact*, not marketing.

---

## 2. Motion & interaction

**Utility-first, confirmed.** No scroll-linked animation, no 3D, no signal-field art — including on the landing screen. This was an explicit call against the brand's default cinematic treatment, made because the user's task (find data, file removals, in under 15 minutes) is served by speed and low cognitive load, not spectacle.

What remains, inherited from the brand's existing micro-interaction tier — durations are specific per element, not a single blanket range, so small things feel fast and big things don't feel abrupt:

| Element | Duration | Easing | Notes |
|---|---|---|---|
| Button press | 100–160ms | `--ease` | `scale(0.97)` on `:active` — see §4.1 |
| Status chip color/fill change | 150–200ms | `--ease` | Outline→fill swaps (e.g. dashboard READY→SENT→DONE) add a `filter: blur(2px)` crossfade — a plain color transition shows two overlapping shapes instead of one morphing state |
| Focus ring appearance | 120ms | `ease-out` | Instant pop reads as a glitch; 120ms reads as responsive |
| Dropdown/select open (age range, state) | 150–250ms | `--ease` | Occasional-use tier — standard animation, not suppressed |
| New row entering `/scan/running` list | 200ms | `--ease` | CSS transition, not keyframes — rows arrive unpredictably and a second arrival mid-animation must retarget smoothly, not restart. `opacity 0→1`, `translateY(8px)→0`. Stagger 40ms if 2+ rows land within ~100ms |
| Screen-to-screen | 200–300ms | `--ease` | Fade/slide |

General rules carried over regardless of element:
- Anything that enters starts from `opacity: 0` + a visible starting shape (e.g. `scale(0.95)`, never `scale(0)` or a hard cut) — nothing in the real world appears from nothing.
- Hover states on interactive elements only (never hover-only affordances — brand's own accessibility rule), and gated behind `@media (hover: hover) and (pointer: fine)` so touch taps don't trigger false hover states.
- Status chips are **not interactive** — no hover state on them at all. Don't animate what isn't clickable.
- One-time count-up on the `/results` match count (the brand's documented micro-interaction, used exactly once, matching "one hero motion per view" even in the utility-first mode).
- **One deliberate exception:** the `/dashboard` DONE-state transition (§3.5) is the product's single rare, user-initiated "honored" payoff moment — it earns a touch more than the bare micro-interaction tier (node atom scales in `0.9→1` + opacity, 220ms, fill settling just after). Everywhere else, restraint wins.

No `prefers-reduced-motion` fallback work is needed beyond this tier — there's nothing large enough to need a fallback. State it in the implementation spec as "N/A — no motion large enough to warrant a static substitute" rather than silently dropping the brand's reduced-motion discipline.

---

## 3. Screens

Six screens, same routes and step order as PRD §10. Each section below states layout, components, states, and copy direction. Full component definitions are in §4.

### 3.0 Flow-wide behavior

Applies to every screen from `/scan` through `/dashboard` (landing and report are endpoints, not flow steps):

- **Step indicator:** plain text, mono-caption, Slate — *"Step 2 of 4"* (`/scan` → `/scan/running` → `/results` → `/dashboard`; landing isn't a step, report is the destination, not counted either) — placed consistently near the wordmark on every in-flow screen. No node-dot progress marker: stays consistent with the utility-first call already made for this product — this is a functional readout, not a branded moment.
- **Back-navigation:** every in-flow screen has a way back to the previous one. Because SessionState (PRD §13) already holds everything in memory for the session, going back never discards data — a user who returns to `/scan` from `/results` to fix a mistyped city sees their form pre-filled, not blank. Going back from `/scan/running` cancels the in-flight scan cleanly (no orphaned requests, nothing to clean up server-side since the scan function is stateless per PRD §18).
- **Mobile/responsive:** single-column layout at all widths — this design has no multi-column screens to collapse, so "responsive" here means specific behaviors, not a breakpoint overhaul:
  - Sticky footers (`/results`, `/dashboard`) are deliberately thumb-zone placement, not an accident of the desktop layout — primary action stays reachable one-handed on a phone.
  - Field groups on `/scan` (§3.2) stack in the same grouped order on mobile; no group ever splits across a scroll boundary mid-group.
  - The "+ add" alias pattern (§3.2) needs a mobile-specific answer: added alias fields append below the trigger and auto-scroll into view on add, since a fiddly one-handed reach to a field that appeared off-screen is a common mobile form failure.
  - Status chips and confidence badges keep their text label at every width (never collapse to color/icon-only) — this is also the accessibility answer for color-blind users, stated here as intentional rather than assumed.

### 3.1 `/` — Landing

**Layout:** Signal Black background, centered column, max-width matching brand's `--maxw-text` (46rem) for the promise line. No hero art.

**Content:**
- Wordmark (VANISH, fading node) top-left, small.
- H1 (Space Grotesk, Daylight): one-line promise. Draft: *"See what the internet knows about you. Then take it down."*
- Subhead (Inter, Slate): one sentence on how (self-search + prefilled removal requests, ~15 min, nothing stored).
- Primary CTA: "Find my data" — Button/Primary (Mint fill, Signal Black text).
- 3-step strip: node atom as step marker (static, not animated) + short label per step ("Search," "Confirm," "Send"). Inter, Slate labels, Daylight step titles.
- Trust row (PRD §11.1 copy, kept close to verbatim — it's already precise and voice-appropriate): *"We only search for you, with your consent. We never sell data. Delete your Vanish data anytime."* Mono-caption style, Slate.

**States:** none — static page.

### 3.2 `/scan` — Intake

**Layout:** Single Deck-surface card (border: 1px Grid, radius consistent with brand card treatment) centered on Signal Black. Vertical form.

**Fields, grouped** (per PRD §11.2 field list, order preserved within groups; grouping added — 8 ungrouped fields exceeds the ≤4-per-group cognitive-load guideline):

1. **About you** — full name*, aliases/maiden names (repeatable, optional), age range* (dropdown).
2. **Where you live** — city* + state*, prior cities (optional).
3. **How to reach you** — email*, phone (optional).
4. **Consent** — its own block, see below (unchanged from original spec — already correctly separated).

Each group gets a small Slate label (mono-caption) and a visual break (spacing, not a border — avoid nested-card syndrome inside a form that's already a card). Groups stack in this order on every screen width (§3.0).

**Component notes:**
- Required-field marker: the node atom (small, Mint), replacing a bare asterisk — ties form semantics to the brand mark instead of a generic symbol. Required state is also programmatic (`aria-required="true"`), not visual-only.
- Field help text: **inline caption** (not a tooltip) — Slate, Inter, small, always visible beneath the field, explaining *why* it matters (PRD's own requirement, e.g. age range disambiguates namesakes). Written plainly, no jargon. Resolved away from a tooltip deliberately: this form is read once, top-to-bottom, not scanned repeatedly — a hover-delay interaction adds friction for zero benefit, and an always-visible caption is more reassuring for a user who's anxious and doesn't want to have to discover help text exists.
- Consent block: **visually separated**, not an inline checkbox row. Its own bordered sub-panel (Grid border) inside the form card, checkbox + the PRD's exact required legal text: *"I authorize Vanish to submit opt-out and deletion requests for my own personal information on my behalf."* This gets weight because it's the legal/trust hinge of the whole product, not a formality to breeze past.
- Primary CTA: "Start scan" — disabled (Grid, no fill) until all required fields + consent are satisfied; becomes Mint-filled once valid.

**States:** default, focus (Mint ring — brand's existing `--ring: 2px solid var(--mint)`, transition per §2), disabled submit, enabled submit.

**Validation error (scripted, not just named):** inline, beneath the field, same position as help text (replaces it while the error is showing) — plain and specific, matching the voice guide, never a generic "Invalid input":
- Empty required field: *"We need this to search for you."*
- Malformed email: *"Doesn't look like a full email address — check for typos."*
- No state selected with a city entered: *"Which state? Brokers index by state, so this narrows the search."*

Error tone uses the neutral warning color from §4.2 (not amber, not mint), and the field keeps its Grid border shape — only the border color and the caption swap, so the field doesn't jump in size when an error appears (avoid layout shift).

### 3.3 `/scan/running`

**Layout:** Signal Black background, progress bar + live counter top, streaming list of per-broker rows below.

**Content:**
- Progress bar: Mint fill on Grid track, `ease-out` on each fill update rather than a hard jump between values. Real broker-search timing is uneven; an eased (not instant) fill reads as "still working" instead of "stalled" — same principle as a fast-spinning spinner improving perceived speed at identical real speed. Label above: *"Searched 22 of 54 sites… 7 matches so far."* (PRD copy, kept — it's already the right tone: plain, specific, no hype.)
- Per-broker row: broker name (Inter, Daylight) + status chip (right-aligned). Rows stream in as results arrive (entrance spec: §2 table — CSS transition, not keyframes, staggered if simultaneous) and never reorder once placed (avoids motion-sickness / disorientation for a user already anxious).
- Never blocks on one slow broker — PRD's own requirement; a stalled row resolves to "error, skipped" after its own timeout and the scan continues. This is a UX guarantee, not just a technical one: the user should never wonder if the whole scan has frozen.

**Status chip states** (see §4.3 for full spec): searching (neutral/Slate, pulsing dot), match (Mint), no match (Grid, muted), error (Amber outline — **not filled**, see §3.4 rationale).

### 3.4 `/results`

**Layout:** Signal Black background, scrollable list of match cards grouped by broker, sticky footer.

**Content per match card** (Deck surface): broker name, **confidence badge** (mono chip: HIGH / MED / LOW), the identifying fields that matched (e.g. "name, city, age" — Slate, small), a "view listing" link (Mint, opens the live broker page in a new tab so the user can verify it's really them), and a checkbox.

**Selection defaults:** high-confidence pre-checked, medium and low unchecked — PRD's own rule, kept exactly, because it's a correctness/safety requirement (don't let the user accidentally request removal of a namesake's data) not just a UX preference.

**Sticky footer:** selected count (Mono) + "Remove selected" button. Disabled (Grid) until ≥1 selected; Mint once active.

**Why amber is *not* used for the error chip here or in §3.3:** the brand's own discipline is "amber = the honored/receipt moment, rationed." An error/no-match state is neither. Using amber for errors would dilute the one signal amber is supposed to carry cleanly by the time the user reaches `/dashboard`. Errors get a distinct outline treatment in a non-brand-accent color (Grid-bordered, Slate text) so amber's meaning stays intact end to end.

**Empty state (zero matches):** not an edge case to leave unhandled — for this product, "we found nothing" is a *good* outcome and the most common thing to accidentally ship looking like a failure. Treatment: node atom in a calm, neutral (Slate) rendering, no error/warning styling of any kind, headline *"Good news — we didn't find you on any of the 54 sites we checked."* No CTA needed beyond a way back to `/report` (a clean scan is still worth a record) or re-running with additional aliases.

### 3.5 `/dashboard`

**Layout:** Signal Black background, header summary + list of confirmed-match rows.

**Header:** *"X ready · Y sent · Z done"* (Mono, matches the brand's receipt/ledger texture) + the persistent reminder that nothing is stored server-side (Slate, small, always visible — this is the product's core promise and should never require a click to see).

**Row content:** broker name, status chip (READY / SENT / DONE), and the row's one-click action (open prefilled email, open prefilled opt-out link, or — once DONE — nothing further). Email-method rows always show a secondary "Copy instead" text action next to "Open email" — not hidden behind a failure state. A user whose mail client doesn't open (unconfigured default app, webmail-only setup) needs a visible way out *before* they get stuck, not a recovery path they have to go looking for.

**Status chip states:**
- READY — Slate outline, neutral (nothing has happened yet).
- SENT — Mint fill (in motion, user acted, not yet closed).
- DONE — **Amber fill + node atom**, the one place in the product where amber renders solid. This is deliberate: DONE is the actual "honored" moment the brand's whole color rationale describes, so it's the single correct place to spend that accent. It's also the one spot in the product that earns motion beyond the bare micro-interaction tier (see §2) — rare, user-initiated, and the actual payoff of the whole flow.

Chip-to-chip transitions (READY→SENT, SENT→DONE) use the blur-mask crossfade specified in §2, since each is an outline→fill shape change, not just a color change.

**Footer:** "Download report" (Mint, primary — since the report is the durable record, it's a primary action, not an afterthought) + "Clear everything" (secondary/outline — not styled alarmingly, this is a *feature*, not an error state, per the product's zero-retention promise, but it is irreversible and can discard unfinished work, so it gets a confirmation).

**"Clear everything" confirmation:** inline, not a modal — pressing it swaps the button in place for *"This clears everything, including requests you haven't sent yet. Clear it?"* with Confirm / Cancel, rather than interrupting with a dialog. An inline swap keeps the user in context and is enough friction to prevent an accidental tap without the weight of a modal for something that's still just resetting a browser tab, not a server-side deletion.

### 3.6 `/report`

**Layout:** Renders on **Evidence Paper** (`--paper` background, `--ink` text) — the brand's existing light "ledger" surface, used exactly as documented: proof/record content goes light, everything else stays dark. This is the one screen that gets deliberate art-direction effort, since it's what the user actually keeps after the tab closes.

**Content:** identity summary, every broker searched (found and not-found, for completeness/audit value), method used per request, and the exact bodySnapshot of what was sent. IBM Plex Mono for the ledger rows (receipt fragments, per brand motif "The Ledger"). Mint accents on this screen use `--mint-ink` (contrast-safe on light), not raw `--mint`.

**Generation:** entirely client-side (implementation spec covers the library choice). Framed in-page as *"This is the only record that survives closing this tab. Download it."*

---

## 4. Component system

Defined once, reused across all six screens. No screen invents its own variant.

### 4.1 Button
- **Primary:** Mint fill, Signal Black text, radius/weight matching brand button treatment.
- **Secondary/outline:** Grid border, Daylight text, transparent fill.
- **Disabled:** Grid fill, Slate text, no interaction.
- **Press feedback (all variants):** `transform: scale(0.97)` on `:active`, `transition: transform 160ms ease-out`. Every pressable element in the product gets this — it's what makes the UI feel like it's listening, not just displaying.

### 4.2 Form field
- Label (Inter, Daylight, small-caps or standard per brand's existing label treatment) + input (Deck surface, Grid border, Daylight text) + optional Slate help text below.
- Focus: Mint ring (`--ring`), `transition: box-shadow 120ms ease-out` — instant appearance reads as a glitch, 120ms reads as responsive.
- Error: Grid border → error-red-adjacent... **not** amber, **not** mint. Use a neutral warning tone (desaturated, not a new brand hue — implementation spec should confirm exact value; this spec's constraint is *no new chromatic accent*, so the error tone must be achievable via existing tokens or a single approved desaturated addition, decided at build time with the brand's "never introduce a third hue" rule as the hard constraint).

### 4.3 Status chip (5 states)
Not interactive — no hover state, no press feedback. Don't animate what isn't clickable.

| State | Color | Fill |
|---|---|---|
| Searching | Slate | outline, pulsing dot |
| Match / live | Mint | outline |
| No match | Grid | muted, no border emphasis |
| Error | Grid-bordered, Slate text | outline (not amber — see §3.4) |
| Done / honored | Amber | **solid fill**, only state that gets a solid brand accent |

Transitions between states use the blur-mask crossfade + durations specified in §2, not a plain color transition — see §3.5 for where this matters most (READY→SENT→DONE).

### 4.4 Confidence badge
Mono chip, three levels: HIGH (Mint outline), MED (Slate outline), LOW (Grid outline, muted). Text always uppercase, tracked, matching the brand's mono-caption spec (`+0.08em`).

### 4.5 Card
Deck surface (`--deck`), 1px Grid border, consistent radius across intake form, results match cards, dashboard rows.

### 4.6 Node bullet
The node atom used as: form's required-field marker, landing page's step marker, dashboard's DONE-state icon. One primitive, three contexts — matches the brand's own "recurs as list bullets, section markers, receipt terminal" usage pattern.

---

## 5. Accessibility

Inherited as a floor, not re-derived: WCAG AA contrast (the brand's tokens are already verified AA-safe per `04-accessibility.md` — Slate on Signal Black is ~8.6:1), full keyboard navigation, labeled inputs, 44px minimum touch targets, no hover-only affordances. PRD's own accessibility requirement (mailto + copy-to-clipboard fallback) is treated as an accessibility feature, not just a webmail convenience — some users can't complete a mailto flow at all depending on their device/browser config.

No motion-heavy interactions exist in this design, so there's no reduced-motion fallback surface to build — a simplification versus the brand site, stated explicitly so it isn't mistaken for an oversight.

---

## 6. Explicitly deferred to the implementation spec

Not decided here, by design — these are architecture/build decisions, not visual/UX ones:
- Exact component library / CSS approach (CSS Modules vs. vanilla CSS custom properties vs. a utility layer) in the Next.js app.
- PDF generation library choice for `/report`.
- Broker registry seed set and schema specifics.
- Error-tone exact hex value (constrained above to "no new chromatic accent," final value chosen at build time).

---

*End of design spec.*
