# Metadata Scrubber, MVP Design

**Date:** 2026-07-22
**Source:** `metadata-scrubber-PRD.md`
**Status:** Approved architecture; visual system folded in from `emil-design-eng` and `impeccable` reviews.

---

## Summary

A single-page, fully client-side web app that lets a non-technical user drop in an image or PDF, see the hidden metadata it leaks (GPS, device, timestamps, authorship), and download a cleaned copy. No backend. No file ever leaves the browser, enforced by CSP.

Success bar: usable end-to-end in under 30 seconds, cleaned files verifiably free of the metadata shown, and the GPS reveal lands emotionally on first sight.

## Register

**Product surface with one brand-register moment.** The interface serves a task (user is here to clean a file, not to be marketed at), so the shell is quiet, familiar, and Restrained. The GPS callout is the single Committed moment where color and motion carry meaning. Every other element defers to it.

## Scope decisions (locked)

| Decision | Choice | Rationale |
|---|---|---|
| Framework | Vite + React + TypeScript | Cleanly models three UI states; typed metadata objects; still ships as a static bundle. |
| GPS display | Coordinates + "View on Google Maps" link | Preserves the "nothing leaves your device" story. Zero outbound requests until the user chooses to click. |
| HEIC handling | Read metadata; scrub by converting to clean JPEG | Preserves the value prop (iPhone photos are the highest-signal case for GPS) at the cost of format. UI labels the conversion clearly. |
| Theme | Light only for MVP | Scene sentence: *"A privacy-conscious person on their laptop, mid-workday, opens a URL a friend shared and drops in a photo they were about to text."* Trust reads light for a stranger's tool used once. Dark reads insider/developer, wrong signal for the target user. |

Non-goals restated from PRD: no accounts, no backend, no batch processing, no Office documents, no cloud, no mobile app, no dark mode.

## Architecture

Single-page Vite + React + TypeScript app, deployed as a static bundle. Three UI states driven by one reducer:

```
empty -> analyzing -> analyzed -> scrubbing -> done
                        |                        |
                      error <- - - - - - - - - - -
```

All file bytes stay in memory. No `fetch`/`XHR` ever touches file contents. Enforced at the browser level by:

```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self'; connect-src 'self';
               img-src 'self' data: blob:;
               style-src 'self' 'unsafe-inline'">
```

## Dependencies (exact versions pinned at install time)

- `exifr` for reading EXIF/IPTC/XMP/GPS from JPEG, PNG, HEIC
- `piexifjs` for lossless EXIF strip on JPEG
- `pdf-lib` for reading and clearing PDF info dict and XMP metadata
- `heic2any` for HEIC to JPEG conversion in-browser
- `react`, `react-dom`
- `vite`, `typescript`, `@vitejs/plugin-react`
- `vitest`, `@testing-library/react`, `jsdom` (dev)

Zero analytics libraries. Zero map libraries.

Per user global instructions: verify latest stable via `npm view <pkg> dist-tags.latest` before installing, use exact versions (no `^`/`~`), no `-rc`/`-alpha`/`-beta`, run `npm audit --audit-level=high` after install and fix high/critical before app code.

## File layout

```
src/
  App.tsx                        # State machine + layout shell
  state.ts                       # Reducer: empty | analyzing | analyzed | scrubbing | done | error
  tokens.css                     # OKLCH color tokens, type scale, motion tokens, spacing
  styles.css                     # Component styles; imports tokens.css
  components/
    DropZone.tsx                 # Drag-drop + file picker (empty state)
    FileHeader.tsx               # Filename + size + reset (analyzed/done states)
    MetadataReport.tsx           # Grouped findings (analyzed state)
    GpsCallout.tsx               # The one Committed moment
    ScrubButton.tsx              # One-click scrub with in-place loading
    DoneSummary.tsx              # "Removed: location, device, timestamps."
    ErrorBanner.tsx              # Corrupt / unsupported / oversized
    PrivacyBadge.tsx             # Persistent header note
    Skeleton.tsx                 # Analyzing/scrubbing placeholders
  lib/
    detect.ts                    # Sniff file type by magic bytes
    read/
      image.ts                   # exifr -> normalized Finding[]
      pdf.ts                     # pdf-lib -> normalized Finding[]
    scrub/
      jpeg.ts                    # piexifjs.remove
      png.ts                     # canvas re-render (drops ancillary chunks)
      heic.ts                    # heic2any -> JPEG bytes, then jpeg.ts
      pdf.ts                     # pdf-lib clear info dict + XMP
    categorize.ts                # Raw fields -> {Location, Device, Timestamps, Identity, Other}
    types.ts                     # Finding, Category, FileKind, ScrubResult
tests/
  fixtures/                      # Real sample files for round-trip tests
  unit/                          # Vitest specs
index.html                       # CSP meta tag
```

