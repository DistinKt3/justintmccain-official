# Vanish — Implementation Spec

**Date:** 2026-08-06
**Status:** Draft, pending user review
**Source:** `Vanish_PRD.docx` §13–22, §27 (formalized with brainstorming decisions below)
**Companion doc:** `2026-08-06-vanish-design-spec.md` (visual/UX — read that first; this doc covers architecture, data, and build sequence only)

This spec resolves the items the design spec explicitly deferred (§6 of that doc) and formalizes the PRD's technical sections against the decisions made during brainstorming: separate Next.js app, no framework fork of the SIGNAL tokens, zero-database/zero-log architecture unchanged from PRD.

---

## 1. Repo & deployment

- **Repo:** new, separate from `career-planning-tools` — `vanish` (this directory). Own git history, own deploy pipeline. Linked from the brand site as a project entry, not embedded in its codebase (confirmed during brainstorming).
- **Framework:** Next.js (App Router), React, TypeScript. Matches PRD §21's suggested approach — no deviation; the PRD's reasoning (fast, good discovery SEO, holds all session state in React) still holds and nothing in brainstorming changed it.
- **Hosting:** Vercel (or equivalent that scales to zero) — PRD §21, §25. Serves the static app plus the single serverless function.
- **Styling:** **CSS Modules**, not Tailwind. The SIGNAL system itself is plain CSS custom properties (`career-planning-tools/site/css/main.css`), not a utility-class system — CSS Modules keeps Vanish's styling approach consistent with the source of truth it's importing tokens from, rather than translating a token system into a different paradigm. One `tokens.css` file holds the design-spec §1.2 custom properties (kept in sync with the brand site's `main.css` manually — there's no shared package between the two repos at this scale, so a comment in both files should point at the other).
- **State management:** React Context + `useReducer` wrapping the `SessionState` object (PRD §13). No external state library (Redux, Zustand) — the action set is small and well-defined (set identity, add matches, toggle selection, generate request, mark dispatched, mark done, clear), and PRD's own data model already assumes plain React state. Adding a library would be scope the solo-dev timeline doesn't need.
- **PDF generation:** `pdf-lib`, per PRD §25's own suggestion — confirmed, no reason to deviate. Pure client-side, no server dependency, fine bundle size for a single receipt-style document.

---

## 2. Data model

Directly from PRD §13, typed:

```ts
interface SessionState {
  consentText: string;
  consentAt: string; // ISO timestamp
  status: 'intake' | 'scanning' | 'review' | 'acting' | 'done';
  identity: Identity;
  matches: Match[];
}

interface Identity {
  fullName: string;
  aliases: string[];
  city: string;
  state: string;
  ageRange: string;
  email: string;
  phone?: string;
  priorCities: string[];
}

interface Broker {
  // static registry record — see §3
  id: string;
  name: string;
  category: 'people-search';
  optOutMethod: 'email' | 'link';
  // ...full shape in §3
}

interface Match {
  id: string;
  brokerId: string;
  confidence: 'high' | 'medium' | 'low';
  listingUrl: string;
  matchedFields: string[];
  selected: boolean;
  request?: GeneratedRequest;
}

interface GeneratedRequest {
  method: 'email' | 'link';
  mailtoUrl?: string;
  prefilledUrl?: string;
  bodySnapshot: string;
  dispatched: boolean;
  status: 'FOUND' | 'READY' | 'DISPATCHED' | 'DONE';
}
```

Lives in a `SessionProvider` at the app root, never persisted (no `localStorage`, no cookies, no server round-trip except the one stateless scan call). "Clear everything" (design spec §3.5) dispatches a reset action back to initial state.

---

## 3. Broker registry

Static, version-controlled JSON — PRD §16. Schema (per-record):

```json
{
  "id": "spokeo",
  "name": "Spokeo",
  "category": "people-search",
  "searchUrl": "https://www.spokeo.com/{name}/{state}",
  "matchStrategy": "html-parse",
  "optOutMethod": "email",
  "optOutUrl": "https://www.spokeo.com/optout",
  "emailTo": "privacy@spokeo.com",
  "requiredFields": ["name", "listingUrl", "email"],
  "manualStep": "confirmation-email",
  "legalBasis": "CCPA",
  "rateLimitMs": 1500,
  "enabled": true
}
```

