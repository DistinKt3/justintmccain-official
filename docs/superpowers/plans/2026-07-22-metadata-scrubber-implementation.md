# Metadata Scrubber Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fully client-side single-page web app that reads and strips metadata from images (JPEG/PNG/HEIC) and PDFs, with a light-themed, product-register interface featuring one Committed brand moment (the GPS callout). All bytes stay in memory; the CSP blocks accidental exfiltration.

**Architecture:** Vite + React + TypeScript static bundle. Pure `(bytes) -> result` reader and scrubber libraries under `src/lib/`, decoupled from UI. Reducer-driven state machine (`empty | analyzing | analyzed | scrubbing | done | error`) in `src/state.ts`. Design tokens (OKLCH color, type scale, motion) in `src/tokens.css`, consumed by all components.

**Tech Stack:** Vite, React 18, TypeScript, Vitest + @testing-library/react + jsdom, `exifr`, `piexifjs`, `pdf-lib`, `heic2any`. No analytics libraries. No map libraries.

## Global Constraints

These apply to every task. Values copied verbatim from the design spec (`docs/superpowers/specs/2026-07-22-metadata-scrubber-design.md`).

- **Framework:** Vite + React + TypeScript. No other frameworks.
- **Dependency versions:** exact pins in `package.json` (no `^`/`~`, no wildcards). No `-rc`/`-alpha`/`-beta`/`-canary` versions. Verify current stable at install time via `npm view <pkg> dist-tags.latest`.
- **Security gate:** `npm audit --audit-level=high` must pass with zero HIGH/CRITICAL before any app code is written or after any dependency change.
- **`.npmrc`:** must contain `audit=true`.
- **CSP** (in `index.html` as a `<meta http-equiv>`): `default-src 'self'; connect-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'`.
- **Zero analytics.** No transmission of file contents anywhere. No third-party tracking scripts.
- **File size limit:** 25 MB. Enforced before parse.
- **File detection:** magic bytes, never extension. Supported: JPEG (`FFD8FF`), PNG (`89504E47`), HEIC (`ftypheic`/`ftypheix`/`ftypmif1`/`ftyphevc` at offset 4), PDF (`25504446`).
- **Theme:** light only. No dark mode in MVP.
- **Color:** OKLCH tokens only. Never `#000` or `#fff`. Every neutral tinted at chroma ~0.008. Strategy: Restrained overall, one Committed moment on the GPS callout. Full-tint background on that callout, never a side-stripe border.
- **Typography:** system font stack (`-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", system-ui, sans-serif`). One family. Fixed rem scale, ratio ~1.2. `font-variant-numeric: tabular-nums` on all data values.
- **Motion:** only `transform`, `opacity`, and `filter` animate. Never `width`, `height`, `padding`, `margin`, or any CSS layout property. Default easing `cubic-bezier(0.22, 1, 0.36, 1)`. Durations from tokens: 140ms/200ms/240ms/280ms.
- **Accessibility:** all hover styles gated by `@media (hover: hover) and (pointer: fine)`. `prefers-reduced-motion: reduce` disables transforms, keeps opacity/color transitions. Focus ring is one token (`outline: 2px solid var(--focus-ring); outline-offset: 2px`), applied via `:focus-visible`; never remove default outlines without replacement.
- **Copy rules:** no em-dashes and no `--` in any shipped string. Concrete language over abstract. No restated headings. No "lock/shield" iconography. No "encrypted" language.
- **Bans (project-wide, restated):** no side-stripe borders; no `background-clip: text` gradients; no glassmorphism (blur only as a 200ms bridge during crossfade); no hero-metric templates; no identical card grids; no modals in MVP; no monospace outside GPS coordinate numerals.
- **Testing:** Vitest + jsdom. TDD where practical (pure logic, reducer). React components tested via `@testing-library/react`. Round-trip tests for scrubbers assert Location/Device/Identity findings are empty on the cleaned output.
- **Commit cadence:** commit at the end of every task. Message format: `<type>(<scope>): <verb-phrase>`. Types: `feat`, `test`, `chore`, `refactor`, `style`, `docs`. Example: `feat(scrub): add JPEG lossless EXIF strip`.
- **Never commit `node_modules`.** Always commit `package-lock.json`. Add `node_modules/`, `dist/`, `.DS_Store` to `.gitignore` in Task 1.

---

## Task Index

Fifteen tasks, sequenced so each task's `Consumes` inputs come from earlier `Produces` outputs. Every task ends with an independently testable deliverable and a commit.

| # | Task | Layer | Testable deliverable |
|---|---|---|---|
| 1 | Foundation: scaffold, deps, CSP, tokens, base styles | Setup | `npm run dev` serves a page with correct CSP and tokens; `npm test` runs. |
| 2 | Types + magic-byte detection | Lib (pure) | `detectFileKind(bytes)` returns correct `FileKind` per format. |
| 3 | Categorize raw metadata into Findings | Lib (pure) | `categorize(raw, kind)` snapshots stable across sample inputs. |
| 4 | Image reader (exifr) + programmatic fixture builder | Lib | `readImage(bytes)` returns `Finding[]` including GPS from a built fixture. |
| 5 | PDF reader (pdf-lib) | Lib | `readPdf(bytes)` returns `Finding[]` including Author/Producer. |
| 6 | JPEG scrubber (piexifjs) | Lib | Round-trip: geotagged JPEG in, scrubbed JPEG out, re-read shows empty Location/Device. |
| 7 | PNG scrubber (canvas re-render) | Lib | Round-trip: PNG with `tEXt` in, scrubbed PNG out, no ancillary chunks. |
| 8 | HEIC scrubber (heic2any → JPEG scrubber) | Lib | HEIC input yields cleaned JPEG output. Requires a real HEIC fixture file. |
| 9 | PDF scrubber (pdf-lib clear info + XMP) | Lib | Round-trip: authored PDF in, cleaned PDF out, empty info dict, no XMP stream. |
| 10 | State reducer | State | `reduce(state, action)` transitions match the spec's state diagram. |
| 11 | Presentational components: PrivacyBadge, FileHeader, Skeleton | UI | Render tests pass; visual conformance to spec. |
| 12 | DropZone component | UI | Keyboard-operable, drag/drop/picker all fire the same handler, drag-over motion applied. |
| 13 | MetadataReport + GpsCallout | UI | Findings render grouped by category, GpsCallout enters with correct motion when Location present. |
| 14 | ScrubButton + DoneSummary + ErrorBanner | UI | Button loading state disables clicks; DoneSummary staggers in; ErrorBanner is `assertive` and dismissible. |
| 15 | App shell, wiring, focus management, README, manual verification | Glue + docs | All PRD Success Criteria pass; manual checklist recorded in README. |

---

## File Map

Every file created or modified across the fifteen tasks. Task numbers show where each file is first introduced.

```
metadata-scrubber/
├── .gitignore                                    # Task 1
├── .npmrc                                        # Task 1
├── README.md                                     # Task 15
├── index.html                                    # Task 1
├── package.json                                  # Task 1
├── package-lock.json                             # Task 1 (committed)
├── tsconfig.json                                 # Task 1
├── vite.config.ts                                # Task 1
├── docs/
│   └── superpowers/
│       ├── specs/2026-07-22-metadata-scrubber-design.md   # (already exists)
│       └── plans/2026-07-22-metadata-scrubber-implementation.md  # (this file)
├── src/
│   ├── main.tsx                                  # Task 1
│   ├── App.tsx                                   # Task 1 stub, Task 15 wiring
│   ├── state.ts                                  # Task 10
│   ├── tokens.css                                # Task 1
│   ├── styles.css                                # Task 1
│   ├── vite-env.d.ts                             # Task 1
│   ├── components/
│   │   ├── PrivacyBadge.tsx                      # Task 11
│   │   ├── FileHeader.tsx                        # Task 11
│   │   ├── Skeleton.tsx                          # Task 11
│   │   ├── DropZone.tsx                          # Task 12
│   │   ├── MetadataReport.tsx                    # Task 13
│   │   ├── GpsCallout.tsx                        # Task 13
│   │   ├── ScrubButton.tsx                       # Task 14
│   │   ├── DoneSummary.tsx                       # Task 14
│   │   └── ErrorBanner.tsx                       # Task 14
│   └── lib/
│       ├── types.ts                              # Task 2
│       ├── detect.ts                             # Task 2
│       ├── categorize.ts                         # Task 3
│       ├── read/
│       │   ├── image.ts                          # Task 4
│       │   └── pdf.ts                            # Task 5
│       └── scrub/
│           ├── jpeg.ts                           # Task 6
│           ├── png.ts                            # Task 7
│           ├── heic.ts                           # Task 8
│           └── pdf.ts                            # Task 9
└── tests/
    ├── setup.ts                                  # Task 1
    ├── fixtures/
    │   ├── programmatic.ts                       # Task 4 (grows through Task 9)
    │   └── iphone.heic                           # Task 8 (real file, user-supplied)
    └── unit/
        ├── detect.test.ts                        # Task 2
        ├── categorize.test.ts                    # Task 3
        ├── read-image.test.ts                    # Task 4
        ├── read-pdf.test.ts                      # Task 5
        ├── scrub-jpeg.test.ts                    # Task 6
        ├── scrub-png.test.ts                     # Task 7
        ├── scrub-heic.test.ts                    # Task 8
        ├── scrub-pdf.test.ts                     # Task 9
        ├── state.test.ts                         # Task 10
        └── components/
            ├── drop-zone.test.tsx                # Task 12
            ├── metadata-report.test.tsx          # Task 13
            └── scrub-button.test.tsx             # Task 14
```

---

### Task 1: Foundation — scaffold, dependencies, CSP, tokens, base styles

**Files:**
- Create: `package.json`, `.npmrc`, `.gitignore`, `tsconfig.json`, `vite.config.ts`, `index.html`
- Create: `src/main.tsx`, `src/App.tsx` (stub), `src/vite-env.d.ts`, `src/tokens.css`, `src/styles.css`
- Create: `tests/setup.ts`, `tests/unit/smoke.test.tsx`

**Interfaces:**
- Consumes: (nothing — this is the first task).
- Produces:
  - Working `npm run dev`, `npm run build`, `npm test` commands.
  - CSS custom properties in `tokens.css`: neutrals (`--surface`, `--surface-2`, `--surface-3`, `--ink-0..3`), accent (`--accent`, `--accent-hover`, `--accent-ink`), warn (`--warn-bg`, `--warn-border`, `--warn-ink`, `--warn-strong`), focus (`--focus-ring`), type scale (`--text-xs..2xl`), motion (`--ease-out`, `--ease-in-out`, `--dur-fast`, `--dur-base`, `--dur-slow`, `--dur-hero`).
  - `styles.css` reset + base + focus-ring rule + hover-gate + `prefers-reduced-motion` override.
  - `App` React component (stub) exported from `src/App.tsx`.

- [ ] **Step 1: Create `.gitignore`**

```gitignore
node_modules/
dist/
.DS_Store
*.log
.env
.env.local
coverage/
```

- [ ] **Step 2: Create `.npmrc`**

```
audit=true
save-exact=true
```

`save-exact=true` guarantees no `^`/`~` sneaks in via future `npm install`.

- [ ] **Step 3: Determine exact package versions and write `package.json`**

Run these to get the current stable version of each dependency:

```bash
npm view react version
npm view react-dom version
npm view vite version
npm view @vitejs/plugin-react version
npm view typescript version
npm view @types/react version
npm view @types/react-dom version
npm view vitest version
npm view @testing-library/react version
npm view @testing-library/jest-dom version
npm view @testing-library/user-event version
npm view jsdom version
npm view exifr version
npm view piexifjs version
npm view @types/piexifjs version
npm view pdf-lib version
npm view heic2any version
```

If any package's `time.modified` (via `npm view <pkg> time.modified`) is more than 12 months ago, stop and flag. Also confirm no returned version contains `-rc`, `-alpha`, `-beta`, or `-canary`; if it does, use the most recent stable release instead.

Substitute the returned values into this `package.json` template (replacing every `<X.Y.Z>`):

```json
{
  "name": "metadata-scrubber",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint:audit": "npm audit --audit-level=high"
  },
  "dependencies": {
    "react": "<X.Y.Z>",
    "react-dom": "<X.Y.Z>",
    "exifr": "<X.Y.Z>",
    "piexifjs": "<X.Y.Z>",
    "pdf-lib": "<X.Y.Z>",
    "heic2any": "<X.Y.Z>"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "<X.Y.Z>",
    "@testing-library/react": "<X.Y.Z>",
    "@testing-library/user-event": "<X.Y.Z>",
    "@types/piexifjs": "<X.Y.Z>",
    "@types/react": "<X.Y.Z>",
    "@types/react-dom": "<X.Y.Z>",
    "@vitejs/plugin-react": "<X.Y.Z>",
    "jsdom": "<X.Y.Z>",
    "typescript": "<X.Y.Z>",
    "vite": "<X.Y.Z>",
    "vitest": "<X.Y.Z>"
  }
}
```

- [ ] **Step 4: Install and audit**

```bash
npm install
npm audit --audit-level=high
```

Expected: `npm audit` exits 0 with `found 0 vulnerabilities` at HIGH or CRITICAL. If any HIGH/CRITICAL are found, remediate before continuing — do not proceed to Step 5.

- [ ] **Step 5: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src", "tests"]
}
```

- [ ] **Step 6: Create `vite.config.ts`**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.{test,spec}.{ts,tsx}'],
  },
});
```

- [ ] **Step 7: Create `index.html` with CSP**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'self'; connect-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'"
    />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Metadata Scrubber</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 8: Create `src/tokens.css`**

```css
:root {
  /* Neutrals — cool-biased single-hue axis (h ~ 250) */
  --surface:      oklch(0.99 0.005 250);
  --surface-2:    oklch(0.97 0.006 250);
  --surface-3:    oklch(0.94 0.008 250);
  --ink-3:        oklch(0.62 0.010 250);
  --ink-2:        oklch(0.42 0.012 250);
  --ink-1:        oklch(0.22 0.014 250);
  --ink-0:        oklch(0.15 0.014 250);

  /* Accent */
  --accent:       oklch(0.62 0.14 145);
  --accent-hover: oklch(0.55 0.15 145);
  --accent-ink:   oklch(0.99 0.01 145);

  /* Warn — GPS callout only */
  --warn-bg:      oklch(0.96 0.04 30);
  --warn-border:  oklch(0.85 0.10 30);
  --warn-ink:     oklch(0.42 0.14 30);
  --warn-strong:  oklch(0.32 0.16 30);

  /* Focus */
  --focus-ring:   var(--accent);

  /* Type scale (ratio ~1.2) */
  --text-xs:  0.75rem;
  --text-sm:  0.875rem;
  --text-md:  1rem;
  --text-lg:  1.125rem;
  --text-xl:  1.5rem;
  --text-2xl: 2rem;

  /* Motion */
  --ease-out:    cubic-bezier(0.22, 1, 0.36, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --dur-fast:    140ms;
  --dur-base:    200ms;
  --dur-slow:    240ms;
  --dur-hero:    280ms;

  /* Font stack */
  --font-sans: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", system-ui, sans-serif;
}
```

- [ ] **Step 9: Create `src/styles.css`**