**Boundary rationale:** `read/*` and `scrub/*` are pure `(bytes) -> result` functions. Trivially testable, swappable per file type. UI knows nothing about EXIF or PDF internals; it consumes a normalized `Finding[]` and calls `scrub(bytes, kind)`.

## Data flow

```
File drop
  -> detect.ts (magic bytes -> FileKind)
  -> read/<kind>.ts (bytes -> raw metadata)
  -> categorize.ts (raw -> Finding[] grouped by Category)
  -> MetadataReport renders

User clicks scrub
  -> scrub/<kind>.ts (bytes -> ScrubResult)
  -> download via Blob + <a download>
  -> DoneSummary renders
```

---

## Design system

### Color

**Strategy:** Restrained overall, one Committed moment on the GPS callout. OKLCH only. Never `#000` or `#fff`. Every neutral tinted toward a single cool hue at chroma ~0.008 to feel clean and clinical rather than warm and consumer.

Tokens live in `tokens.css` as CSS custom properties:

```css
:root {
  /* Neutrals, cool-biased single-hue axis (h ~ 250) */
  --surface:      oklch(0.99 0.005 250);   /* page background */
  --surface-2:    oklch(0.97 0.006 250);   /* subtle recess (drop zone rest state) */
  --surface-3:    oklch(0.94 0.008 250);   /* borders, dividers */
  --ink-3:        oklch(0.62 0.010 250);   /* tertiary text (labels, captions) */
  --ink-2:        oklch(0.42 0.012 250);   /* secondary text (values, body) */
  --ink-1:        oklch(0.22 0.014 250);   /* primary text (headings, data) */
  --ink-0:        oklch(0.15 0.014 250);   /* max contrast (used sparingly) */

  /* Accent, one color, ~10% surface coverage */
  --accent:       oklch(0.62 0.14 145);    /* considered green */
  --accent-hover: oklch(0.55 0.15 145);
  --accent-ink:   oklch(0.99 0.01 145);    /* text on accent */

  /* Committed moment: GPS callout only */
  --warn-bg:      oklch(0.96 0.04 30);     /* warm tinted background */
  --warn-border:  oklch(0.85 0.10 30);
  --warn-ink:     oklch(0.42 0.14 30);     /* body copy inside callout */
  --warn-strong:  oklch(0.32 0.16 30);     /* heading inside callout */

  /* Focus */
  --focus-ring:   var(--accent);
}
```

Accent is used for: the scrub button surface, focus rings, the "View on Google Maps" link, and the done-state check icon color. Nowhere else.

**Warn tokens are used ONLY inside `GpsCallout`.** No warning stripes, no red anywhere else, no error borders on the error banner. The error banner uses neutrals plus a subtle top-border in `--ink-2`.

### Typography

- **Family:** `-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", system-ui, sans-serif`. One family, no display pairing.
- **Fixed rem scale**, ratio ~1.2:

  ```css
  --text-xs:  0.75rem;   /* 12px, captions, small labels */
  --text-sm:  0.875rem;  /* 14px, body small, field values */
  --text-md:  1rem;      /* 16px, body */
  --text-lg:  1.125rem;  /* 18px, category headings */
  --text-xl:  1.5rem;    /* 24px, page title */
  --text-2xl: 2rem;      /* 32px, GPS callout heading */
  ```

