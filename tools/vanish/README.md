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
   error monitoring anywhere near it. Read the header comment in that file before
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
    api/scan/route.ts     the ONLY server function; read its header
  components/ui.tsx       shared component system (design spec §4)
  lib/
    types.ts              data model (PRD §13)
    session.tsx           in-memory state, the zero-persistence core
    brokers.ts            registry loader
    requests.ts           removal-request generator
    report.ts             client-side PDF (jsPDF)
    validation.ts         form validation, messages in product voice
  data/brokers.json       the broker registry; see docs/BROKER-VERIFICATION.md
  styles/tokens.css       SIGNAL tokens, mirrored from the brand site
```

## Brokers

`src/data/brokers.json` is the whole registry. Adding coverage is a data change,
not a code change.

**23 brokers ship enabled**, ordered by value to the user: sites where you can
actually see your own record for free come first, because that's where the "oh,
there I am" moment happens. Paywalled sites come later. Your data is still there
and the opt-out still works, you just may not get to read the record first. The
`freeToView` flag drives that badge in the UI.

Most opt-out routes come from the California Privacy Protection Agency's Data
Broker Registry, the annual filing the Delete Act (SB 362) requires, published as
machine-readable CSV:

> https://cppa.ca.gov/data_broker_registry/complete-reg-data-brokers.csv

A legal declaration beats a marketing page: it can't be quietly reworded, and it's
reachable without fighting anyone's bot detection (nearly every broker here returns
HTTP 403 to automated requests). It also corrected two records originally taken
from broker pages. See `docs/BROKER-WORKSHEET.md`.

Coverage is wider than 23 sites: BeenVerified's opt-out also covers PeopleLooker,
NeighborWho and NumberGuru; Intelius also covers US Search.

### The verification rule, and how it's scoped

Every record carries a `source`:

- **`ca-registry`**: taken from the broker's state filing. Authoritative.
- **`published`**: the broker's documented opt-out page, used for sites absent
  from California's registry that are too exposing to leave out (several of the
  biggest *free* people-search sites are in this group).

**`optOutMethod: "email"` requires `ca-registry`.** A wrong email fails
*silently*: the request goes nowhere and the user believes they're done. That's the failure
this project exists to prevent, so it gets the strict bar.

**`optOutMethod: "link"` may use `published`.** A wrong URL fails *visibly*. The
user sees a 404 and the note tells them to use the site's footer link instead.
Visible failure is recoverable; silent failure isn't.

Read `docs/BROKER-VERIFICATION.md` before touching the registry.

## The public broker directory

`/brokers` publishes all 549 registered brokers with the opt-out route each filed,
filterable and searchable. `/about` states plainly what the tool does and doesn't
do, with every number computed live from the registry so it can't drift.

The framing matters and is deliberate. California's DROP service, which submits
deletion requests to every registered broker automatically, is genuinely for
California residents only. **That automation doesn't travel. The list does.** The
addresses those brokers filed are just addresses, and a "do not sell my info" form
generally accepts a request from anyone. Publishing the dataset is useful to
everyone; claiming to replicate DROP would not be true.

Regenerate it with `node scripts/build-registry.mjs` when brokers re-register
(annually). That script does two things a plain CSV conversion doesn't: it *scores*
candidate URLs, because 56 filings list several and the first is often a privacy
policy rather than the opt-out form, and it *checks every link*, because the
filings themselves rot. 54 of the 337 filed opt-out URLs are dead, and those rows
warn the user instead of sending them to a 404. ~105KB raw, 27KB gzipped.

### Assisted checks, and what the "scan" really is

Most of this industry blocks automated requests. Vanish does **not** try to get
around that (no header spoofing, no proxy rotation, no CAPTCHA solving, explicitly
out of scope per PRD §4.2). Brokers marked `scanStrategy: "assisted"` are handed to
the user as a search link they open themselves; they paste the listing URL back and
get the same removal request as any scanned match.

**Only one broker of the 23 is genuinely scannable: Spokeo.** That was measured,
not assumed. Every consumer people-search host in the 528-host registry was probed
and differential-tested. 84% of registry hosts are reachable, but almost all are
B2B/adtech brokers with no consumer lookup to scan; the people-search segment blocks
hardest because scraped listings are their product.

So Vanish v1 is honestly a **guided self-search** with one automatable site, not a
scanner with a manual fallback. The full data and methodology are in
`docs/SCAN-VIABILITY.md`. Read it before adding any broker as `html-parse`.

One rule from that work is load-bearing: **never let an unreadable response become a
"no match."** A 200 carrying a JavaScript shell renders no text, finds no name, and
would otherwise report "you're not listed" about a page that never loaded. That
exact false negative shipped briefly and is now guarded by `MIN_RENDERED_TEXT` in
the scan route.

## Deploying

Any host that runs Next.js 16 and scales to zero. Vercel is the assumed target.

```bash
npm run build      # verify locally first
npx vercel         # first run links the project and prompts for login
npx vercel --prod
```

**Before the first production deploy, confirm two things:**

1. **Logging excludes request bodies.** Whatever observability the host enables by
   default must not capture the body of `POST /api/scan`. Verify this explicitly
   and do not assume a default integration is safe. This is the one place the zero-log
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

`npm outdated` will flag both. That's expected; revisit when the plugin ecosystem
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