**Seed set for Phase 1–2 (5 brokers, per PRD §27's own phase target):** target the five people-search sites PRD's own wireframes already reference by name — Spokeo, BeenVerified, Whitepages, Radaris, TruePeopleSearch. These are chosen because they're the highest-signal, most commonly cited sites in this category, not because their exact opt-out mechanics are already verified here.

**Important — do not build from unverified contact details.** I have not confirmed current `emailTo` addresses, `optOutUrl` paths, or `matchStrategy` specifics for any broker against their live privacy pages as of this spec's date; broker flows change (PRD §24 names this as a standing risk). Verifying each seed broker's actual current opt-out flow is a **Phase 1 task**, not a design/implementation-spec decision — treat every registry record above as a schema example, not verified data, until someone checks the broker's live page.

**Expansion to 40–60 brokers** (PRD §4.1, §27 Phase 5) is a data-research task, additive to the registry with no code changes required — the opt-out engine (PRD §17) already dispatches purely on `optOutMethod`.

---

## 4. API contract

One stateless endpoint, unchanged from PRD §18:

```
POST /api/scan
body:    { identity: Identity }        // body only, never in URL/query
returns: { matches: Match[] }          // one response, nothing retained
```

**Zero-log discipline for this function specifically** (PRD §26 formalized into build rules):
- No request-body logging, no echoed-input logging, no error-payload logging that could contain identity fields.
- Whatever logging/observability tool is chosen for the Vercel function must be configured to exclude body content — verify this explicitly at deploy time, don't assume a default logging integration is safe.
- No analytics or error-monitoring SDK with PII capture (Sentry, LogRocket, etc. in default config) anywhere near this function. If error visibility is wanted, log only the broker ID and error type, never the request body.

Every other piece of interactivity (request generation, dashboard, PDF report, clear-everything) is pure client-side — no additional endpoints. PRD §18 is explicit that there is no `/session`, `/requests`, `/retry`, `/mark-done`, or `DELETE` purge route, because there is no server state to manage. Unchanged here.

---

## 5. Routing & flow-wide mechanics

Matches design spec §3.0/§10:

| Route | Screen |
|---|---|
| `/` | Landing |
| `/scan` | Intake |
| `/scan/running` | Live scan |
| `/results` | Match confirmation |
| `/dashboard` | Request status |
| `/report` | PDF export |

**Back-navigation** (design spec §3.0): standard Next.js client routing, no special guard needed — `SessionState` lives in Context above the router, so navigating back to `/scan` re-renders the form from existing state rather than losing it. Leaving `/scan/running` mid-scan should abort the in-flight fetch (`AbortController`) so a stale response can't land after the user has already navigated away.

**Step indicator** (design spec §3.0): a simple derived value from the current route (`/scan` = 1, `/scan/running` = 2, `/results` = 3, `/dashboard` = 4), not stored state.

---

## 6. Error tone (resolves design spec §4.2's deferred item)

Design spec constrains this to "no new chromatic accent, achievable via existing tokens or one approved desaturated addition." Proposed value: a low-chroma, muted warm tone — **`#8B4A42`** (muted brick/rust) — sits tonally near the brand's warm end (adjacent to Amber's warmth) but desaturated enough to read as "attention needed" rather than competing with Amber's rationed "honored" meaning or introducing a loud new hue. Needs an actual AA-contrast check against Signal Black at build time before it's final — this is a proposal, not a verified value.

---

## 7. Accessibility & responsive — build acceptance criteria

Translating design spec §3.0/§5 into checkable build criteria:
- Keyboard-only completion of the full `/scan` → `/dashboard` flow.
- `aria-required` on all required fields; error messages associated via `aria-describedby`.
- 44px minimum touch target on every interactive element, verified at 375px viewport width.
- No color-only state communication — status chips and confidence badges always carry a text label (design spec §3.0).
- Lighthouse accessibility ≥ 95.

---

## 8. Build sequence

Matches PRD §27's phased plan, updated only where brainstorming decisions changed the underlying assumptions (they didn't change the sequence, only confirm it):

| Phase | Weeks | Deliverable | Exit criteria |
|---|---|---|---|
| 0 · Foundation | Wk 1 | Next.js scaffold, routes from §5, `SessionState` Context, `tokens.css` ported from brand site, deploy pipeline. No DB, no auth. | App deploys; screens route; state model in place. |
| 1 · Intake + registry | Wk 1–2 | Intake form (grouped fields, design spec §3.2) + consent in session state; broker registry loader; **5 seed brokers verified against live opt-out pages** (§3 above — this is new, explicit work this phase, not assumed data). | Identity + consent captured in the browser; registry data is real, not placeholder. |
| 2 · Scan + results | Wk 2–3 | Stateless `/api/scan` (html-parse) over seed brokers; confidence scoring; results screen with confirm + empty state (design spec §3.4). | User sees real matches and selects them. |
| 3 · Request generator + dashboard | Wk 3–4 | mailto + prefilled-link generation; dashboard with status chips, copy-to-clipboard fallback, clear-everything confirmation (design spec §3.5). | End-to-end: scan → confirm → prefilled request the user sends. |
| 4 · Report + polish | Wk 4–5 | Client-side PDF report (`pdf-lib`) on Evidence Paper; educational copy; accessibility pass against §7 criteria above. | Report downloads; flow is smooth and accessible. |
| 5 · Scale registry + launch | Wk 5–6 | Grow registry to 40–60 brokers (data work, no code change); hardening; launch, linked from brand site. | Public MVP live. |

---

*End of implementation spec.*