- **Weights:** 400 body, 500 UI labels, 600 headings. No weight below 400.
- **Line height:** 1.5 body, 1.25 headings.
- **Data uses `font-variant-numeric: tabular-nums`.** GPS coordinates, timestamps, file sizes.
- **Category labels use `letter-spacing: 0.02em; text-transform: uppercase; font-size: var(--text-xs); font-weight: 500`.** Considered/utilitarian personality without display fonts.
- No fluid/clamp headings.
- Body line length capped at 65ch.

### Layout

- **Flow layout, not card grids.** The metadata report is a vertical list of category sections separated by 1px dividers in `--surface-3`. No card enclosures.
- **Exactly one card element on the page:** `GpsCallout`. Its isolation is what makes it read as important.
- **Asymmetric column choice for identity.** On viewports ≥1024px, the report column is offset from left: content lives in a column that starts at 22% from the left edge and spans ~56%. Header row (privacy badge left, file header right) spans full width above. Below 1024px, content centers with normal padding.
- **No nested containers.** The report is not inside a card that is inside a page container. Section, dividers, done.
- **Spacing rhythm:** vary spacing per section importance. Category sections get 32px vertical padding; the GPS callout gets 40px above and 32px below. Same padding everywhere reads as monotony.

### Motion

Tokens in `tokens.css`:

```css
:root {
  --ease-out:    cubic-bezier(0.22, 1, 0.36, 1);   /* ease-out-quart, default */
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);   /* on-screen morphs */

  --dur-fast:   140ms;   /* button press, hover */
  --dur-base:   200ms;   /* error banner, tooltip */
  --dur-slow:   240ms;   /* state reveals (report enter) */
  --dur-hero:   280ms;   /* GPS callout, done crossfade */
}
```

**Property discipline.** Only `transform`, `opacity`, and `filter` animate. Never `width`, `height`, `padding`, `margin`, or CSS layout properties. Height changes are handled by `translateY` + opacity crossfade, not animated height.

**CSS transitions over keyframes** for any interruptible element (drop zone drag-over, button state changes).

**Named motion moments:**

| Moment | Treatment |
|---|---|
| Button press (`:active`) | `transform: scale(0.97)`, `--dur-fast`, `--ease-out`. Applies to scrub button, reset, dismiss, download link. |
| Drop zone drag-over | Border tightens (surface-3 to ink-3), background lifts (surface to surface-2), `transform: scale(1.005)`, `filter: brightness(1.02)`, `--dur-fast`, `--ease-out`. Reverses in `--dur-base` on drag-leave. |
| Empty to analyzing | Drop zone crossfades out; skeleton crossfades in with `filter: blur(2px)` bridging the two, `--dur-base`, `--ease-out`. |
| Analyzing to analyzed | Skeleton crossfades to real report. Findings categories stagger in with 40ms delay each, `opacity: 0 -> 1` + `translateY(4px -> 0)`, `--dur-slow`, `--ease-out`. |
| GPS callout entrance | Enters 80ms after report has settled: `opacity: 0 -> 1` + `transform: scale(0.97 -> 1)`, `transform-origin: top left`, `--dur-hero`, `--ease-out`. On complete, a single 400ms `filter: brightness(1.08 -> 1)` pulse (once, never loops). |
| Analyzed to scrubbing | Scrub button label swaps to "Scrubbing..." + inline spinner; button becomes `aria-disabled="true"`, `cursor: not-allowed`. No page overlay. |
| Scrubbing to done | Report + button crossfade out with `filter: blur(2px)` bridge; DoneSummary crossfades in with `scale(0.98 -> 1)`, `--dur-hero`, `--ease-out`. Total 280ms. |
| Removed-category rows in DoneSummary | Stagger in 60ms apart. Checkmark scales `0.5 -> 1` in 120ms after its label appears. |
| Error banner enter | `translateY(-8px -> 0)` + `opacity`, `--dur-base`, `--ease-out`. |
| Error banner exit | `--dur-fast`, `--ease-out`. Faster than enter. |

**Accessibility overrides:**

```css
@media (prefers-reduced-motion: reduce) {
  * {
    transition-duration: 120ms !important;
    animation-duration: 120ms !important;
  }
  /* transforms disabled; opacity + color transitions kept for comprehension */
}
```