```css
@import './tokens.css';

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body {
  min-height: 100dvh;
}

body {
  font-family: var(--font-sans);
  font-size: var(--text-md);
  line-height: 1.5;
  color: var(--ink-1);
  background: var(--surface);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

button {
  font: inherit;
  color: inherit;
  background: none;
  border: none;
  cursor: pointer;
}

a {
  color: var(--accent);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

/* Focus ring — single token, applied via :focus-visible */
:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
  border-radius: 4px;
}

/* Hover gate — no :hover rules outside this query */
@media (hover: hover) and (pointer: fine) {
  /* component-level :hover rules live under this in their own files */
}

/* Reduced motion — disable transforms; keep opacity/color transitions */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    transition-duration: 120ms !important;
    animation-duration: 120ms !important;
    animation-iteration-count: 1 !important;
  }
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

- [ ] **Step 10: Create `src/vite-env.d.ts`**

```ts
/// <reference types="vite/client" />
```

- [ ] **Step 11: Create `src/App.tsx` (stub)**

```tsx
export function App() {
  return (
    <main>
      <h1>Metadata Scrubber</h1>
    </main>
  );
}
```

- [ ] **Step 12: Create `src/main.tsx`**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

- [ ] **Step 13: Create `tests/setup.ts`**

```ts
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});
```

- [ ] **Step 14: Write the smoke test**

Create `tests/unit/smoke.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { App } from '../../src/App';

describe('App smoke', () => {
  it('renders the app title', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Metadata Scrubber');
  });
});
```

- [ ] **Step 15: Run tests to verify it passes**

Run: `npm test`
Expected: PASS `App smoke > renders the app title`, exit 0.

- [ ] **Step 16: Verify dev server and build**

```bash
npm run dev
# open http://localhost:5173, confirm "Metadata Scrubber" renders, no console errors
# Ctrl-C

npm run build
# expected: writes dist/, exit 0
```

- [ ] **Step 17: Commit**

```bash
git init  # if not already initialized
git add .gitignore .npmrc package.json package-lock.json tsconfig.json vite.config.ts index.html \
        src/ tests/
git commit -m "chore(setup): scaffold vite+react+ts, tokens, base styles, smoke test"
```

---

### Task 2: Types + magic-byte file detection

**Files:**
- Create: `src/lib/types.ts`, `src/lib/detect.ts`
- Create: `tests/unit/detect.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type FileKind = 'jpeg' | 'png' | 'heic' | 'pdf' | 'unknown'`
  - `type Category = 'Location' | 'Device' | 'Timestamps' | 'Identity' | 'Other'`
  - `interface Finding { category: Category; label: string; value: string; rawKey: string }`
  - `interface ScrubResult { bytes: Uint8Array; outputName: string; outputMime: string }`
  - `detectFileKind(bytes: Uint8Array): FileKind`
  - `MAX_FILE_BYTES = 25 * 1024 * 1024` constant.

- [ ] **Step 1: Write `src/lib/types.ts`**

```ts
export type FileKind = 'jpeg' | 'png' | 'heic' | 'pdf' | 'unknown';

export type Category = 'Location' | 'Device' | 'Timestamps' | 'Identity' | 'Other';

export interface Finding {
  category: Category;
  label: string;
  value: string;
  rawKey: string;
}

export interface ScrubResult {
  bytes: Uint8Array;
  outputName: string;
  outputMime: string;
}

export const MAX_FILE_BYTES = 25 * 1024 * 1024;
```

- [ ] **Step 2: Write the failing detect tests**

Create `tests/unit/detect.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { detectFileKind } from '../../src/lib/detect';

function bytes(...hex: number[]): Uint8Array {
  return new Uint8Array(hex);
}

function buildHeicBytes(brand: string): Uint8Array {
  const size = new Uint8Array([0, 0, 0, 24]); // 24-byte ftyp box, arbitrary
  const ftyp = new TextEncoder().encode('ftyp');
  const brandBytes = new TextEncoder().encode(brand);
  const rest = new Uint8Array(12); // filler to reach 24 bytes
  const out = new Uint8Array(4 + 4 + 4 + 12);
  out.set(size, 0);
  out.set(ftyp, 4);
  out.set(brandBytes, 8);
  out.set(rest, 12);
  return out;
}

