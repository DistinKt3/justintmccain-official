# Vanish

**Find yourself online. Then disappear.**

A free, zero-retention tool that helps someone find their personal data on U.S.
people-search brokers and hands them ready-to-send removal requests. A SIGNAL
project.

Built from `Vanish_PRD.docx` (v1.3) and the two specs in `docs/superpowers/specs/`.

---

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:3000.

Requires Node ≥ 20.9 (Next.js 16).

## The three hard rules

These are the product, not implementation details. Breaking any of them breaks the
only thing Vanish claims.

1. **No database.** All run state lives in browser memory (`src/lib/session.tsx`)
   for the life of the tab. No `localStorage`, no `sessionStorage`, no cookies, no
   IndexedDB. Closing the tab *is* the purge.
2. **No identity logging.** The single server function (`src/app/api/scan/route.ts`)
   logs nothing identity-bearing. Identity travels in POST bodies only, never a URL,
   so it can't land in hosting or CDN access logs. No PII-capturing analytics or
   error monitoring anywhere near it — read the header comment in that file before
   editing it.
3. **No send provider.** Vanish never transmits a removal request. It generates
   prefilled requests the user dispatches from their own email client or browser.
   No ESP means no third party holds a record of who asked whom for removal.

The honest consequence, stated in the PRD and worth repeating: Vanish v1 is a
*prefilled, user-dispatched removal launcher*, not an auto-submitter. It can't track
a broker's later confirmation, because that needs persistence and inbox access it
deliberately forgoes. That's the v1.1 line.

## Layout

```
src/
  app/
    page.tsx              /            landing
    scan/                 /scan        intake form
    scan/running/         /scan/running live scan
    results/              /results     match confirmation + assisted checks
    dashboard/            /dashboard   request status
    report/               /report      Evidence Paper record + PDF
    api/scan/route.ts     the ONLY server function — read its header
  components/ui.tsx       shared component system (design spec §4)
  lib/
    types.ts              data model (PRD §13)
    session.tsx           in-memory state, the zero-persistence core
    brokers.ts            registry loader
    requests.ts           removal-request generator
    report.ts             client-side PDF (jsPDF)
    validation.ts         form validation, messages in product voice
  data/brokers.json       the broker registry — see docs/BROKER-VERIFICATION.md
  styles/tokens.css       SIGNAL tokens, mirrored from the brand site
```

## Brokers

`src/data/brokers.json` is the whole registry. Adding coverage is a data change,
not a code change.

**Two of five seed brokers ship enabled.** Spokeo and BeenVerified were verified
against their live pages. Whitepages, Radaris and TruePeopleSearch return HTTP 403
to automated requests, so their opt-out details could not be confirmed and they
ship `enabled: false` rather than shipping a guess.

Read `docs/BROKER-VERIFICATION.md` before touching the registry. The short version:
never enable a broker whose opt-out address you haven't read off their own page — a
wrong address means the user's request silently goes nowhere while they believe
they're done.

### Assisted checks

Most of this industry blocks automated requests. Vanish does **not** try to get
around that (no header spoofing, no proxy rotation, no CAPTCHA solving — explicitly
out of scope per PRD §4.2). Brokers marked `scanStrategy: "assisted"` are handed to
the user as a search link they open themselves; they paste the listing URL back and
get the same removal request as any scanned match.

## Deploying

Any host that runs Next.js 16 and scales to zero. Vercel is the assumed target.

```bash
npm run build      # verify locally first
npx vercel         # first run links the project and prompts for login
npx vercel --prod
```

**Before the first production deploy, confirm two things:**

1. **Logging excludes request bodies.** Whatever observability the host enables by
   default must not capture the body of `POST /api/scan`. Verify this explicitly —
   do not assume a default integration is safe. This is the one place the zero-log
   promise can be broken by configuration rather than by code.
2. **No analytics or error-monitoring SDK is enabled** on the deployment. Vercel
   Analytics, Sentry, and similar default to capturing more than you want on a
   route that receives names and addresses.

There are no environment variables and no secrets. Nothing to configure.

## Toolchain notes

Dependencies are pinned to exact versions (no `^`/`~`). Two are deliberately *not*
the newest published release, because the newest doesn't work:

| Package | Pinned | Latest | Why |
|---|---|---|---|
| `typescript` | 6.0.3 | 7.0.2 | `typescript-eslint` supports `<6.1.0`. TS 7 makes linting fail outright. |
| `eslint` | 9.39.5 | 10.8.0 | `eslint-plugin-react` (bundled by `eslint-config-next`) uses an API ESLint 10 removed. |

`npm outdated` will flag both. That's expected — revisit when the plugin ecosystem
catches up.

`pdf-lib` (named in the implementation spec) was replaced with `jsPDF`: pdf-lib's
last release was Nov 2021, which is too stale for a privacy build, and jsPDF carries
three direct dependencies against `@react-pdf/renderer`'s dozen.

## Checks

```bash
npm run build
npx eslint .
npm audit --audit-level=high
```

All three pass clean as of the last commit.