**Hover gating:**

```css
@media (hover: hover) and (pointer: fine) {
  /* all :hover rules live inside this query */
}
```

### Copy rules

- **No em-dashes and no `--` in shipped strings.** Use commas, colons, semicolons, periods, or parentheses.
- Every word earns its place. No restated headings, no intros that repeat the title.
- Concrete, not abstract. Ship *"Removed: location, device, timestamps."* not *"We've successfully scrubbed the metadata categories that were detected in your file."*
- Privacy badge text: *"Files stay on your device. Nothing is uploaded."* Not: *"Your privacy is important..."*
- GPS callout heading: *"This photo reveals where it was taken."* Period, not em-dash.
- Empty state: *"Drop a file to see what it's leaking."* Teaches the interface, not "nothing here."

### Explicit bans (project-specific)

Restating so no implementer drifts into them:

- **No side-stripe borders.** The GPS callout uses a full-tint background (`--warn-bg`) with a full 1px border in `--warn-border`, never a left-edge accent bar.
- **No gradient text.** No `background-clip: text`. Emphasis is weight + size.
- **No glassmorphism.** No backdrop blur on cards. Blur is only used as a 200ms bridge during crossfade transitions.
- **No hero-metric templates.** Big-number-with-small-label is banned; the file card shows filename + size in a quiet row.
- **No identical card grids.** Categories are section rows, not cards. The one card is the GPS callout.
- **No modal as first thought.** Errors, confirmations, and progress happen inline. No modals in MVP.
- **No lock icons, shield icons, or "encrypted" language.** Privacy is communicated in plain text.
- **No monospace anywhere except GPS coordinate numerals.** Not for filenames, not for anything else.

## Component specs

Every interactive component ships all seven states: default, hover, focus, active, disabled, loading, error (where applicable). Missing states are ship blockers.

### Focus ring

One token, applied consistently:

```css
:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
  border-radius: 4px;
}
```

Never remove outlines without replacement. Never use browser defaults.

### DropZone

- Structure: `<label>` wrapping a visually-hidden `<input type="file">`. Keyboard and screen readers work for free.
- States:
  - **default:** `--surface-2` background, 2px dashed `--surface-3` border, `--ink-3` instruction text.
  - **hover:** border to `--ink-3`, background to `--surface-2` (same, slight brightness lift via filter).
  - **focus:** focus ring per token.
  - **active/drag-over:** border to `--ink-2`, background lifts, subtle scale (see motion).
  - **disabled:** N/A (only visible in empty state).
- One instruction line: *"Drop a file to see what it's leaking."* Below in `--text-xs` `--ink-3`: *"JPEG, PNG, HEIC, PDF. Up to 25 MB."*
- No lock icon. No shield. No decorative art.

### ScrubButton

- Primary accent button. `--accent` background, `--accent-ink` text, `font-weight: 500`.
- States:
  - **default:** `--accent`.
  - **hover:** `--accent-hover`.
  - **focus:** focus ring.
  - **active:** `transform: scale(0.97)`.
  - **disabled:** `--surface-3` background, `--ink-3` text, `cursor: not-allowed`, `aria-disabled="true"`.
  - **loading:** inline spinner + label swap to *"Scrubbing..."*, disabled treatment applied.
- Label: *"Remove metadata and download"*.

### GpsCallout (the one Committed moment)

- Full-tint card: `--warn-bg` background, 1px `--warn-border`, 8px border-radius.
- **No left-edge stripe. No border-left. Full border only.**
- Heading in `--warn-strong`, body in `--warn-ink`.
- Layout: heading, then coord rows with tabular-nums, then "View on Google Maps" link styled as a text link in `--warn-strong` with underline on hover.
- Warning glyph (unicode `⚠`) inline before heading, `--warn-strong`, no icon library needed.
- Entrance motion per motion section.

### MetadataReport

- Vertical flow. Each category is a section:
  - Uppercase micro-label ("LOCATION", "DEVICE", etc.) in the letter-spaced style.
  - Rows below: label on left in `--ink-2`, value on right in `--ink-1` with tabular-nums for anything numeric.