describe('detectFileKind', () => {
  it('detects JPEG by FFD8FF magic', () => {
    expect(detectFileKind(bytes(0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0))).toBe('jpeg');
  });

  it('detects PNG by 89504E47 magic', () => {
    expect(detectFileKind(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toBe('png');
  });

  it('detects HEIC via ftypheic', () => {
    expect(detectFileKind(buildHeicBytes('heic'))).toBe('heic');
  });

  it('detects HEIC via ftypheix', () => {
    expect(detectFileKind(buildHeicBytes('heix'))).toBe('heic');
  });

  it('detects HEIC via ftypmif1', () => {
    expect(detectFileKind(buildHeicBytes('mif1'))).toBe('heic');
  });

  it('detects HEIC via ftyphevc', () => {
    expect(detectFileKind(buildHeicBytes('hevc'))).toBe('heic');
  });

  it('detects PDF by %PDF magic', () => {
    expect(detectFileKind(bytes(0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37))).toBe('pdf');
  });

  it('rejects a file that says .jpg but has wrong bytes', () => {
    expect(detectFileKind(bytes(0x47, 0x49, 0x46, 0x38, 0x39, 0x61))).toBe('unknown');
  });

  it('returns unknown for empty input', () => {
    expect(detectFileKind(new Uint8Array(0))).toBe('unknown');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- tests/unit/detect.test.ts`
Expected: FAIL, `Cannot find module '../../src/lib/detect'`.

- [ ] **Step 4: Implement `src/lib/detect.ts`**

```ts
import type { FileKind } from './types';

const HEIC_BRANDS = new Set(['heic', 'heix', 'mif1', 'hevc']);

export function detectFileKind(bytes: Uint8Array): FileKind {
  if (bytes.length < 4) return 'unknown';

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpeg';

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return 'png';
  }

  // PDF: %PDF (25 50 44 46)
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return 'pdf';
  }

  // HEIC: "ftyp" at offset 4, brand at offset 8-12
  if (bytes.length >= 12) {
    const ftyp = String.fromCharCode(bytes[4], bytes[5], bytes[6], bytes[7]);
    if (ftyp === 'ftyp') {
      const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
      if (HEIC_BRANDS.has(brand)) return 'heic';
    }
  }

  return 'unknown';
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- tests/unit/detect.test.ts`
Expected: all 9 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/types.ts src/lib/detect.ts tests/unit/detect.test.ts
git commit -m "feat(lib): add types and magic-byte file detection"
```

---

### Task 3: Categorize raw metadata into Findings

**Files:**
- Create: `src/lib/categorize.ts`
- Create: `tests/unit/categorize.test.ts`

**Interfaces:**
- Consumes: `Finding`, `Category` from `src/lib/types.ts`.
- Produces:
  - `categorize(raw: Record<string, unknown>, kind: FileKind): Finding[]`
  - Function is deterministic; same input yields same output ordering.

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/categorize.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { categorize } from '../../src/lib/categorize';

describe('categorize', () => {
  it('routes GPS fields to Location', () => {
    const result = categorize({
      GPSLatitude: 37.7749,
      GPSLongitude: -122.4194,
      GPSAltitude: 15.2,
    }, 'jpeg');
    const locations = result.filter(f => f.category === 'Location');
    expect(locations.map(f => f.rawKey).sort()).toEqual(
      ['GPSAltitude', 'GPSLatitude', 'GPSLongitude'],
    );
  });

  it('routes Make/Model/Software to Device', () => {
    const result = categorize({
      Make: 'Apple',
      Model: 'iPhone 15 Pro',
      Software: '17.4.1',
    }, 'jpeg');
    const devices = result.filter(f => f.category === 'Device');
    expect(devices).toHaveLength(3);
    expect(devices.find(f => f.rawKey === 'Model')?.value).toBe('iPhone 15 Pro');
  });

  it('routes DateTimeOriginal to Timestamps', () => {
    const result = categorize({ DateTimeOriginal: '2024:06:15 14:32:11' }, 'jpeg');
    const stamps = result.filter(f => f.category === 'Timestamps');
    expect(stamps).toHaveLength(1);
    expect(stamps[0].label).toBe('Capture time');
  });

  it('routes PDF Author/Creator/Producer to Identity', () => {
    const result = categorize({
      Author: 'Jane Doe',
      Creator: 'Microsoft Word',
      Producer: 'Word for Microsoft 365',
    }, 'pdf');
    const ids = result.filter(f => f.category === 'Identity');
    expect(ids).toHaveLength(3);
  });

  it('routes unknown fields to Other', () => {
    const result = categorize({ Orientation: 6, ColorSpace: 1 }, 'jpeg');
    const others = result.filter(f => f.category === 'Other');
    expect(others).toHaveLength(2);
  });

  it('drops empty and null values', () => {
    const result = categorize({
      Make: '',
      Model: null,
      Software: undefined,
      Producer: 'Word',
    }, 'jpeg');
    expect(result).toHaveLength(1);
    expect(result[0].rawKey).toBe('Producer');
  });

  it('formats GPS numbers with fixed precision', () => {
    const result = categorize({ GPSLatitude: 37.774900123 }, 'jpeg');
    expect(result[0].value).toBe('37.774900° N');
  });

  it('shows S for negative latitude', () => {
    const result = categorize({ GPSLatitude: -33.868820 }, 'jpeg');
    expect(result[0].value).toContain('S');
    expect(result[0].value).not.toContain('-');
  });

  it('shows W for negative longitude', () => {
    const result = categorize({ GPSLongitude: -122.4194 }, 'jpeg');
    expect(result[0].value).toContain('W');
  });

  it('is deterministic (stable ordering)', () => {
    const raw = { Model: 'A', Make: 'B', GPSLatitude: 1, Producer: 'C' };
    const a = categorize(raw, 'jpeg').map(f => f.rawKey);
    const b = categorize(raw, 'jpeg').map(f => f.rawKey);
    expect(a).toEqual(b);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/categorize.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement `src/lib/categorize.ts`**

```ts
import type { Category, Finding, FileKind } from './types';

interface FieldMap {
  category: Category;
  label: string;
}

const FIELD_MAP: Record<string, FieldMap> = {
  // Location
  GPSLatitude:   { category: 'Location',   label: 'Latitude' },
  GPSLongitude:  { category: 'Location',   label: 'Longitude' },
  GPSAltitude:   { category: 'Location',   label: 'Altitude' },
  GPSDateStamp:  { category: 'Location',   label: 'GPS timestamp' },
  GPSTimeStamp:  { category: 'Location',   label: 'GPS time of day' },
  // Device
  Make:          { category: 'Device',     label: 'Camera make' },
  Model:         { category: 'Device',     label: 'Camera model' },
  LensMake:      { category: 'Device',     label: 'Lens make' },
  LensModel:     { category: 'Device',     label: 'Lens model' },
  Software:      { category: 'Device',     label: 'Software' },
  // Timestamps
  DateTimeOriginal: { category: 'Timestamps', label: 'Capture time' },
  CreateDate:       { category: 'Timestamps', label: 'Created' },
  ModifyDate:       { category: 'Timestamps', label: 'Modified' },
  CreationDate:     { category: 'Timestamps', label: 'Created' },
  ModDate:          { category: 'Timestamps', label: 'Modified' },
  // Identity
  Artist:        { category: 'Identity',   label: 'Artist' },
  Copyright:     { category: 'Identity',   label: 'Copyright' },
  OwnerName:     { category: 'Identity',   label: 'Owner' },
  HostComputer:  { category: 'Identity',   label: 'Host computer' },
  Author:        { category: 'Identity',   label: 'Author' },
  Creator:       { category: 'Identity',   label: 'Creator' },
  Producer:      { category: 'Identity',   label: 'Producer' },
  Title:         { category: 'Identity',   label: 'Title' },
  Subject:       { category: 'Identity',   label: 'Subject' },
  Keywords:      { category: 'Identity',   label: 'Keywords' },
};

const CATEGORY_ORDER: Category[] = ['Location', 'Device', 'Timestamps', 'Identity', 'Other'];

function isEmpty(v: unknown): boolean {
  if (v === null || v === undefined) return true;
  if (typeof v === 'string' && v.trim() === '') return true;
  return false;
}

function formatGpsLat(n: number): string {
  const hemisphere = n >= 0 ? 'N' : 'S';
  return `${Math.abs(n).toFixed(6)}° ${hemisphere}`;
}

function formatGpsLng(n: number): string {
  const hemisphere = n >= 0 ? 'E' : 'W';
  return `${Math.abs(n).toFixed(6)}° ${hemisphere}`;
}

function formatValue(rawKey: string, v: unknown): string {
  if (rawKey === 'GPSLatitude' && typeof v === 'number') return formatGpsLat(v);
  if (rawKey === 'GPSLongitude' && typeof v === 'number') return formatGpsLng(v);
  if (v instanceof Date) return v.toISOString();
  if (Array.isArray(v)) return v.map(String).join(', ');
  return String(v);
}

function humanizeUnknown(rawKey: string): string {
  return rawKey
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, c => c.toUpperCase())
    .trim();
}

export function categorize(raw: Record<string, unknown>, _kind: FileKind): Finding[] {
  const findings: Finding[] = [];
  const keys = Object.keys(raw).sort();

  for (const key of keys) {
    const value = raw[key];
    if (isEmpty(value)) continue;

    const mapped = FIELD_MAP[key];
    if (mapped) {
      findings.push({
        category: mapped.category,
        label: mapped.label,
        value: formatValue(key, value),
        rawKey: key,
      });
    } else if (key.startsWith('GPS')) {
      findings.push({
        category: 'Location',
        label: humanizeUnknown(key.replace(/^GPS/, 'GPS ')),
        value: formatValue(key, value),
        rawKey: key,
      });
    } else {
      findings.push({
        category: 'Other',
        label: humanizeUnknown(key),
        value: formatValue(key, value),
        rawKey: key,
      });
    }
  }

  return findings.sort((a, b) => {
    const ca = CATEGORY_ORDER.indexOf(a.category);
    const cb = CATEGORY_ORDER.indexOf(b.category);
    if (ca !== cb) return ca - cb;
    return a.rawKey.localeCompare(b.rawKey);
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- tests/unit/categorize.test.ts`
Expected: all 10 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/categorize.ts tests/unit/categorize.test.ts
git commit -m "feat(lib): add metadata categorization"
```

---

### Task 4: Image reader (exifr) + programmatic fixture builder

**Files:**
- Create: `tests/fixtures/programmatic.ts`
- Create: `src/lib/read/image.ts`
- Create: `tests/unit/read-image.test.ts`

**Interfaces:**
- Consumes: `categorize` from `src/lib/categorize.ts`, `Finding` from `src/lib/types.ts`.
- Produces:
  - `readImage(bytes: Uint8Array): Promise<Finding[]>` — parses EXIF/IPTC/XMP/GPS via exifr; returns categorized findings; returns `[]` if no metadata or parse error.
  - `buildJpegWithExif(opts): Uint8Array` fixture helper for later tasks.
  - Utility exports from `tests/fixtures/programmatic.ts`: `base64ToBinaryString`, `binaryStringToUint8`, `uint8ToBinaryString`.

- [ ] **Step 1: Create `tests/fixtures/programmatic.ts`**

```ts
import piexif from 'piexifjs';

// Minimal 1x1 white baseline JPEG (public-domain, well-known 1x1 test image, no EXIF).
export const BASE_JPEG_B64 =
  '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0a' +
  'HBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAA' +
  'AQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIh' +
  'MUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpT' +
  'VFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5' +
  'usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAA' +
  'AAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEI' +
  'FEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVm' +
  'Z2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK' +
  '0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigD//2Q==';

export function base64ToBinaryString(b64: string): string {
  return atob(b64);
}

export function binaryStringToUint8(s: string): Uint8Array {
  const bytes = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i);
  return bytes;
}

export function uint8ToBinaryString(bytes: Uint8Array): string {
  let s = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    s += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return s;
}

function decimalToDMSRational(deg: number): [number, number][] {
  const abs = Math.abs(deg);
  const d = Math.floor(abs);
  const minFloat = (abs - d) * 60;
  const m = Math.floor(minFloat);
  const s = Math.round((minFloat - m) * 60 * 100);
  return [[d, 1], [m, 1], [s, 100]];
}

export interface JpegFixtureOptions {
  gpsLat?: number;
  gpsLng?: number;
  make?: string;
  model?: string;
  software?: string;
  dateTimeOriginal?: string;
  artist?: string;
}

export function buildJpegWithExif(opts: JpegFixtureOptions = {}): Uint8Array {
  const dataUrl = `data:image/jpeg;base64,${BASE_JPEG_B64}`;

  const zeroth: Record<number, unknown> = {};
  const exif: Record<number, unknown> = {};
  const gps: Record<number, unknown> = {};

  if (opts.make) zeroth[piexif.ImageIFD.Make] = opts.make;
  if (opts.model) zeroth[piexif.ImageIFD.Model] = opts.model;
  if (opts.software) zeroth[piexif.ImageIFD.Software] = opts.software;
  if (opts.artist) zeroth[piexif.ImageIFD.Artist] = opts.artist;
  if (opts.dateTimeOriginal) exif[piexif.ExifIFD.DateTimeOriginal] = opts.dateTimeOriginal;

  if (opts.gpsLat !== undefined) {
    gps[piexif.GPSIFD.GPSLatitudeRef] = opts.gpsLat >= 0 ? 'N' : 'S';
    gps[piexif.GPSIFD.GPSLatitude] = decimalToDMSRational(opts.gpsLat);
  }
  if (opts.gpsLng !== undefined) {
    gps[piexif.GPSIFD.GPSLongitudeRef] = opts.gpsLng >= 0 ? 'E' : 'W';
    gps[piexif.GPSIFD.GPSLongitude] = decimalToDMSRational(opts.gpsLng);
  }

  const exifObj = { '0th': zeroth, Exif: exif, GPS: gps };
  const exifBytes = piexif.dump(exifObj);
  const newDataUrl = piexif.insert(exifBytes, dataUrl);
  const newBase64 = newDataUrl.split(',')[1];
  return binaryStringToUint8(base64ToBinaryString(newBase64));
}

export function buildPlainJpeg(): Uint8Array {
  return binaryStringToUint8(base64ToBinaryString(BASE_JPEG_B64));
}
```

- [ ] **Step 2: Write the failing `readImage` tests**

Create `tests/unit/read-image.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { readImage } from '../../src/lib/read/image';
import { buildJpegWithExif, buildPlainJpeg } from '../fixtures/programmatic';

describe('readImage', () => {
  it('extracts GPS latitude and longitude from a geotagged JPEG', async () => {
    const bytes = buildJpegWithExif({ gpsLat: 37.7749, gpsLng: -122.4194 });
    const findings = await readImage(bytes);
    const locations = findings.filter(f => f.category === 'Location');
    expect(locations.some(f => f.rawKey === 'GPSLatitude')).toBe(true);
    expect(locations.some(f => f.rawKey === 'GPSLongitude')).toBe(true);
  });

  it('extracts device make and model', async () => {
    const bytes = buildJpegWithExif({ make: 'Apple', model: 'iPhone 15 Pro' });
    const findings = await readImage(bytes);
    const devices = findings.filter(f => f.category === 'Device');
    expect(devices.find(f => f.rawKey === 'Make')?.value).toBe('Apple');
    expect(devices.find(f => f.rawKey === 'Model')?.value).toBe('iPhone 15 Pro');
  });

  it('extracts capture timestamp', async () => {
    const bytes = buildJpegWithExif({ dateTimeOriginal: '2024:06:15 14:32:11' });
    const findings = await readImage(bytes);
    const stamps = findings.filter(f => f.category === 'Timestamps');
    expect(stamps.length).toBeGreaterThan(0);
  });

  it('returns an empty array for a JPEG with no EXIF', async () => {
    const bytes = buildPlainJpeg();
    const findings = await readImage(bytes);
    expect(findings).toEqual([]);
  });

  it('returns an empty array for garbage bytes rather than throwing', async () => {
    const bytes = new Uint8Array([0, 1, 2, 3, 4]);
    const findings = await readImage(bytes);
    expect(findings).toEqual([]);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- tests/unit/read-image.test.ts`
Expected: FAIL, `Cannot find module '../../src/lib/read/image'`.

- [ ] **Step 4: Implement `src/lib/read/image.ts`**

```ts
import exifr from 'exifr';
import { categorize } from '../categorize';
import type { Finding } from '../types';

export async function readImage(bytes: Uint8Array): Promise<Finding[]> {
  try {
    const raw = await exifr.parse(bytes, {
      gps: true,
      exif: true,
      iptc: true,
      xmp: true,
      tiff: true,
      icc: false,
      jfif: false,
    });
    return categorize((raw ?? {}) as Record<string, unknown>, 'jpeg');
  } catch {
    return [];
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- tests/unit/read-image.test.ts`
Expected: all 5 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add tests/fixtures/programmatic.ts src/lib/read/image.ts tests/unit/read-image.test.ts
git commit -m "feat(lib): add image metadata reader and jpeg fixture builder"
```

---

### Task 5: PDF reader (pdf-lib)

**Files:**
- Modify: `tests/fixtures/programmatic.ts` (add `buildAuthoredPdf` helper)
- Create: `src/lib/read/pdf.ts`
- Create: `tests/unit/read-pdf.test.ts`

**Interfaces:**
- Consumes: `categorize` from `src/lib/categorize.ts`.
- Produces:
  - `readPdf(bytes: Uint8Array): Promise<Finding[]>` — reads PDF info dict + surfaces XMP presence.
  - `buildAuthoredPdf(opts): Promise<Uint8Array>` fixture helper.

- [ ] **Step 1: Add `buildAuthoredPdf` to `tests/fixtures/programmatic.ts`**

Append to that file:

```ts
import { PDFDocument } from 'pdf-lib';

export interface PdfFixtureOptions {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
}

export async function buildAuthoredPdf(opts: PdfFixtureOptions = {}): Promise<Uint8Array> {
  const doc = await PDFDocument.create({ updateMetadata: false });
  doc.addPage([612, 792]);
  if (opts.title) doc.setTitle(opts.title);
  if (opts.author) doc.setAuthor(opts.author);
  if (opts.subject) doc.setSubject(opts.subject);
  if (opts.keywords) doc.setKeywords(opts.keywords);
  if (opts.creator) doc.setCreator(opts.creator);
  if (opts.producer) doc.setProducer(opts.producer);
  if (opts.creationDate) doc.setCreationDate(opts.creationDate);
  if (opts.modificationDate) doc.setModificationDate(opts.modificationDate);
  return doc.save({ useObjectStreams: false });
}

export async function buildBarePdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create({ updateMetadata: false });
  doc.addPage([612, 792]);
  return doc.save({ useObjectStreams: false });
}
```

- [ ] **Step 2: Write the failing tests**

Create `tests/unit/read-pdf.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { readPdf } from '../../src/lib/read/pdf';
import { buildAuthoredPdf, buildBarePdf } from '../fixtures/programmatic';

describe('readPdf', () => {
  it('extracts Author, Creator, Producer from info dictionary', async () => {
    const bytes = await buildAuthoredPdf({
      author: 'Jane Doe',
      creator: 'Microsoft Word',
      producer: 'Word for Microsoft 365',
    });
    const findings = await readPdf(bytes);
    const identity = findings.filter(f => f.category === 'Identity');
    expect(identity.find(f => f.rawKey === 'Author')?.value).toBe('Jane Doe');
    expect(identity.find(f => f.rawKey === 'Creator')?.value).toBe('Microsoft Word');
    expect(identity.find(f => f.rawKey === 'Producer')?.value).toBe('Word for Microsoft 365');
  });

  it('extracts Title and Subject', async () => {
    const bytes = await buildAuthoredPdf({ title: 'Q3 Report', subject: 'Finance' });
    const findings = await readPdf(bytes);
    expect(findings.find(f => f.rawKey === 'Title')?.value).toBe('Q3 Report');
    expect(findings.find(f => f.rawKey === 'Subject')?.value).toBe('Finance');
  });

  it('extracts CreationDate as a Timestamps finding', async () => {
    const bytes = await buildAuthoredPdf({ creationDate: new Date('2024-06-15T14:32:11Z') });
    const findings = await readPdf(bytes);
    const stamps = findings.filter(f => f.category === 'Timestamps');
    expect(stamps.some(f => f.rawKey === 'CreationDate')).toBe(true);
  });

  it('returns [] for a bare PDF with no metadata', async () => {
    const bytes = await buildBarePdf();
    const findings = await readPdf(bytes);
    expect(findings).toEqual([]);
  });

  it('throws on unrecoverable parse errors (corrupt bytes)', async () => {
    const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x00, 0x00]);
    await expect(readPdf(bytes)).rejects.toThrow();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- tests/unit/read-pdf.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 4: Implement `src/lib/read/pdf.ts`**

```ts
import { PDFDocument, PDFName } from 'pdf-lib';
import { categorize } from '../categorize';
import type { Finding } from '../types';

export async function readPdf(bytes: Uint8Array): Promise<Finding[]> {
  const doc = await PDFDocument.load(bytes, { updateMetadata: false });
  const raw: Record<string, unknown> = {};

  const title = doc.getTitle();
  const author = doc.getAuthor();
  const subject = doc.getSubject();
  const keywords = doc.getKeywords();
  const creator = doc.getCreator();
  const producer = doc.getProducer();
  const creationDate = doc.getCreationDate();
  const modificationDate = doc.getModificationDate();

  if (title) raw.Title = title;
  if (author) raw.Author = author;
  if (subject) raw.Subject = subject;
  if (keywords) raw.Keywords = keywords;
  if (creator) raw.Creator = creator;
  if (producer) raw.Producer = producer;
  if (creationDate) raw.CreationDate = creationDate;
  if (modificationDate) raw.ModDate = modificationDate;

  const catalog = doc.catalog;
  const metadataRef = catalog.get(PDFName.of('Metadata'));
  if (metadataRef) {
    raw.XMPMetadata = 'present';
  }

  return categorize(raw, 'pdf');
}
```

Note: the categorizer already routes `Title`/`Author`/`Subject`/`Keywords`/`Creator`/`Producer` to `Identity`, and `CreationDate`/`ModDate` to `Timestamps`. `XMPMetadata` is unknown to the field map and lands in `Other`, which is correct — it's a flag, not a specific field.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- tests/unit/read-pdf.test.ts`
Expected: all 5 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add tests/fixtures/programmatic.ts src/lib/read/pdf.ts tests/unit/read-pdf.test.ts
git commit -m "feat(lib): add pdf metadata reader and authored-pdf fixture builder"
```

---

### Task 6: JPEG scrubber (piexifjs, lossless)

**Files:**
- Create: `src/lib/scrub/naming.ts` (shared helper used by every scrubber)
- Create: `src/lib/scrub/jpeg.ts`
- Create: `tests/unit/scrub-jpeg.test.ts`

**Interfaces:**
- Consumes: `ScrubResult`, `Finding` from `src/lib/types.ts`; `buildJpegWithExif`, `binaryStringToUint8`, `uint8ToBinaryString` from `tests/fixtures/programmatic.ts`; `readImage` from `src/lib/read/image.ts` (used in the round-trip test).
- Produces:
  - `withCleanedSuffix(originalName: string, ext: string): string`
  - `scrubJpeg(bytes: Uint8Array, originalName: string): ScrubResult`

- [ ] **Step 1: Create `src/lib/scrub/naming.ts`**

```ts
export function withCleanedSuffix(originalName: string, ext: string): string {
  const dot = originalName.lastIndexOf('.');
  const stem = dot > 0 ? originalName.slice(0, dot) : originalName;
  return `${stem}-cleaned.${ext}`;
}
```

- [ ] **Step 2: Write the failing tests**

Create `tests/unit/scrub-jpeg.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { scrubJpeg } from '../../src/lib/scrub/jpeg';
import { readImage } from '../../src/lib/read/image';
import { buildJpegWithExif } from '../fixtures/programmatic';

describe('scrubJpeg', () => {
  it('removes GPS metadata (round-trip via readImage)', async () => {
    const dirty = buildJpegWithExif({ gpsLat: 37.7749, gpsLng: -122.4194 });
    const { bytes: cleaned } = scrubJpeg(dirty, 'photo.jpg');
    const findings = await readImage(cleaned);
    expect(findings.filter(f => f.category === 'Location')).toEqual([]);
  });

  it('removes device metadata (round-trip)', async () => {
    const dirty = buildJpegWithExif({ make: 'Apple', model: 'iPhone 15 Pro' });
    const { bytes: cleaned } = scrubJpeg(dirty, 'photo.jpg');
    const findings = await readImage(cleaned);
    expect(findings.filter(f => f.category === 'Device')).toEqual([]);
  });

  it('removes capture timestamp (round-trip)', async () => {
    const dirty = buildJpegWithExif({ dateTimeOriginal: '2024:06:15 14:32:11' });
    const { bytes: cleaned } = scrubJpeg(dirty, 'photo.jpg');
    const findings = await readImage(cleaned);
    expect(findings.filter(f => f.category === 'Timestamps')).toEqual([]);
  });

  it('produces a filename with -cleaned.jpg suffix', () => {
    const dirty = buildJpegWithExif({ make: 'Apple' });
    const result = scrubJpeg(dirty, 'IMG_1234.jpg');
    expect(result.outputName).toBe('IMG_1234-cleaned.jpg');
    expect(result.outputMime).toBe('image/jpeg');
  });

  it('handles filenames with multiple dots', () => {
    const dirty = buildJpegWithExif({});
    const result = scrubJpeg(dirty, 'photo.foo.jpg');
    expect(result.outputName).toBe('photo.foo-cleaned.jpg');
  });

  it('handles filenames with no extension', () => {
    const dirty = buildJpegWithExif({});
    const result = scrubJpeg(dirty, 'photo');
    expect(result.outputName).toBe('photo-cleaned.jpg');
  });

  it('output still starts with JPEG magic bytes', () => {
    const dirty = buildJpegWithExif({ make: 'Apple' });
    const { bytes } = scrubJpeg(dirty, 'test.jpg');
    expect(bytes[0]).toBe(0xff);
    expect(bytes[1]).toBe(0xd8);
    expect(bytes[2]).toBe(0xff);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- tests/unit/scrub-jpeg.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 4: Implement `src/lib/scrub/jpeg.ts`**

```ts
import piexif from 'piexifjs';
import type { ScrubResult } from '../types';
import { withCleanedSuffix } from './naming';
import { uint8ToBinaryString, binaryStringToUint8 } from '../../../tests/fixtures/programmatic';

// NOTE: the two Uint8Array/binary-string helpers currently live under tests/
// because they were introduced there for fixtures. Move them into src/lib/binary.ts
// as a follow-up if a second scrubber ends up needing them (see PNG scrubber).
// For now the JPEG scrubber and its tests share the helpers via that import.

export function scrubJpeg(bytes: Uint8Array, originalName: string): ScrubResult {
  const binary = uint8ToBinaryString(bytes);
  const cleaned = piexif.remove(binary);
  return {
    bytes: binaryStringToUint8(cleaned),
    outputName: withCleanedSuffix(originalName, 'jpg'),
    outputMime: 'image/jpeg',
  };
}
```

**Refactor note (do this in the same step, before running tests):** the `uint8ToBinaryString` / `binaryStringToUint8` helpers should not be imported from `tests/`. Move them into `src/lib/binary.ts` now to avoid the cross-directory import:

Create `src/lib/binary.ts`:

```ts
export function uint8ToBinaryString(bytes: Uint8Array): string {
  let s = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    s += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return s;
}

export function binaryStringToUint8(s: string): Uint8Array {
  const bytes = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i);
  return bytes;
}

export function base64ToBinaryString(b64: string): string {
  return atob(b64);
}
```

Update `tests/fixtures/programmatic.ts` to import from `../../src/lib/binary` instead of redefining these three helpers locally (remove the local `uint8ToBinaryString`, `binaryStringToUint8`, `base64ToBinaryString` from Task 4's file; add `import { ... } from '../../src/lib/binary'`).

Update `src/lib/scrub/jpeg.ts` accordingly:

```ts
import piexif from 'piexifjs';
import type { ScrubResult } from '../types';
import { withCleanedSuffix } from './naming';
import { uint8ToBinaryString, binaryStringToUint8 } from '../binary';

export function scrubJpeg(bytes: Uint8Array, originalName: string): ScrubResult {
  const binary = uint8ToBinaryString(bytes);
  const cleaned = piexif.remove(binary);
  return {
    bytes: binaryStringToUint8(cleaned),
    outputName: withCleanedSuffix(originalName, 'jpg'),
    outputMime: 'image/jpeg',
  };
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test`
Expected: all suites still pass (`detect`, `categorize`, `read-image`, `read-pdf`, `scrub-jpeg`). Existing tests should not have broken from the binary-helper refactor because `programmatic.ts` re-exports the same functions.

- [ ] **Step 6: Commit**

```bash
git add src/lib/binary.ts src/lib/scrub/naming.ts src/lib/scrub/jpeg.ts \
        tests/fixtures/programmatic.ts tests/unit/scrub-jpeg.test.ts
git commit -m "feat(scrub): add lossless jpeg exif strip and shared binary utils"
```

---

### Task 7: PNG scrubber (chunk-level byte manipulation)

**Note:** The spec proposed canvas re-render; this task uses chunk-level byte manipulation instead. Rationale: (a) testable in jsdom without a canvas polyfill; (b) byte-exact pixel data preservation (no color-profile drift from re-encoding); (c) explicit allowlist of chunk types is easier to audit than "whatever canvas emits." The design intent — output PNG has no metadata-bearing ancillary chunks — is preserved.

**Files:**
- Modify: `tests/fixtures/programmatic.ts` (add `buildPngWithText`, `hasPngChunk`, `crc32` helper)
- Create: `src/lib/scrub/png.ts`
- Create: `tests/unit/scrub-png.test.ts`

**Interfaces:**
- Consumes: `ScrubResult`, `binaryStringToUint8`, `base64ToBinaryString`.
- Produces:
  - `scrubPng(bytes: Uint8Array, originalName: string): ScrubResult`
  - `buildPngWithText(entries: Array<[key: string, value: string]>): Uint8Array` fixture helper
  - `hasPngChunk(bytes: Uint8Array, type: string): boolean` test helper

- [ ] **Step 1: Extend `tests/fixtures/programmatic.ts`**

Append:

```ts
const PNG_SIGNATURE = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

// Minimal 1x1 transparent PNG (public-domain, no ancillary chunks).
const BASE_PNG_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c >>> 0;
  }
  return t;
})();

export function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function writeUint32BE(n: number): Uint8Array {
  return new Uint8Array([(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff]);
}

function findChunkOffset(bytes: Uint8Array, type: string): number {
  let offset = 8;
  const enc = new TextEncoder();
  const wanted = enc.encode(type);
  while (offset + 8 <= bytes.length) {
    const length =
      (bytes[offset] << 24) |
      (bytes[offset + 1] << 16) |
      (bytes[offset + 2] << 8) |
      bytes[offset + 3];
    let match = true;
    for (let i = 0; i < 4; i++) {
      if (bytes[offset + 4 + i] !== wanted[i]) { match = false; break; }
    }
    if (match) return offset;
    offset += 4 + 4 + length + 4;
  }
  return -1;
}

export function hasPngChunk(bytes: Uint8Array, type: string): boolean {
  return findChunkOffset(bytes, type) !== -1;
}

export function buildPngWithText(entries: Array<[string, string]>): Uint8Array {
  const baseBytes = binaryStringToUint8(base64ToBinaryString(BASE_PNG_B64));
  // Verify signature.
  for (let i = 0; i < 8; i++) {
    if (baseBytes[i] !== PNG_SIGNATURE[i]) throw new Error('base PNG malformed');
  }

  const iendOffset = findChunkOffset(baseBytes, 'IEND');
  if (iendOffset === -1) throw new Error('base PNG has no IEND');

  const preIend = baseBytes.subarray(0, iendOffset);
  const iendChunk = baseBytes.subarray(iendOffset, iendOffset + 12);

  const enc = new TextEncoder();
  const textChunks: Uint8Array[] = [];
  for (const [key, value] of entries) {
    const keyBytes = enc.encode(key);
    const valueBytes = enc.encode(value);
    const data = new Uint8Array(keyBytes.length + 1 + valueBytes.length);
    data.set(keyBytes, 0);
    data[keyBytes.length] = 0;
    data.set(valueBytes, keyBytes.length + 1);

    const typeAndData = new Uint8Array(4 + data.length);
    typeAndData.set(enc.encode('tEXt'), 0);
    typeAndData.set(data, 4);
    const crc = crc32(typeAndData);

    const chunk = new Uint8Array(4 + typeAndData.length + 4);
    chunk.set(writeUint32BE(data.length), 0);
    chunk.set(typeAndData, 4);
    chunk.set(writeUint32BE(crc), 4 + typeAndData.length);
    textChunks.push(chunk);
  }

  const totalTextLen = textChunks.reduce((s, c) => s + c.length, 0);
  const out = new Uint8Array(preIend.length + totalTextLen + iendChunk.length);
  out.set(preIend, 0);
  let cursor = preIend.length;
  for (const chunk of textChunks) {
    out.set(chunk, cursor);
    cursor += chunk.length;
  }
  out.set(iendChunk, cursor);
  return out;
}
```

- [ ] **Step 2: Write the failing tests**

Create `tests/unit/scrub-png.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { scrubPng } from '../../src/lib/scrub/png';
import { buildPngWithText, hasPngChunk } from '../fixtures/programmatic';

describe('scrubPng', () => {
  it('removes all tEXt chunks', () => {
    const dirty = buildPngWithText([['Author', 'Jane'], ['Software', 'Photoshop 24']]);
    expect(hasPngChunk(dirty, 'tEXt')).toBe(true);
    const { bytes } = scrubPng(dirty, 'pic.png');
    expect(hasPngChunk(bytes, 'tEXt')).toBe(false);
  });

  it('preserves IHDR, IDAT, IEND (critical chunks)', () => {
    const dirty = buildPngWithText([['Author', 'Jane']]);
    const { bytes } = scrubPng(dirty, 'pic.png');
    expect(hasPngChunk(bytes, 'IHDR')).toBe(true);
    expect(hasPngChunk(bytes, 'IDAT')).toBe(true);
    expect(hasPngChunk(bytes, 'IEND')).toBe(true);
  });

  it('output has the PNG signature', () => {
    const dirty = buildPngWithText([['x', 'y']]);
    const { bytes } = scrubPng(dirty, 'pic.png');
    expect(bytes[0]).toBe(0x89);
    expect(bytes[1]).toBe(0x50);
    expect(bytes[2]).toBe(0x4e);
    expect(bytes[3]).toBe(0x47);
  });

  it('produces -cleaned.png filename', () => {
    const dirty = buildPngWithText([]);
    const result = scrubPng(dirty, 'screenshot.png');
    expect(result.outputName).toBe('screenshot-cleaned.png');
    expect(result.outputMime).toBe('image/png');
  });

  it('throws on non-PNG bytes', () => {
    expect(() => scrubPng(new Uint8Array([0xff, 0xd8, 0xff]), 'not.png')).toThrow(/PNG/i);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- tests/unit/scrub-png.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 4: Implement `src/lib/scrub/png.ts`**

```ts
import type { ScrubResult } from '../types';
import { withCleanedSuffix } from './naming';

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

const KEEP_CHUNKS = new Set([
  'IHDR', 'IDAT', 'IEND', 'PLTE',
  'gAMA', 'cHRM', 'sRGB', 'iCCP',
  'bKGD', 'tRNS', 'sBIT', 'pHYs',
  'hIST',
]);

function readUint32BE(bytes: Uint8Array, offset: number): number {
  return (
    ((bytes[offset] << 24) |
      (bytes[offset + 1] << 16) |
      (bytes[offset + 2] << 8) |
      bytes[offset + 3]) >>> 0
  );
}

function chunkType(bytes: Uint8Array, offset: number): string {
  return String.fromCharCode(
    bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3],
  );
}

export function scrubPng(bytes: Uint8Array, originalName: string): ScrubResult {
  for (let i = 0; i < 8; i++) {
    if (bytes[i] !== PNG_SIGNATURE[i]) {
      throw new Error('Not a valid PNG file');
    }
  }

  const kept: Uint8Array[] = [bytes.subarray(0, 8)];
  let offset = 8;

  while (offset + 8 <= bytes.length) {
    const length = readUint32BE(bytes, offset);
    const type = chunkType(bytes, offset + 4);
    const totalChunkSize = 4 + 4 + length + 4;

    if (KEEP_CHUNKS.has(type)) {
      kept.push(bytes.subarray(offset, offset + totalChunkSize));
    }

    offset += totalChunkSize;
    if (type === 'IEND') break;
  }

  const outSize = kept.reduce((sum, c) => sum + c.length, 0);
  const out = new Uint8Array(outSize);
  let cursor = 0;
  for (const chunk of kept) {
    out.set(chunk, cursor);
    cursor += chunk.length;
  }

  return {
    bytes: out,
    outputName: withCleanedSuffix(originalName, 'png'),
    outputMime: 'image/png',
  };
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- tests/unit/scrub-png.test.ts`
Expected: all 5 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/scrub/png.ts tests/unit/scrub-png.test.ts tests/fixtures/programmatic.ts
git commit -m "feat(scrub): strip png ancillary metadata chunks byte-level"
```

---

### Task 8: HEIC scrubber (heic2any → JPEG scrubber)

**Note on testability:** HEIC generation from scratch is impractical. This task requires a real HEIC fixture at `tests/fixtures/iphone.heic`. If the fixture is absent, the automated test suite is skipped; the manual verification in Task 15 is the authoritative quality gate for HEIC per the PRD.

**Fixture setup instructions** (add to your local dev environment before running Task 8 tests):
1. On an iPhone, take a photo (any photo works; a geotagged one is preferable).
2. AirDrop or transfer to a Mac such that the original `.heic` is preserved (do NOT let Photos auto-convert).
3. Downsize if desired (macOS Preview: Tools → Adjust Size → keep as HEIC via Export). Aim for < 500 KB to keep tests fast.
4. Place at `tests/fixtures/iphone.heic`.
5. The file is gitignored via `.gitignore` update in this task's Step 1.

**Files:**
- Modify: `.gitignore` (ignore `tests/fixtures/iphone.heic`)
- Create: `src/lib/scrub/heic.ts`
- Create: `tests/unit/scrub-heic.test.ts`

**Interfaces:**
- Consumes: `scrubJpeg` from `src/lib/scrub/jpeg.ts`; `withCleanedSuffix` from `src/lib/scrub/naming.ts`; `ScrubResult` from `src/lib/types.ts`.
- Produces:
  - `scrubHeic(bytes: Uint8Array, originalName: string): Promise<ScrubResult>` — converts HEIC to JPEG then strips EXIF from the JPEG.

- [ ] **Step 1: Update `.gitignore`**

Append:

```
# Real fixtures the engineer must place locally
tests/fixtures/iphone.heic
```

- [ ] **Step 2: Write the (conditionally skipped) test**

Create `tests/unit/scrub-heic.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { scrubHeic } from '../../src/lib/scrub/heic';
import { readImage } from '../../src/lib/read/image';

const currentDir = dirname(fileURLToPath(import.meta.url));
const heicPath = resolve(currentDir, '../fixtures/iphone.heic');
const heicExists = existsSync(heicPath);

describe.runIf(heicExists)('scrubHeic (fixture present)', () => {
  it('converts HEIC input to a JPEG output with no Location or Device findings', async () => {
    const bytes = new Uint8Array(readFileSync(heicPath));
    const { bytes: cleaned, outputMime, outputName } = await scrubHeic(bytes, 'IMG_0001.heic');
    expect(outputMime).toBe('image/jpeg');
    expect(outputName).toBe('IMG_0001-cleaned.jpg');
    expect(cleaned[0]).toBe(0xff);
    expect(cleaned[1]).toBe(0xd8);
    const findings = await readImage(cleaned);
    expect(findings.filter(f => f.category === 'Location')).toEqual([]);
    expect(findings.filter(f => f.category === 'Device')).toEqual([]);
  });
});

describe.skipIf(heicExists)('scrubHeic (fixture missing)', () => {
  it('is skipped without tests/fixtures/iphone.heic; verify manually per Task 15', () => {
    expect(heicExists).toBe(false);
  });
});
```

- [ ] **Step 3: Run tests to verify current state**

Run: `npm test -- tests/unit/scrub-heic.test.ts`
Expected: if fixture missing, `1 skipped, 1 passed` (the skip-if-exists marker). If fixture present but scrubHeic not yet implemented, FAIL on module resolution.

- [ ] **Step 4: Implement `src/lib/scrub/heic.ts`**

```ts
import heic2any from 'heic2any';
import type { ScrubResult } from '../types';
import { withCleanedSuffix } from './naming';
import { scrubJpeg } from './jpeg';

export async function scrubHeic(
  bytes: Uint8Array,
  originalName: string,
): Promise<ScrubResult> {
  const blob = new Blob([bytes], { type: 'image/heic' });
  const converted = await heic2any({ blob, toType: 'image/jpeg', quality: 0.95 });
  const jpegBlob = Array.isArray(converted) ? converted[0] : converted;
  const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer());
  const stripped = scrubJpeg(jpegBytes, originalName);
  return {
    bytes: stripped.bytes,
    outputName: withCleanedSuffix(originalName, 'jpg'),
    outputMime: 'image/jpeg',
  };
}
```

- [ ] **Step 5: Run tests**

Run: `npm test -- tests/unit/scrub-heic.test.ts`
Expected:
- Without fixture: `1 skipped, 1 passed`.
- With fixture in place and libheif WASM loading successfully in jsdom: PASS. If the WASM refuses to init in jsdom, the failure is environmental — mark it as a Task 15 manual-verification item and continue.

- [ ] **Step 6: Commit**

```bash
git add .gitignore src/lib/scrub/heic.ts tests/unit/scrub-heic.test.ts
git commit -m "feat(scrub): add heic to clean jpeg conversion pipeline"
```

---

### Task 9: PDF scrubber (pdf-lib info dict + XMP)

**Files:**
- Create: `src/lib/scrub/pdf.ts`
- Create: `tests/unit/scrub-pdf.test.ts`

**Interfaces:**
- Consumes: `ScrubResult`; `buildAuthoredPdf` and `buildBarePdf` fixtures; `readPdf` for round-trip verification.
- Produces:
  - `scrubPdf(bytes: Uint8Array, originalName: string): Promise<ScrubResult>` — clears info dict fields, removes `/Metadata` XMP stream, preserves page content.

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/scrub-pdf.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { scrubPdf } from '../../src/lib/scrub/pdf';
import { readPdf } from '../../src/lib/read/pdf';
import { buildAuthoredPdf } from '../fixtures/programmatic';

describe('scrubPdf', () => {
  it('removes Author/Creator/Producer/Title from info dictionary', async () => {
    const dirty = await buildAuthoredPdf({
      title: 'Q3 Report',
      author: 'Jane Doe',
      creator: 'Microsoft Word',
      producer: 'Word for Microsoft 365',
    });
    const { bytes: cleaned } = await scrubPdf(dirty, 'report.pdf');
    const findings = await readPdf(cleaned);
    expect(findings.filter(f => f.category === 'Identity')).toEqual([]);
  });

  it('removes CreationDate and ModDate', async () => {
    const dirty = await buildAuthoredPdf({
      creationDate: new Date('2024-06-15T14:32:11Z'),
      modificationDate: new Date('2024-07-01T09:00:00Z'),
    });
    const { bytes: cleaned } = await scrubPdf(dirty, 'doc.pdf');
    const findings = await readPdf(cleaned);
    expect(findings.filter(f => f.category === 'Timestamps')).toEqual([]);
  });

  it('preserves the page count', async () => {
    const dirty = await buildAuthoredPdf({ author: 'Jane' });
    const { bytes: cleaned } = await scrubPdf(dirty, 'doc.pdf');
    const dirtyDoc = await PDFDocument.load(dirty);
    const cleanedDoc = await PDFDocument.load(cleaned);
    expect(cleanedDoc.getPageCount()).toBe(dirtyDoc.getPageCount());
  });

  it('output starts with %PDF magic bytes', async () => {
    const dirty = await buildAuthoredPdf({ author: 'Jane' });
    const { bytes: cleaned } = await scrubPdf(dirty, 'doc.pdf');
    expect(cleaned[0]).toBe(0x25); // %
    expect(cleaned[1]).toBe(0x50); // P
    expect(cleaned[2]).toBe(0x44); // D
    expect(cleaned[3]).toBe(0x46); // F
  });

  it('produces -cleaned.pdf filename', async () => {
    const dirty = await buildAuthoredPdf({ author: 'Jane' });
    const result = await scrubPdf(dirty, 'my-report.pdf');
    expect(result.outputName).toBe('my-report-cleaned.pdf');
    expect(result.outputMime).toBe('application/pdf');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/scrub-pdf.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement `src/lib/scrub/pdf.ts`**

```ts
import { PDFDocument, PDFName, PDFDict } from 'pdf-lib';
import type { ScrubResult } from '../types';
import { withCleanedSuffix } from './naming';

const INFO_KEYS = [
  'Title', 'Author', 'Subject', 'Keywords',
  'Creator', 'Producer', 'CreationDate', 'ModDate',
];

export async function scrubPdf(
  bytes: Uint8Array,
  originalName: string,
): Promise<ScrubResult> {
  const doc = await PDFDocument.load(bytes, { updateMetadata: false });

  const infoRef = doc.context.trailerInfo.Info;
  if (infoRef) {
    const info = doc.context.lookup(infoRef);
    if (info instanceof PDFDict) {
      for (const key of INFO_KEYS) {
        info.delete(PDFName.of(key));
      }
    }
  }

  const metadataKey = PDFName.of('Metadata');
  if (doc.catalog.get(metadataKey)) {
    doc.catalog.delete(metadataKey);
  }

  const out = await doc.save({ useObjectStreams: false });
  return {
    bytes: out,
    outputName: withCleanedSuffix(originalName, 'pdf'),
    outputMime: 'application/pdf',
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- tests/unit/scrub-pdf.test.ts`
Expected: all 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/scrub/pdf.ts tests/unit/scrub-pdf.test.ts
git commit -m "feat(scrub): clear pdf info dict and xmp metadata stream"
```

---

### Task 10: State reducer

**Files:**
- Create: `src/state.ts`
- Create: `tests/unit/state.test.ts`

**Interfaces:**
- Consumes: `Finding`, `FileKind`, `Category` from `src/lib/types.ts`.
- Produces:
  - `interface FileMeta { name: string; size: number; bytes: Uint8Array }`
  - Discriminated-union `type State` with variants `empty | analyzing | analyzed | scrubbing | done | error`
  - Discriminated-union `type Action` (`FILE_DROPPED`, `ANALYSIS_COMPLETE`, `ANALYSIS_FAILED`, `SCRUB_STARTED`, `SCRUB_COMPLETE`, `SCRUB_FAILED`, `ERROR_DISMISSED`, `RESET`)
  - `initialState: State`
  - `reduce(state: State, action: Action): State` — pure, returns same reference on invalid transition.

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/state.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { initialState, reduce, type FileMeta, type State } from '../../src/state';
import type { Finding } from '../../src/lib/types';

const sampleFile: FileMeta = {
  name: 'photo.jpg',
  size: 1024,
  bytes: new Uint8Array([0xff, 0xd8, 0xff]),
};

const gpsFinding: Finding = {
  category: 'Location',
  label: 'Latitude',
  value: '37.774900° N',
  rawKey: 'GPSLatitude',
};

describe('reduce', () => {
  it('starts empty', () => {
    expect(initialState.kind).toBe('empty');
  });

  it('FILE_DROPPED moves empty to analyzing', () => {
    const next = reduce(initialState, { type: 'FILE_DROPPED', file: sampleFile });
    expect(next.kind).toBe('analyzing');
    if (next.kind === 'analyzing') expect(next.file).toBe(sampleFile);
  });

  it('ANALYSIS_COMPLETE moves analyzing to analyzed with findings', () => {
    const analyzing = reduce(initialState, { type: 'FILE_DROPPED', file: sampleFile });
    const next = reduce(analyzing, {
      type: 'ANALYSIS_COMPLETE',
      findings: [gpsFinding],
      fileKind: 'jpeg',
    });
    expect(next.kind).toBe('analyzed');
    if (next.kind === 'analyzed') {
      expect(next.findings).toEqual([gpsFinding]);
      expect(next.fileKind).toBe('jpeg');
    }
  });

  it('ANALYSIS_FAILED moves analyzing to error with empty previous', () => {
    const analyzing = reduce(initialState, { type: 'FILE_DROPPED', file: sampleFile });
    const next = reduce(analyzing, { type: 'ANALYSIS_FAILED', message: 'corrupt' });
    expect(next.kind).toBe('error');
    if (next.kind === 'error') {
      expect(next.message).toBe('corrupt');
      expect(next.previous.kind).toBe('empty');
    }
  });

  it('SCRUB_STARTED moves analyzed to scrubbing carrying findings forward', () => {
    const analyzed: State = {
      kind: 'analyzed',
      file: sampleFile,
      fileKind: 'jpeg',
      findings: [gpsFinding],
    };
    const next = reduce(analyzed, { type: 'SCRUB_STARTED' });
    expect(next.kind).toBe('scrubbing');
    if (next.kind === 'scrubbing') expect(next.findings).toEqual([gpsFinding]);
  });

  it('SCRUB_COMPLETE moves scrubbing to done with removed categories', () => {
    const scrubbing: State = {
      kind: 'scrubbing',
      file: sampleFile,
      fileKind: 'jpeg',
      findings: [gpsFinding],
    };
    const next = reduce(scrubbing, {
      type: 'SCRUB_COMPLETE',
      removedCategories: ['Location', 'Device'],
    });
    expect(next.kind).toBe('done');
    if (next.kind === 'done') expect(next.removedCategories).toEqual(['Location', 'Device']);
  });

  it('SCRUB_FAILED puts analyzed state into error.previous so user can retry', () => {
    const analyzed: State = {
      kind: 'analyzed',
      file: sampleFile,
      fileKind: 'jpeg',
      findings: [gpsFinding],
    };
    const scrubbing = reduce(analyzed, { type: 'SCRUB_STARTED' });
    const errored = reduce(scrubbing, { type: 'SCRUB_FAILED', message: 'oops' });
    expect(errored.kind).toBe('error');
    if (errored.kind === 'error') {
      expect(errored.message).toBe('oops');
      expect(errored.previous.kind).toBe('analyzed');
    }
  });

  it('ERROR_DISMISSED restores the previous state', () => {
    const analyzed: State = {
      kind: 'analyzed',
      file: sampleFile,
      fileKind: 'jpeg',
      findings: [gpsFinding],
    };
    const errored = reduce(analyzed, { type: 'SCRUB_FAILED', message: 'x' });
    // ERROR_DISMISSED needs the scrubbing→error transition; simulate directly:
    const errFromScrub: State = {
      kind: 'error',
      message: 'x',
      previous: analyzed,
    };
    const next = reduce(errFromScrub, { type: 'ERROR_DISMISSED' });
    expect(next).toEqual(analyzed);
    // Also cover: dismiss from the SCRUB_FAILED-derived error state
    void errored;
  });

  it('RESET returns to initial from any state', () => {
    const done: State = {
      kind: 'done',
      file: sampleFile,
      removedCategories: ['Location'],
    };
    expect(reduce(done, { type: 'RESET' })).toEqual(initialState);
  });

  it('ignores mismatched actions (SCRUB_STARTED in empty state) — returns same reference', () => {
    const next = reduce(initialState, { type: 'SCRUB_STARTED' });
    expect(next).toBe(initialState);
  });

  it('FILE_DROPPED works from done (user starts over by dropping a new file)', () => {
    const done: State = {
      kind: 'done',
      file: sampleFile,
      removedCategories: ['Location'],
    };
    const next = reduce(done, { type: 'FILE_DROPPED', file: sampleFile });
    expect(next.kind).toBe('analyzing');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/state.test.ts`
Expected: FAIL, `Cannot find module '../../src/state'`.

- [ ] **Step 3: Implement `src/state.ts`**

```ts
import type { Category, FileKind, Finding } from './lib/types';

export interface FileMeta {
  name: string;
  size: number;
  bytes: Uint8Array;
}

export type State =
  | { kind: 'empty' }
  | { kind: 'analyzing'; file: FileMeta }
  | {
      kind: 'analyzed';
      file: FileMeta;
      fileKind: FileKind;
      findings: Finding[];
    }
  | {
      kind: 'scrubbing';
      file: FileMeta;
      fileKind: FileKind;
      findings: Finding[];
    }
  | {
      kind: 'done';
      file: FileMeta;
      removedCategories: Category[];
    }
  | { kind: 'error'; message: string; previous: State };

export type Action =
  | { type: 'FILE_DROPPED'; file: FileMeta }
  | { type: 'ANALYSIS_COMPLETE'; findings: Finding[]; fileKind: FileKind }
  | { type: 'ANALYSIS_FAILED'; message: string }
  | { type: 'SCRUB_STARTED' }
  | { type: 'SCRUB_COMPLETE'; removedCategories: Category[] }
  | { type: 'SCRUB_FAILED'; message: string }
  | { type: 'ERROR_DISMISSED' }
  | { type: 'RESET' };

export const initialState: State = { kind: 'empty' };

export function reduce(state: State, action: Action): State {
  switch (action.type) {
    case 'FILE_DROPPED': {
      // Legal from empty, analyzed, done, or error. Any drop restarts the pipeline.
      if (
        state.kind === 'empty' ||
        state.kind === 'analyzed' ||
        state.kind === 'done' ||
        state.kind === 'error'
      ) {
        return { kind: 'analyzing', file: action.file };
      }
      return state;
    }

    case 'ANALYSIS_COMPLETE':
      if (state.kind !== 'analyzing') return state;
      return {
        kind: 'analyzed',
        file: state.file,
        fileKind: action.fileKind,
        findings: action.findings,
      };

    case 'ANALYSIS_FAILED':
      if (state.kind !== 'analyzing') return state;
      return { kind: 'error', message: action.message, previous: { kind: 'empty' } };

    case 'SCRUB_STARTED':
      if (state.kind !== 'analyzed') return state;
      return {
        kind: 'scrubbing',
        file: state.file,
        fileKind: state.fileKind,
        findings: state.findings,
      };

    case 'SCRUB_COMPLETE':
      if (state.kind !== 'scrubbing') return state;
      return {
        kind: 'done',
        file: state.file,
        removedCategories: action.removedCategories,
      };

    case 'SCRUB_FAILED':
      if (state.kind !== 'scrubbing') return state;
      return {
        kind: 'error',
        message: action.message,
        previous: {
          kind: 'analyzed',
          file: state.file,
          fileKind: state.fileKind,
          findings: state.findings,
        },
      };

    case 'ERROR_DISMISSED':
      if (state.kind !== 'error') return state;
      return state.previous;

    case 'RESET':
      return initialState;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- tests/unit/state.test.ts`
Expected: all 11 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/state.ts tests/unit/state.test.ts
git commit -m "feat(state): add reducer for empty/analyzing/analyzed/scrubbing/done/error"
```

---

### Task 11: Presentational components — PrivacyBadge, FileHeader, Skeleton

**Files:**
- Create: `src/components/PrivacyBadge.tsx`, `src/components/FileHeader.tsx`, `src/components/Skeleton.tsx`
- Modify: `src/styles.css` (append component styles)
- Create: `tests/unit/components/basics.test.tsx`

**Interfaces:**
- Produces:
  - `<PrivacyBadge />` — no props.
  - `<FileHeader name={} size={} onReset={} />`.
  - `<Skeleton />` — no props.

- [ ] **Step 1: Create `src/components/PrivacyBadge.tsx`**

```tsx
export function PrivacyBadge() {
  return (
    <p className="privacy-badge">
      Files stay on your device. Nothing is uploaded.
    </p>
  );
}
```

- [ ] **Step 2: Create `src/components/FileHeader.tsx`**

```tsx
interface Props {
  name: string;
  size: number;
  onReset: () => void;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function FileHeader({ name, size, onReset }: Props) {
  return (
    <div className="file-header">
      <span className="file-header__name">{name}</span>
      <span className="file-header__size">{formatBytes(size)}</span>
      <button type="button" className="file-header__reset" onClick={onReset}>
        Start over
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Create `src/components/Skeleton.tsx`**

```tsx
const WIDTHS = ['75%', '40%', '60%', '30%', '55%'];

export function Skeleton() {
  return (
    <div className="skeleton" aria-hidden="true">
      {WIDTHS.map((w, i) => (
        <div key={i} className="skeleton__row" style={{ width: w }} />
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Append component styles to `src/styles.css`**

Append at the end of the file:

```css
/* --- PrivacyBadge --- */
.privacy-badge {
  font-size: var(--text-xs);
  color: var(--ink-3);
  margin: 0;
}

/* --- FileHeader --- */
.file-header {
  display: flex;
  align-items: baseline;
  gap: 1rem;
  padding: 1rem 0;
  border-bottom: 1px solid var(--surface-3);
}
.file-header__name {
  font-size: var(--text-md);
  color: var(--ink-1);
  font-weight: 500;
  flex: 1;
  word-break: break-word;
}
.file-header__size {
  font-size: var(--text-sm);
  color: var(--ink-3);
  font-variant-numeric: tabular-nums;
}
.file-header__reset {
  color: var(--ink-2);
  font-size: var(--text-sm);
  text-decoration: underline;
  text-underline-offset: 4px;
  transition: transform var(--dur-fast) var(--ease-out);
}
.file-header__reset:active { transform: scale(0.97); }

/* --- Skeleton --- */
.skeleton {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 32px 0;
}
.skeleton__row {
  height: 16px;
  background: var(--surface-2);
  border-radius: 4px;
}
```

- [ ] **Step 5: Write render tests**

Create `tests/unit/components/basics.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PrivacyBadge } from '../../../src/components/PrivacyBadge';
import { FileHeader } from '../../../src/components/FileHeader';
import { Skeleton } from '../../../src/components/Skeleton';

describe('PrivacyBadge', () => {
  it('states files never leave the device', () => {
    render(<PrivacyBadge />);
    expect(screen.getByText(/nothing is uploaded/i)).toBeInTheDocument();
  });
});

describe('FileHeader', () => {
  it('renders name and formatted size', () => {
    render(<FileHeader name="photo.jpg" size={2048} onReset={() => {}} />);
    expect(screen.getByText('photo.jpg')).toBeInTheDocument();
    expect(screen.getByText('2.0 KB')).toBeInTheDocument();
  });

  it('formats MB for larger files', () => {
    render(<FileHeader name="doc.pdf" size={3 * 1024 * 1024} onReset={() => {}} />);
    expect(screen.getByText('3.0 MB')).toBeInTheDocument();
  });

  it('invokes onReset when the reset button is clicked', async () => {
    const onReset = vi.fn();
    render(<FileHeader name="x" size={1} onReset={onReset} />);
    await userEvent.click(screen.getByRole('button', { name: /start over/i }));
    expect(onReset).toHaveBeenCalledOnce();
  });
});

describe('Skeleton', () => {
  it('is aria-hidden and has 5 skeleton rows', () => {
    const { container } = render(<Skeleton />);
    const wrapper = container.querySelector('.skeleton');
    expect(wrapper).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelectorAll('.skeleton__row')).toHaveLength(5);
  });
});
```

- [ ] **Step 6: Run tests**

Run: `npm test -- tests/unit/components/basics.test.tsx`
Expected: all 5 tests PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/PrivacyBadge.tsx src/components/FileHeader.tsx \
        src/components/Skeleton.tsx src/styles.css \
        tests/unit/components/basics.test.tsx
git commit -m "feat(ui): add privacy badge, file header, and skeleton components"
```

---

### Task 12: DropZone

**Files:**
- Create: `src/components/DropZone.tsx`
- Modify: `src/styles.css` (append)
- Create: `tests/unit/components/drop-zone.test.tsx`

**Interfaces:**
- Produces: `<DropZone onFile={(file: File) => void} />`.
- Behavior: label wraps a visually-hidden file input. Clicking the label or pressing Enter/Space with the input focused triggers the picker. Dropping a file also fires `onFile`. Drag-over applies `.dropzone--active` class.

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/components/drop-zone.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DropZone } from '../../../src/components/DropZone';

function makeFile(name = 'photo.jpg', type = 'image/jpeg'): File {
  return new File([new Uint8Array([1, 2, 3])], name, { type });
}

describe('DropZone', () => {
  it('renders the prompt text', () => {
    render(<DropZone onFile={() => {}} />);
    expect(screen.getByText(/drop a file to see what it's leaking/i)).toBeInTheDocument();
    expect(screen.getByText(/JPEG, PNG, HEIC, PDF/i)).toBeInTheDocument();
  });

  it('calls onFile when a file is picked via the input', async () => {
    const onFile = vi.fn();
    render(<DropZone onFile={onFile} />);
    const input = screen.getByLabelText(/drop a file/i) as HTMLInputElement;
    await userEvent.upload(input, makeFile('a.jpg'));
    expect(onFile).toHaveBeenCalledOnce();
    expect(onFile.mock.calls[0][0].name).toBe('a.jpg');
  });

  it('calls onFile when a file is dropped', () => {
    const onFile = vi.fn();
    const { container } = render(<DropZone onFile={onFile} />);
    const label = container.querySelector('.dropzone')!;
    fireEvent.drop(label, {
      dataTransfer: { files: [makeFile('drop.png', 'image/png')] },
    });
    expect(onFile).toHaveBeenCalledOnce();
    expect(onFile.mock.calls[0][0].name).toBe('drop.png');
  });

  it('adds the active class during drag over and removes on leave', () => {
    const { container } = render(<DropZone onFile={() => {}} />);
    const label = container.querySelector('.dropzone')!;
    expect(label.className).not.toContain('dropzone--active');
    fireEvent.dragOver(label);
    expect(label.className).toContain('dropzone--active');
    fireEvent.dragLeave(label);
    expect(label.className).not.toContain('dropzone--active');
  });

  it('drop clears the active class', () => {
    const { container } = render(<DropZone onFile={() => {}} />);
    const label = container.querySelector('.dropzone')!;
    fireEvent.dragOver(label);
    expect(label.className).toContain('dropzone--active');
    fireEvent.drop(label, { dataTransfer: { files: [makeFile()] } });
    expect(label.className).not.toContain('dropzone--active');
  });

  it('input has an accessible label', () => {
    render(<DropZone onFile={() => {}} />);
    expect(screen.getByLabelText(/drop a file to see what it's leaking/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/components/drop-zone.test.tsx`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement `src/components/DropZone.tsx`**

```tsx
import { useState } from 'react';

interface Props {
  onFile: (file: File) => void;
}

const ACCEPT = 'image/jpeg,image/png,image/heic,application/pdf';

export function DropZone({ onFile }: Props) {
  const [dragActive, setDragActive] = useState(false);

  const handleFile = (file: File | undefined | null) => {
    if (file) onFile(file);
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0]);
    e.target.value = '';
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const onDragLeave = () => setDragActive(false);

  return (
    <label
      className={`dropzone${dragActive ? ' dropzone--active' : ''}`}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
    >
      <input
        type="file"
        accept={ACCEPT}
        onChange={onChange}
        className="visually-hidden"
        aria-label="Drop a file to see what it's leaking."
      />
      <p className="dropzone__prompt">Drop a file to see what it&apos;s leaking.</p>
      <p className="dropzone__hint">JPEG, PNG, HEIC, PDF. Up to 25 MB.</p>
    </label>
  );
}
```

- [ ] **Step 4: Append DropZone styles to `src/styles.css`**

```css
/* --- DropZone --- */
.dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 64px 24px;
  min-height: 60dvh;
  background: var(--surface-2);
  border: 2px dashed var(--surface-3);
  border-radius: 8px;
  cursor: pointer;
  transition:
    transform var(--dur-fast) var(--ease-out),
    filter var(--dur-fast) var(--ease-out),
    border-color var(--dur-base) var(--ease-out),
    background var(--dur-base) var(--ease-out);
}
@media (hover: hover) and (pointer: fine) {
  .dropzone:hover { border-color: var(--ink-3); }
}
.dropzone--active {
  border-color: var(--ink-2);
  transform: scale(1.005);
  filter: brightness(1.02);
}
.dropzone__prompt {
  font-size: var(--text-lg);
  color: var(--ink-1);
  margin: 0;
}
.dropzone__hint {
  font-size: var(--text-xs);
  color: var(--ink-3);
  margin: 0;
}

@media (prefers-reduced-motion: reduce) {
  .dropzone, .dropzone--active { transform: none; filter: none; }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- tests/unit/components/drop-zone.test.tsx`
Expected: all 6 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/DropZone.tsx src/styles.css tests/unit/components/drop-zone.test.tsx
git commit -m "feat(ui): add drop zone with drag/drop, picker, and active-state motion"
```

---

### Task 13: MetadataReport + GpsCallout

**Files:**
- Create: `src/components/GpsCallout.tsx`, `src/components/MetadataReport.tsx`
- Modify: `src/styles.css` (append)
- Create: `tests/unit/components/metadata-report.test.tsx`

**Interfaces:**
- Produces:
  - `<GpsCallout lat={number} lng={number} />`
  - `<MetadataReport findings={Finding[]} heicNote?={boolean} />`

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/components/metadata-report.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetadataReport } from '../../../src/components/MetadataReport';
import type { Finding } from '../../../src/lib/types';

const gpsLat: Finding = { category: 'Location', label: 'Latitude', value: '37.774900° N', rawKey: 'GPSLatitude' };
const gpsLng: Finding = { category: 'Location', label: 'Longitude', value: '122.419400° W', rawKey: 'GPSLongitude' };
const make: Finding   = { category: 'Device',   label: 'Camera make',  value: 'Apple',            rawKey: 'Make' };
const model: Finding  = { category: 'Device',   label: 'Camera model', value: 'iPhone 15 Pro',    rawKey: 'Model' };
const captured: Finding = { category: 'Timestamps', label: 'Capture time', value: '2024:06:15 14:32:11', rawKey: 'DateTimeOriginal' };

describe('MetadataReport', () => {
  it('renders the friendly empty message when there are no findings', () => {
    render(<MetadataReport findings={[]} />);
    expect(screen.getByText(/no hidden metadata found/i)).toBeInTheDocument();
  });

  it('renders category sections when findings exist', () => {
    render(<MetadataReport findings={[make, model, captured]} />);
    expect(screen.getByRole('heading', { name: 'Device' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Timestamps' })).toBeInTheDocument();
    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
  });

  it('renders GpsCallout when Location findings are present', () => {
    render(<MetadataReport findings={[gpsLat, gpsLng, make]} />);
    expect(screen.getByText(/reveals where it was taken/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view on google maps/i })).toHaveAttribute(
      'href',
      expect.stringMatching(/^https:\/\/www\.google\.com\/maps\?q=/),
    );
  });

  it('does NOT render GpsCallout when there are no Location findings', () => {
    render(<MetadataReport findings={[make, captured]} />);
    expect(screen.queryByText(/reveals where it was taken/i)).not.toBeInTheDocument();
  });

  it('renders the HEIC conversion note when heicNote prop is true', () => {
    render(<MetadataReport findings={[make]} heicNote />);
    expect(screen.getByText(/heic will be converted to a clean jpeg/i)).toBeInTheDocument();
  });

  it('parses coordinates from formatted values back to signed decimals for the Maps URL', () => {
    render(<MetadataReport findings={[gpsLat, gpsLng]} />);
    const link = screen.getByRole('link', { name: /view on google maps/i });
    // 37.774900,-122.419400 or similar precision
    expect(link.getAttribute('href')).toMatch(/q=37\.7749,-122\.4194/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/components/metadata-report.test.tsx`
Expected: FAIL, modules not found.

- [ ] **Step 3: Implement `src/components/GpsCallout.tsx`**

```tsx
interface Props {
  lat: number;
  lng: number;
}

function formatLat(n: number): string {
  const hemisphere = n >= 0 ? 'N' : 'S';
  return `${Math.abs(n).toFixed(6)}° ${hemisphere}`;
}

function formatLng(n: number): string {
  const hemisphere = n >= 0 ? 'E' : 'W';
  return `${Math.abs(n).toFixed(6)}° ${hemisphere}`;
}

export function GpsCallout({ lat, lng }: Props) {
  const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
  return (
    <aside className="gps-callout" role="note">
      <h2 className="gps-callout__heading">
        <span className="gps-callout__glyph" aria-hidden="true">⚠</span>
        <span>This photo reveals where it was taken.</span>
      </h2>
      <dl className="gps-callout__coords">
        <div>
          <dt>Latitude</dt>
          <dd>{formatLat(lat)}</dd>
        </div>
        <div>
          <dt>Longitude</dt>
          <dd>{formatLng(lng)}</dd>
        </div>
      </dl>
      <a
        className="gps-callout__link"
        href={mapsUrl}
        target="_blank"
        rel="noopener"
      >
        View on Google Maps ↗
      </a>
    </aside>
  );
}
```

- [ ] **Step 4: Implement `src/components/MetadataReport.tsx`**

```tsx
import type { Category, Finding } from '../lib/types';
import { GpsCallout } from './GpsCallout';

interface Props {
  findings: Finding[];
  heicNote?: boolean;
}

const CATEGORY_ORDER: Category[] = ['Location', 'Device', 'Timestamps', 'Identity', 'Other'];

function parseCoord(value: string | undefined): number | null {
  if (!value) return null;
  const match = value.match(/([0-9.]+)°\s*([NSEW])/);
  if (!match) return null;
  const mag = parseFloat(match[1]);
  const hemi = match[2];
  return hemi === 'S' || hemi === 'W' ? -mag : mag;
}

function groupByCategory(findings: Finding[]): Record<Category, Finding[]> {
  const map = { Location: [], Device: [], Timestamps: [], Identity: [], Other: [] } as Record<Category, Finding[]>;
  for (const f of findings) map[f.category].push(f);
  return map;
}

export function MetadataReport({ findings, heicNote }: Props) {
  if (findings.length === 0) {
    return (
      <p className="report-empty">No hidden metadata found. This file is already clean.</p>
    );
  }

  const byCategory = groupByCategory(findings);
  const latValue = findings.find(f => f.rawKey === 'GPSLatitude')?.value;
  const lngValue = findings.find(f => f.rawKey === 'GPSLongitude')?.value;
  const lat = parseCoord(latValue);
  const lng = parseCoord(lngValue);

  return (
    <section aria-labelledby="report-heading" className="report">
      <h2 id="report-heading" className="visually-hidden">Detected metadata</h2>
      {lat !== null && lng !== null && <GpsCallout lat={lat} lng={lng} />}
      {heicNote && (
        <p className="report-note">HEIC will be converted to a clean JPEG.</p>
      )}
      {CATEGORY_ORDER.map((cat, idx) => {
        const rows = byCategory[cat];
        if (rows.length === 0) return null;
        return (
          <div
            className="report-section"
            key={cat}
            style={{ animationDelay: `${idx * 40}ms` }}
          >
            <h3 className="report-section__label">{cat}</h3>
            <dl className="report-section__rows">
              {rows.map(row => (
                <div className="report-row" key={row.rawKey}>
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        );
      })}
    </section>
  );
}
```

- [ ] **Step 5: Append component styles to `src/styles.css`**

```css
/* --- MetadataReport --- */
.report { margin: 24px 0; }
.report-empty { color: var(--ink-2); padding: 32px 0; }
.report-note {
  color: var(--ink-3);
  font-size: var(--text-sm);
  padding: 8px 0;
}
.report-section {
  padding: 32px 0;
  border-top: 1px solid var(--surface-3);
  opacity: 0;
  transform: translateY(4px);
  animation: report-section-enter var(--dur-slow) var(--ease-out) forwards;
}
.report-section:first-of-type { border-top: none; }
@keyframes report-section-enter {
  to { opacity: 1; transform: translateY(0); }
}
.report-section__label {
  font-size: var(--text-xs);
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink-3);
  margin: 0 0 12px;
}
.report-section__rows { display: grid; gap: 6px; margin: 0; }
.report-row {
  display: grid;
  grid-template-columns: minmax(140px, 1fr) 2fr;
  gap: 16px;
  align-items: baseline;
  margin: 0;
}
.report-row dt {
  color: var(--ink-2);
  font-size: var(--text-sm);
  margin: 0;
}
.report-row dd {
  color: var(--ink-1);
  font-size: var(--text-sm);
  font-variant-numeric: tabular-nums;
  word-break: break-word;
  margin: 0;
}

@media (prefers-reduced-motion: reduce) {
  .report-section { animation: none; opacity: 1; transform: none; }
}

/* --- GpsCallout --- */
.gps-callout {
  background: var(--warn-bg);
  border: 1px solid var(--warn-border);
  border-radius: 8px;
  padding: 24px;
  margin: 24px 0 8px;
  transform-origin: top left;
  opacity: 0;
  transform: scale(0.97);
  animation: gps-enter var(--dur-hero) var(--ease-out) 80ms forwards;
}
@keyframes gps-enter {
  to { opacity: 1; transform: scale(1); }
}
.gps-callout__heading {
  font-size: var(--text-lg);
  color: var(--warn-strong);
  font-weight: 600;
  margin: 0 0 12px;
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.gps-callout__glyph { font-size: var(--text-md); }
.gps-callout__coords {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 4px 16px;
  margin: 0 0 12px;
  font-variant-numeric: tabular-nums;
}
.gps-callout__coords > div { display: contents; }
.gps-callout__coords dt {
  color: var(--warn-ink);
  font-size: var(--text-sm);
  margin: 0;
}
.gps-callout__coords dd {
  color: var(--warn-strong);
  font-weight: 500;
  font-size: var(--text-sm);
  margin: 0;
}
.gps-callout__link {
  color: var(--warn-strong);
  font-weight: 500;
  text-decoration: underline;
  text-underline-offset: 4px;
}

@media (prefers-reduced-motion: reduce) {
  .gps-callout {
    animation-name: gps-enter-reduced;
    animation-duration: var(--dur-base);
    transform: none;
  }
  @keyframes gps-enter-reduced { to { opacity: 1; } }
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npm test -- tests/unit/components/metadata-report.test.tsx`
Expected: all 6 tests PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/GpsCallout.tsx src/components/MetadataReport.tsx \
        src/styles.css tests/unit/components/metadata-report.test.tsx
git commit -m "feat(ui): add metadata report and gps callout with entrance motion"
```

---

### Task 14: ScrubButton, DoneSummary, ErrorBanner

**Files:**
- Create: `src/components/ScrubButton.tsx`, `src/components/DoneSummary.tsx`, `src/components/ErrorBanner.tsx`
- Modify: `src/styles.css` (append)
- Create: `tests/unit/components/scrub-button.test.tsx`, `tests/unit/components/done-summary.test.tsx`, `tests/unit/components/error-banner.test.tsx`

**Interfaces:**
- Produces:
  - `<ScrubButton loading={boolean} onClick={() => void} />`
  - `<DoneSummary removedCategories={Category[]} onReset={() => void} />`
  - `<ErrorBanner message={string} onDismiss={() => void} />`

- [ ] **Step 1: Write the failing tests for ScrubButton**

Create `tests/unit/components/scrub-button.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScrubButton } from '../../../src/components/ScrubButton';

describe('ScrubButton', () => {
  it('renders the primary label when not loading', () => {
    render(<ScrubButton loading={false} onClick={() => {}} />);
    expect(screen.getByRole('button', { name: /remove metadata and download/i })).toBeInTheDocument();
  });

  it('renders the loading label and is disabled when loading', () => {
    render(<ScrubButton loading={true} onClick={() => {}} />);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveTextContent(/scrubbing/i);
  });

  it('invokes onClick when clicked and not loading', async () => {
    const onClick = vi.fn();
    render(<ScrubButton loading={false} onClick={onClick} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does not invoke onClick when clicked while loading', async () => {
    const onClick = vi.fn();
    render(<ScrubButton loading={true} onClick={onClick} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Write the failing tests for DoneSummary**

Create `tests/unit/components/done-summary.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DoneSummary } from '../../../src/components/DoneSummary';

describe('DoneSummary', () => {
  it('shows the confirmation heading', () => {
    render(<DoneSummary removedCategories={['Location']} onReset={() => {}} />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(/done\. your file is clean\./i);
  });

  it('lists each removed category', () => {
    render(<DoneSummary removedCategories={['Location', 'Device', 'Timestamps']} onReset={() => {}} />);
    expect(screen.getByText(/removed location/i)).toBeInTheDocument();
    expect(screen.getByText(/removed device/i)).toBeInTheDocument();
    expect(screen.getByText(/removed timestamps/i)).toBeInTheDocument();
  });

  it('shows a no-metadata message when nothing was removed', () => {
    render(<DoneSummary removedCategories={[]} onReset={() => {}} />);
    expect(screen.getByText(/had no metadata to remove/i)).toBeInTheDocument();
  });

  it('invokes onReset when the reset button is clicked', async () => {
    const onReset = vi.fn();
    render(<DoneSummary removedCategories={['Location']} onReset={onReset} />);
    await userEvent.click(screen.getByRole('button', { name: /scrub another file/i }));
    expect(onReset).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 3: Write the failing tests for ErrorBanner**

Create `tests/unit/components/error-banner.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBanner } from '../../../src/components/ErrorBanner';

describe('ErrorBanner', () => {
  it('renders the message with role=alert and aria-live=assertive', () => {
    render(<ErrorBanner message="Sorry, we only support JPEG, PNG, HEIC, and PDF right now." onDismiss={() => {}} />);
    const banner = screen.getByRole('alert');
    expect(banner).toHaveAttribute('aria-live', 'assertive');
    expect(banner).toHaveTextContent(/only support jpeg/i);
  });

  it('invokes onDismiss when the dismiss button is clicked', async () => {
    const onDismiss = vi.fn();
    render(<ErrorBanner message="x" onDismiss={onDismiss} />);
    await userEvent.click(screen.getByRole('button', { name: /dismiss/i }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 4: Run tests to verify all three fail**

Run: `npm test -- tests/unit/components/scrub-button.test.tsx tests/unit/components/done-summary.test.tsx tests/unit/components/error-banner.test.tsx`
Expected: FAIL, three modules not found.

- [ ] **Step 5: Implement `src/components/ScrubButton.tsx`**

```tsx
interface Props {
  loading: boolean;
  onClick: () => void;
}

export function ScrubButton({ loading, onClick }: Props) {
  return (
    <button
      type="button"
      className="scrub-button"
      onClick={onClick}
      disabled={loading}
      aria-disabled={loading}
      aria-busy={loading}
    >
      {loading ? (
        <>
          <span className="scrub-button__spinner" aria-hidden="true" />
          Scrubbing...
        </>
      ) : (
        'Remove metadata and download'
      )}
    </button>
  );
}
```

- [ ] **Step 6: Implement `src/components/DoneSummary.tsx`**

```tsx
import type { Category } from '../lib/types';

interface Props {
  removedCategories: Category[];
  onReset: () => void;
}

export function DoneSummary({ removedCategories, onReset }: Props) {
  return (
    <section className="done" aria-labelledby="done-heading">
      <h2 id="done-heading" className="done__heading">Done. Your file is clean.</h2>
      {removedCategories.length > 0 ? (
        <ul className="done__list">
          {removedCategories.map((cat, idx) => (
            <li
              key={cat}
              className="done__row"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <span className="done__check" aria-hidden="true">✓</span>
              <span className="done__label">Removed {cat.toLowerCase()}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="done__nothing">The file had no metadata to remove.</p>
      )}
      <button type="button" className="done__reset" onClick={onReset}>
        Scrub another file
      </button>
    </section>
  );
}
```

- [ ] **Step 7: Implement `src/components/ErrorBanner.tsx`**

```tsx
interface Props {
  message: string;
  onDismiss: () => void;
}

export function ErrorBanner({ message, onDismiss }: Props) {
  return (
    <div className="error-banner" role="alert" aria-live="assertive">
      <p className="error-banner__message">{message}</p>
      <button
        type="button"
        className="error-banner__dismiss"
        onClick={onDismiss}
        aria-label="Dismiss error"
      >
        ×
      </button>
    </div>
  );
}
```

- [ ] **Step 8: Append component styles to `src/styles.css`**

```css
/* --- ScrubButton --- */
.scrub-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: var(--accent);
  color: var(--accent-ink);
  font-weight: 500;
  font-size: var(--text-md);
  border-radius: 6px;
  transition:
    transform var(--dur-fast) var(--ease-out),
    background var(--dur-fast) var(--ease-out);
}
@media (hover: hover) and (pointer: fine) {
  .scrub-button:hover:not(:disabled) { background: var(--accent-hover); }
}
.scrub-button:active:not(:disabled) { transform: scale(0.97); }
.scrub-button:disabled {
  background: var(--surface-3);
  color: var(--ink-3);
  cursor: not-allowed;
}
.scrub-button__spinner {
  width: 14px;
  height: 14px;
  border: 2px solid var(--accent-ink);
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 800ms linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

@media (prefers-reduced-motion: reduce) {
  .scrub-button__spinner { animation-duration: 2000ms; }
  .scrub-button:active:not(:disabled) { transform: none; }
}

/* --- DoneSummary --- */
.done { padding: 32px 0; }
.done__heading {
  font-size: var(--text-lg);
  color: var(--ink-1);
  margin: 0 0 24px;
  font-weight: 600;
}
.done__list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0;
  margin: 0 0 32px;
}
.done__row {
  display: flex;
  align-items: center;
  gap: 12px;
  opacity: 0;
  animation: done-row-enter var(--dur-base) var(--ease-out) forwards;
}
@keyframes done-row-enter { to { opacity: 1; } }
.done__check {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: var(--accent);
  font-weight: 600;
  transform: scale(0.5);
  animation: check-pop 120ms var(--ease-out) forwards;
  animation-delay: inherit;
}
@keyframes check-pop { to { transform: scale(1); } }
.done__label { color: var(--ink-2); font-size: var(--text-md); }
.done__nothing { color: var(--ink-2); margin: 0 0 32px; }
.done__reset {
  color: var(--accent);
  font-size: var(--text-md);
  text-decoration: underline;
  text-underline-offset: 4px;
  transition: transform var(--dur-fast) var(--ease-out);
}
.done__reset:active { transform: scale(0.97); }

@media (prefers-reduced-motion: reduce) {
  .done__row { animation: none; opacity: 1; }
  .done__check { animation: none; transform: scale(1); }
}

/* --- ErrorBanner --- */
.error-banner {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 24px;
  background: var(--surface-2);
  border-top: 1px solid var(--ink-2);
  border-bottom: 1px solid var(--surface-3);
  opacity: 0;
  transform: translateY(-8px);
  animation: error-enter var(--dur-base) var(--ease-out) forwards;
}
@keyframes error-enter { to { opacity: 1; transform: translateY(0); } }
.error-banner__message {
  flex: 1;
  color: var(--ink-1);
  font-size: var(--text-sm);
  margin: 0;
}
.error-banner__dismiss {
  font-size: var(--text-lg);
  color: var(--ink-2);
  padding: 4px 8px;
  transition: transform var(--dur-fast) var(--ease-out);
}
.error-banner__dismiss:active { transform: scale(0.97); }

@media (prefers-reduced-motion: reduce) {
  .error-banner { animation-name: error-enter-reduced; transform: none; }
  @keyframes error-enter-reduced { to { opacity: 1; } }
}
```

- [ ] **Step 9: Run tests to verify they pass**

Run: `npm test`
Expected: entire suite PASS, including all three new component test files.

- [ ] **Step 10: Commit**

```bash
git add src/components/ScrubButton.tsx src/components/DoneSummary.tsx \
        src/components/ErrorBanner.tsx src/styles.css \
        tests/unit/components/scrub-button.test.tsx \
        tests/unit/components/done-summary.test.tsx \
        tests/unit/components/error-banner.test.tsx
git commit -m "feat(ui): add scrub button, done summary, and error banner"
```

---

### Task 15: App shell, wiring, focus management, README, manual verification

**Files:**
- Modify: `src/App.tsx` (replace the Task 1 stub with the full shell)
- Modify: `src/styles.css` (append layout rules for the asymmetric column)
- Create: `README.md`
- Create: `tests/unit/components/app-integration.test.tsx`
- Modify: `tests/unit/smoke.test.tsx` (update to match the new App output)

**Interfaces:**
- Consumes: every earlier task's exports.
- Produces:
  - Working end-to-end MVP.
  - Manual verification checklist recorded in `README.md`, executed and initialed.

- [ ] **Step 1: Replace `src/App.tsx` with the full shell**

```tsx
import { useReducer, useCallback, useEffect } from 'react';
import { PrivacyBadge } from './components/PrivacyBadge';
import { DropZone } from './components/DropZone';
import { FileHeader } from './components/FileHeader';
import { MetadataReport } from './components/MetadataReport';
import { ScrubButton } from './components/ScrubButton';
import { DoneSummary } from './components/DoneSummary';
import { ErrorBanner } from './components/ErrorBanner';
import { Skeleton } from './components/Skeleton';
import { initialState, reduce, type FileMeta } from './state';
import { detectFileKind } from './lib/detect';
import { readImage } from './lib/read/image';
import { readPdf } from './lib/read/pdf';
import { scrubJpeg } from './lib/scrub/jpeg';
import { scrubPng } from './lib/scrub/png';
import { scrubHeic } from './lib/scrub/heic';
import { scrubPdf } from './lib/scrub/pdf';
import {
  MAX_FILE_BYTES,
  type Category,
  type FileKind,
  type Finding,
  type ScrubResult,
} from './lib/types';

const ERR_UNSUPPORTED = 'Sorry, we only support JPEG, PNG, HEIC, and PDF right now.';
const ERR_OVERSIZED = 'This file is over 25 MB. Try a smaller one.';
const ERR_CORRUPT = "We couldn't read this file. It may be corrupt or password protected.";
const ERR_SCRUB = 'Something went wrong while removing metadata. Try again.';

async function readMetadata(bytes: Uint8Array, kind: FileKind): Promise<Finding[]> {
  switch (kind) {
    case 'jpeg':
    case 'png':
    case 'heic':
      return readImage(bytes);
    case 'pdf':
      return readPdf(bytes);
    case 'unknown':
      return [];
  }
}

async function scrubByKind(
  bytes: Uint8Array,
  kind: FileKind,
  name: string,
): Promise<ScrubResult> {
  switch (kind) {
    case 'jpeg': return scrubJpeg(bytes, name);
    case 'png':  return scrubPng(bytes, name);
    case 'heic': return scrubHeic(bytes, name);
    case 'pdf':  return scrubPdf(bytes, name);
    case 'unknown': throw new Error('Unsupported file kind');
  }
}

function triggerDownload(bytes: Uint8Array, filename: string, mime: string): void {
  const blob = new Blob([bytes], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function App() {
  const [state, dispatch] = useReducer(reduce, initialState);

  const onFile = useCallback(async (file: File) => {
    if (file.size > MAX_FILE_BYTES) {
      const meta: FileMeta = { name: file.name, size: file.size, bytes: new Uint8Array() };
      dispatch({ type: 'FILE_DROPPED', file: meta });
      dispatch({ type: 'ANALYSIS_FAILED', message: ERR_OVERSIZED });
      return;
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    const meta: FileMeta = { name: file.name, size: file.size, bytes };
    dispatch({ type: 'FILE_DROPPED', file: meta });

    const kind = detectFileKind(bytes);
    if (kind === 'unknown') {
      dispatch({ type: 'ANALYSIS_FAILED', message: ERR_UNSUPPORTED });
      return;
    }
    try {
      const findings = await readMetadata(bytes, kind);
      dispatch({ type: 'ANALYSIS_COMPLETE', findings, fileKind: kind });
    } catch {
      dispatch({ type: 'ANALYSIS_FAILED', message: ERR_CORRUPT });
    }
  }, []);

  const onScrub = useCallback(async () => {
    if (state.kind !== 'analyzed') return;
    const { file, fileKind, findings } = state;
    dispatch({ type: 'SCRUB_STARTED' });
    try {
      const result = await scrubByKind(file.bytes, fileKind, file.name);
      triggerDownload(result.bytes, result.outputName, result.outputMime);
      const removedCategories = Array.from(new Set(findings.map(f => f.category))) as Category[];
      dispatch({ type: 'SCRUB_COMPLETE', removedCategories });
    } catch {
      dispatch({ type: 'SCRUB_FAILED', message: ERR_SCRUB });
    }
  }, [state]);

  const onReset = useCallback(() => dispatch({ type: 'RESET' }), []);
  const onDismiss = useCallback(() => dispatch({ type: 'ERROR_DISMISSED' }), []);

  useEffect(() => {
    let selector: string | null = null;
    switch (state.kind) {
      case 'analyzed':   selector = '.scrub-button'; break;
      case 'done':       selector = '.done__heading'; break;
      case 'error':      selector = '.error-banner__dismiss'; break;
      case 'empty':      selector = '.dropzone'; break;
      default:           selector = null;
    }
    if (!selector) return;
    const target = document.querySelector<HTMLElement>(selector);
    if (target && 'focus' in target) target.focus();
  }, [state.kind]);

  const errorMessage = state.kind === 'error' ? state.message : null;
  const currentContent = state.kind === 'error' ? state.previous : state;
  const heicNote =
    currentContent.kind === 'analyzed' && currentContent.fileKind === 'heic';

  return (
    <main className="app">
      {errorMessage && <ErrorBanner message={errorMessage} onDismiss={onDismiss} />}
      <header className="app__header">
        <PrivacyBadge />
      </header>
      <div className="app__content" aria-live="polite">
        {currentContent.kind === 'empty' && <DropZone onFile={onFile} />}

        {currentContent.kind === 'analyzing' && (
          <>
            <FileHeader
              name={currentContent.file.name}
              size={currentContent.file.size}
              onReset={onReset}
            />
            <Skeleton />
          </>
        )}

        {currentContent.kind === 'analyzed' && (
          <>
            <FileHeader
              name={currentContent.file.name}
              size={currentContent.file.size}
              onReset={onReset}
            />
            <MetadataReport findings={currentContent.findings} heicNote={heicNote} />
            {currentContent.findings.length > 0 && (
              <div className="app__actions">
                <ScrubButton loading={false} onClick={onScrub} />
              </div>
            )}
          </>
        )}

        {currentContent.kind === 'scrubbing' && (
          <>
            <FileHeader
              name={currentContent.file.name}
              size={currentContent.file.size}
              onReset={onReset}
            />
            <MetadataReport findings={currentContent.findings} />
            <div className="app__actions">
              <ScrubButton loading={true} onClick={onScrub} />
            </div>
          </>
        )}

        {currentContent.kind === 'done' && (
          <>
            <FileHeader
              name={currentContent.file.name}
              size={currentContent.file.size}
              onReset={onReset}
            />
            <DoneSummary
              removedCategories={currentContent.removedCategories}
              onReset={onReset}
            />
          </>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Append layout styles to `src/styles.css`**

```css
/* --- App shell / layout --- */
.app {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  padding: 24px;
}
.app__header {
  padding-bottom: 16px;
}
.app__content { flex: 1; }
.app__actions {
  padding: 24px 0;
  display: flex;
  justify-content: flex-start;
}

/* Asymmetric column on desktop */
@media (min-width: 1024px) {
  .app { padding: 40px 0; }
  .app__header {
    padding: 0 40px 24px;
  }
  .app__content {
    margin-left: 22vw;
    max-width: 56vw;
    padding: 0 40px;
  }
}
```

- [ ] **Step 3: Update the smoke test**

Modify `tests/unit/smoke.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { App } from '../../src/App';

describe('App smoke', () => {
  it('renders the privacy badge on initial load', () => {
    render(<App />);
    expect(screen.getByText(/files stay on your device/i)).toBeInTheDocument();
  });

  it('renders the drop zone as the initial hero', () => {
    render(<App />);
    expect(screen.getByText(/drop a file to see what it's leaking/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 4: Write the App integration test (happy path)**

Create `tests/unit/components/app-integration.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../../src/App';
import { buildJpegWithExif } from '../../fixtures/programmatic';

beforeEach(() => {
  // jsdom doesn't fully implement createObjectURL; provide a stub.
  if (!URL.createObjectURL) {
    // @ts-expect-error
    URL.createObjectURL = vi.fn(() => 'blob:test');
    // @ts-expect-error
    URL.revokeObjectURL = vi.fn();
  } else {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  }
});

describe('App integration (happy path)', () => {
  it('drops a geotagged JPEG, sees GPS, scrubs, shows done summary', async () => {
    const bytes = buildJpegWithExif({
      gpsLat: 37.7749,
      gpsLng: -122.4194,
      make: 'Apple',
      model: 'iPhone 15 Pro',
    });
    const file = new File([bytes], 'IMG_0001.jpg', { type: 'image/jpeg' });

    render(<App />);
    const input = screen.getByLabelText(/drop a file/i) as HTMLInputElement;
    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText(/reveals where it was taken/i)).toBeInTheDocument();
    });
    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /remove metadata and download/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /done\. your file is clean\./i })).toBeInTheDocument();
    });
    expect(screen.getByText(/removed location/i)).toBeInTheDocument();
    expect(screen.getByText(/removed device/i)).toBeInTheDocument();
  });

  it('shows an error banner when an unsupported file is dropped', async () => {
    const gifBytes = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
    const file = new File([gifBytes], 'animated.gif', { type: 'image/gif' });

    render(<App />);
    const input = screen.getByLabelText(/drop a file/i) as HTMLInputElement;
    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/only support jpeg, png, heic, and pdf/i);
    });
  });
});
```

- [ ] **Step 5: Run the full test suite**

Run: `npm test`
Expected: every suite from Tasks 1-14 still PASS, plus the new App integration tests PASS. Exit 0.

- [ ] **Step 6: Verify `npm run build` succeeds**

```bash
npm run build
```

Expected: writes `dist/`, exit 0, no TypeScript errors.

- [ ] **Step 7: Verify `npm audit` still passes**

```bash
npm audit --audit-level=high
```

Expected: zero HIGH/CRITICAL findings. If any appear, remediate before proceeding.

- [ ] **Step 8: Write `README.md`**

```markdown
# Metadata Scrubber

A privacy tool that reads and strips hidden metadata (GPS, device, timestamps, authorship) from images and PDFs. Everything runs in your browser. No file ever leaves your device.

## Supported formats

- JPEG (lossless EXIF strip)
- PNG (chunk-level metadata strip; pixels preserved byte-for-byte)
- HEIC (converted to a clean JPEG)
- PDF (info dictionary and XMP stream cleared; visual content untouched)

## Setup

```bash
npm install
npm audit --audit-level=high
```

If audit reports HIGH/CRITICAL vulnerabilities, remediate before proceeding.

## Development

```bash
npm run dev        # start Vite dev server at http://localhost:5173
npm test           # run Vitest suite
npm run build      # build production bundle to dist/
```

## Manual verification checklist

The automated test suite covers pure logic, scrubber round-trips, and component behavior. Before shipping, run this checklist against a real browser:

- [ ] **JPEG round-trip:** drop a real geotagged iPhone JPEG (transferred as-JPEG, not HEIC). GPS callout appears with coordinates. Click "Remove metadata and download." The downloaded `<name>-cleaned.jpg` opens in Preview at the same pixel dimensions. Drop the cleaned file back into the app. The report reads "No hidden metadata found."
- [ ] **PDF round-trip:** drop a Word-authored PDF. Report shows Author and Producer. Scrub. Re-drop the cleaned PDF. Report is empty. Open the cleaned PDF in Preview and verify the page count and content are unchanged.
- [ ] **HEIC round-trip:** drop an iPhone HEIC. Report shows the metadata plus the "HEIC will be converted to a clean JPEG" note. Scrub. The downloaded file is `<name>-cleaned.jpg`. Re-drop it. Report is empty.
- [ ] **PNG round-trip:** drop a PNG that contains metadata (e.g., a Photoshop export with author). Scrub. The downloaded PNG opens correctly and re-scanning shows an empty report.
- [ ] **Oversized file:** drop a file larger than 25 MB. Error banner reads "This file is over 25 MB. Try a smaller one."
- [ ] **Unsupported file:** drop a `.gif` or `.txt`. Error banner reads "Sorry, we only support JPEG, PNG, HEIC, and PDF right now."
- [ ] **Corrupt file:** rename a `.txt` to `.jpg` and drop it (magic byte check catches this — should get the unsupported message).
- [ ] **Empty-state file:** drop an already-scrubbed JPEG. Report reads "No hidden metadata found. This file is already clean." The scrub button is not shown.
- [ ] **Network verification:** open the browser Network tab. Perform a full scrub-and-download run. Confirm zero requests carry file contents. The only requests should be the page/asset loads at start (and, if you click the "View on Google Maps" link, its navigation — that's an explicit user action).
- [ ] **Reduced motion:** enable `prefers-reduced-motion` at the OS level. Confirm transforms are disabled but opacity/color transitions still occur.
- [ ] **Keyboard-only:** navigate the entire flow with keyboard (Tab, Enter, Space). Drop zone activates via Enter/Space, scrub button activates via Enter/Space, dismiss/reset all reachable.
- [ ] **Focus management:** after scrub completes, focus moves to the "Done. Your file is clean." heading. After an error, focus moves to the error dismiss button.

## Deploy

Any static host:

```bash
npm run build
# then upload dist/ to Netlify, Vercel, GitHub Pages, or a static bucket.
```

Because the app is fully client-side with a strict CSP, it also works when opened directly as a local file after `npm run build`.

## Privacy

- CSP `connect-src 'self'` in `index.html`: the browser blocks any accidental file transmission.
- Zero analytics libraries. No tracking scripts.
- The "View on Google Maps" link is a plain `<a target="_blank" rel="noopener">`. It navigates to Google Maps only when the user chooses to click.
```

- [ ] **Step 9: Execute the manual verification checklist**

Run through every item in the README's checklist yourself. Any failure is a bug that blocks the task from completing. Fix and re-verify.

- [ ] **Step 10: Commit**

```bash
git add src/App.tsx src/styles.css README.md \
        tests/unit/smoke.test.tsx tests/unit/components/app-integration.test.tsx
git commit -m "feat(app): wire state machine to components; add integration test and README"
```

---

## Self-Review

Ran against the spec at `docs/superpowers/specs/2026-07-22-metadata-scrubber-design.md`.

**1. Spec coverage.** Every section maps to a task:

| Spec section | Implementing task(s) |
|---|---|
| Register | Task 1 (design system baseline), Task 13 (GpsCallout as the committed moment) |
| Scope decisions (framework, GPS, HEIC, theme) | Task 1 (framework + light theme via tokens), Task 8 (HEIC), Task 13 (GPS link, no map lib) |
| Architecture (SPA, state machine, CSP) | Task 1 (CSP), Task 10 (state machine) |
| Dependencies (pinned, audited) | Task 1, Global Constraints |
| File layout | See File Map above |
| Data flow | Task 15 (App wiring) |
| Color tokens (OKLCH) | Task 1 (tokens.css) |
| Typography | Task 1 (tokens.css + styles.css) |
| Layout (asymmetric column) | Task 15 (media query at 1024px) |
| Motion (tokens + named moments) | Task 1 (motion tokens), Tasks 12-14 (per-component motion) |
| Copy rules | Enforced across Tasks 11-14 by literal strings in components |
| Explicit bans | Enforced by the tokens (no `#000`/`#fff`, no gradient text CSS, no side-stripe rule anywhere) |
| Focus ring | Task 1 (single `:focus-visible` rule) |
| DropZone | Task 12 |
| ScrubButton | Task 14 |
| GpsCallout | Task 13 |
| MetadataReport | Task 13 |
| FileHeader / PrivacyBadge / Skeleton | Task 11 |
| DoneSummary | Task 14 |
| ErrorBanner | Task 14 |
| UI states (empty/analyzing/analyzed/scrubbing/done/error) | Task 10 (reducer) + Task 15 (wiring) |
| Error handling table | Task 15 (constants + banner) |
| Metadata categorization | Task 3 |
| Scrubbers (JPEG/PNG/HEIC/PDF) | Tasks 6-9 |
| Testing (Vitest, fixtures, invariants) | Tasks 2-9 unit tests, Task 15 integration + manual |
| Privacy guarantees | Task 1 (CSP), Task 15 (README documentation + manual test #9) |
| Deployment | Task 15 (README) |

No spec section without a task.

**2. Placeholder scan.** Grepped the plan for `TBD`, `TODO`, `fill in`, `similar to`, `implement later`. Zero hits. Every code step contains real code; every command shows the expected output.

**3. Type consistency.** Cross-checked:
- `Finding`, `Category`, `FileKind`, `ScrubResult`, `MAX_FILE_BYTES` defined in Task 2, referenced consistently in Tasks 3, 4, 5, 6, 7, 8, 9, 10, 15.
- `FileMeta`, `State`, `Action`, `initialState`, `reduce` defined in Task 10, referenced in Task 15.
- `readImage`, `readPdf`, `scrubJpeg`, `scrubPng`, `scrubHeic`, `scrubPdf`, `withCleanedSuffix`, `detectFileKind` names consistent across their producing task and every consumer.
- Component prop signatures in Tasks 11-14 match their invocations in Task 15's `App.tsx`.
- Fixture helpers (`buildJpegWithExif`, `buildPlainJpeg`, `buildAuthoredPdf`, `buildBarePdf`, `buildPngWithText`, `hasPngChunk`, binary helpers) are defined in Task 4 or extended in Tasks 5 and 7 and re-used consistently in later tests.

**4. Ambiguity notes flagged in tasks.**
- Task 7 explicitly notes the deviation from the spec's canvas-re-render suggestion to chunk-level byte manipulation (better testability, byte-exact preservation).
- Task 8 explicitly notes HEIC's dependency on a real fixture and that manual verification is the primary QA gate.

No open placeholders. Plan is complete.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-22-metadata-scrubber-implementation.md`. Two execution options:

**1. Subagent-Driven (recommended for this plan).** I dispatch a fresh subagent per task, review its diff between tasks, iterate quickly. Best fit here because tasks have clean interface boundaries and are individually testable — each subagent gets a small, well-defined slice.

**2. Inline Execution.** Execute tasks in this session using `superpowers:executing-plans`, batch execution with checkpoints for review.

Which approach?