- 1px dividers in `--surface-3` between categories, 32px vertical padding per section.
- Empty state (no findings): single paragraph in `--ink-2`: *"No hidden metadata found. This file is already clean."* No table.

### FileHeader

- Row: filename in `--ink-1` `--text-md`, size in `--ink-3` `--text-sm` with tabular-nums, reset link on far right ("Start over") in `--ink-2`.
- No card enclosure.

### Skeleton

- Used during `analyzing` and `scrubbing`.
- Low-fidelity outline of the report shape: 5 horizontal bars in `--surface-2`, 16px tall, staggered widths (75%, 40%, 60%, 30%, 55%). No shimmer animation, just static presence.
- Preserves layout, communicates "something is happening," prevents jank on real-report swap.

### ErrorBanner

- Sticky at top of viewport when active. Full-width neutral surface (`--surface-2`), top border in `--ink-2`, no red.
- Text in `--ink-1`. Dismiss (`×`) on right in `--ink-2`.
- `role="alert"`, `aria-live="assertive"`.
- Enter/exit per motion section.
- Four messages:
  - Unsupported: *"Sorry, we only support JPEG, PNG, HEIC, and PDF right now."*
  - Oversized: *"This file is over 25 MB. Try a smaller one."*
  - Parse error: *"We couldn't read this file. It may be corrupt or password protected."*
  - No metadata: not shown here (handled in report empty state).

### PrivacyBadge

- Persistent header element, left side.
- Text: *"Files stay on your device. Nothing is uploaded."*
- `--ink-3` `--text-xs`. No icon. No color.

### DoneSummary

- Heading: *"Done. Your file is clean."* in `--ink-1` `--text-lg`.
- Below: list of removed categories, each row with a check glyph in `--accent`, category name in `--ink-2`. Stagger in per motion section.
- Reset action: *"Scrub another file"* as a text link in `--accent`.

## UI states

**Empty.** Full-viewport drop zone, header row above (PrivacyBadge left, nothing right). Single instruction line, quiet.

**Analyzing.** Drop zone gone. FileHeader visible. Skeleton in place of report.

**Analyzed.** FileHeader + full MetadataReport. GpsCallout at top of the report region when Location findings exist. ScrubButton below the report as a prominent CTA.

**Scrubbing.** Same layout as analyzed. ScrubButton switches to loading treatment. Rest of page dims very slightly (`opacity: 0.85`) to focus attention on the button.

**Done.** DoneSummary replaces the report region via the crossfade motion. FileHeader retained; reset link ("Start over") in FileHeader now shares purpose with the "Scrub another file" link in DoneSummary.

**Error.** ErrorBanner overlays whatever state is current. User dismisses or fixes and continues.

Responsive down to mobile (asymmetric column collapses to centered content at <1024px). Keyboard accessible throughout. State transitions announce via `aria-live` regions (report region uses `polite`; ErrorBanner uses `assertive`). Focus moves to report heading after analysis, to download button after scrub is available, to DoneSummary heading after scrub completes.

## Error handling

Detection uses **magic bytes**, not extension:
- `FFD8FF` = JPEG
- `89504E47` = PNG
- `ftypheic`, `ftypheix`, `ftypmif1`, or `ftyphevc` at offset 4 = HEIC
- `25504446` = PDF

| Trigger | Message |
|---|---|
| Unsupported MIME / magic bytes | *"Sorry, we only support JPEG, PNG, HEIC, and PDF right now."* |
| File > 25 MB | *"This file is over 25 MB. Try a smaller one."* |
| Parse/scrub throws | *"We couldn't read this file. It may be corrupt or password protected."* |
| No metadata found on read | Not an error. Friendly empty state inside the report. |

## Metadata categorization

Deterministic mapping in `lib/categorize.ts`:

| Category | Fields |
|---|---|
| **Location** | `GPSLatitude`, `GPSLongitude`, `GPSAltitude`, `GPSDateStamp`, any `GPS*` |
| **Device** | `Make`, `Model`, `LensMake`, `LensModel`, `Software` |
| **Timestamps** | `DateTimeOriginal`, `CreateDate`, `ModifyDate`, PDF `CreationDate`, `ModDate` |
| **Identity / Author** | `Artist`, `Copyright`, `OwnerName`, `HostComputer`, PDF `Author`, `Creator`, `Producer`, `Title`, XMP `dc:creator`, `xmp:CreatorTool` |
| **Other** | Everything else non-empty |

`Finding` shape: `{ category: Category, label: string, value: string, rawKey: string }`. `label` is human-readable ("Camera model"); `rawKey` is preserved for a possible future "show technical names" toggle.

## Scrubbers

Each scrubber returns `{ bytes: Uint8Array, outputName: string, outputMime: string }`.

**JPEG.** `piexif.remove(dataURL)` strips APP1/EXIF, IPTC, XMP losslessly (no pixel re-compression). Output: `<name>-cleaned.jpg`.

**PNG.** Draw decoded image to `<canvas>` and export via `canvas.toBlob('image/png')`. Ancillary metadata chunks (`tEXt`, `iTXt`, `eXIf`) dropped. PNG is lossless so re-encoding preserves fidelity. Output: `<name>-cleaned.png`.

**HEIC.** `heic2any({ blob, toType: 'image/jpeg', quality: 0.95 })`, then run the JPEG scrubber on the result to guarantee no EXIF survives conversion. UI labels the conversion **before** the user clicks scrub, using this string in the analyzed state when the file is HEIC: *"HEIC will be converted to a clean JPEG."* Output: `<name>-cleaned.jpg`.

**PDF.** `PDFDocument.load(bytes)` then clear `Title`, `Author`, `Subject`, `Keywords`, `Creator`, `Producer`, `CreationDate`, `ModDate` on the info dict; remove `/Metadata` (XMP) stream from the catalog if present. Save with `useObjectStreams: false`. Visual content untouched. Output: `<name>-cleaned.pdf`.

**Download.** `URL.createObjectURL(blob)` then hidden `<a download>` then click then `URL.revokeObjectURL` after 60s. No third-party helper.

## Testing

**Automated (Vitest + jsdom):**
- `lib/detect.ts` fixtures per format + one wrong-extension case.
- `lib/categorize.ts` snapshot: raw exifr output to categorized `Finding[]`.
- `lib/scrub/*.ts` round-trip per format: bytes -> scrub -> re-read -> assert Location/Device/Identity findings all empty.

**Fixtures in `tests/fixtures/`:**
- `geotagged.jpg` (real iPhone photo with GPS)
- `plain.png` (with `tEXt` chunks)
- `iphone.heic` (small HEIC)
- `authored.pdf` (Word-exported PDF with Author/Producer set)
- `clean.jpg` (already-scrubbed file, empty-state case)
- `corrupt.jpg` (truncated bytes)

**Invariants asserted:**
1. Cleaned file re-scanned: zero findings in Location, Device, Identity.
2. Image `width × height` unchanged.
3. PDF page count unchanged; page 1 text extraction identical to source.

**Manual verification (mirrors PRD Success Criteria, run once before ship):**
1. Real iPhone JPEG in, GPS visible, scrub, re-drop: Location empty.
2. Word-exported PDF in, Author/Producer visible, scrub, re-drop: all cleared.
3. Cleaned image opens in Preview, looks pixel-identical.
4. Browser network tab open through a full run: zero requests carrying file data. Only page load and (if clicked) the Google Maps link.

## Privacy guarantees, enforced

- CSP `connect-src 'self'` in `index.html`: browser blocks any accidental outbound file transmission.
- Zero analytics libraries in `package.json`.
- Persistent `PrivacyBadge` in plain English.
- Manual test 4 verifies the network claim.

## Deployment

Static bundle from `vite build`. Deployable to Netlify, Vercel, GitHub Pages, or opened as a local `file://`. README documents `npm install`, `npm run dev`, `npm run build`.

## Out of scope (explicit)

- Office document support (DOCX/XLSX/PPTX).
- Batch processing / folder scrub.
- Before/after per-field diff view.
- Watermark or redaction tools.
- Any form of accounts, backend, or cloud sync.
- Dark mode.
- Native mobile.
