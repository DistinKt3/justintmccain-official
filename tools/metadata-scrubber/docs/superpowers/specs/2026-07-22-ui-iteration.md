# UI Iteration — Metadata Scrubber

**Date:** 2026-07-22
**Base:** working v0.1 (commit `408b53a`)
**Scope:** UI-only. No behavior changes, no new deps, no new features, no bundle regression.

## What this iteration is for

The app works. It's terse, correct, and forgettable. This pass makes it feel like it was designed for a person, not a spec — while staying inside the design system we already committed to (OKLCH tokens, one font family, Restrained + one Committed moment on the GPS callout, no decorative graphics).

We spend our boldness in one place: **the GPS reveal**. Everything else is quiet and consistent.

## Design constraints (unchanged)

- One family, system stack. No display pairing.
- Only `transform` / `opacity` / `filter` animate.
- OKLCH tokens only. Warn tokens scoped to `GpsCallout`.
- No side stripes, no gradient text, no glassmorphism, no hero-metric templates, no card grids, no icons (lock/shield/etc.), no monospace outside GPS coordinates.
- Hover gated by `@media (hover: hover) and (pointer: fine)`. `prefers-reduced-motion` respected.
- No em-dashes in shipped strings.

## Six moves

### 1. Copy pass — every string, human and direct

Rewrite every user-visible string so it reads like a friend showing you something, not a compliance page. Cut apologies from errors. Reframe the GPS leak as personal memory the photo is holding, not a technical exposure.

| Where | Before | After |
|---|---|---|
| PrivacyBadge | Files stay on your device. Nothing is uploaded. | Nothing leaves this tab. |
| DropZone prompt | Drop a file to see what it's leaking. | Drop a photo. See what it says about you. |
| DropZone hint | JPEG, PNG, HEIC, PDF. Up to 25 MB. | JPEG, PNG, HEIC, or PDF. Up to 25 MB. |
| Empty state supporting line (new) | (none) | Under 30 seconds. |
| GpsCallout heading | This photo reveals where it was taken. | This photo remembers where you were. |
| MetadataReport empty | No hidden metadata found. This file is already clean. | Clean already. Nothing hidden in this file. |
| HEIC note | HEIC will be converted to a clean JPEG. | HEIC will become a clean JPEG. |
| ScrubButton primary | Remove metadata and download | Strip it clean |
| ScrubButton loading | Scrubbing... | Stripping... |
| DoneSummary heading | Done. Your file is clean. | Clean. Ready to share. |
| DoneSummary reset link | Scrub another file | Do another |
| DoneSummary empty-nothing | The file had no metadata to remove. | Nothing to strip. Already clean. |
| FileHeader reset | Start over | Start over |
| ErrorBanner unsupported | Sorry, we only support JPEG, PNG, HEIC, and PDF right now. | JPEG, PNG, HEIC, or PDF only. |
| ErrorBanner oversized | This file is over 25 MB. Try a smaller one. | Too big. 25 MB max. |
| ErrorBanner corrupt | We couldn't read this file. It may be corrupt or password protected. | Can't read this file. It may be broken or locked. |
| ErrorBanner scrub-fail | Something went wrong while removing metadata. Try again. | Strip failed. Try again. |
| ErrorBanner dismiss aria | Dismiss error | Dismiss |

Every string still passes the em-dash ban.

### 2. Masthead — give the app quiet identity

The header currently holds only the privacy badge. Add an app-name treatment on the left so the page reads as something specific, not a generic form.

```
metadata-scrubber · v0.1                      Nothing leaves this tab
```

- Left cluster: `metadata-scrubber` in `--ink-1`, `font-weight: 500`, `font-size: var(--text-xs)`, `letter-spacing: 0.06em`, `text-transform: lowercase`. A middle dot `·` separator. Then `v0.1` in `--ink-3`, `font-variant-numeric: tabular-nums`.
- Right: privacy badge (existing `PrivacyBadge`).
- Below 640px, the masthead stacks (name on top, badge below).

New file: `src/components/Masthead.tsx`. Consumes: nothing. Produces: `<Masthead />`.

`App.tsx` replaces its bare `<PrivacyBadge />` with `<Masthead />`.

### 3. Empty state — hierarchy and promise

The empty state is the hero — right now it undersells itself.

- Prompt (`.dropzone__prompt`): bumped from `--text-lg` to `--text-xl` (24px). `--ink-1`, weight 500.
- New supporting line (`.dropzone__promise`) under the hint: "Under 30 seconds." Set in `--text-xs`, `--ink-3`, `letter-spacing: 0.06em`, `text-transform: uppercase`. Adds a value beat without adding a graphic.
- Vertical spacing tightened between prompt / hint / promise so they read as one cluster, not three lines.

### 4. GPS reveal — three-stage choreography (the Committed moment)

Current: the whole callout fades + scales in as one unit, 80ms after the report settles. Fine, but not a moment.

New: staged reveal, ~600ms total.

- **t=80ms:** heading fades in (opacity only, 200ms).
- **t=200ms:** Latitude row fades in (opacity, 160ms).
- **t=260ms:** Longitude row fades in (opacity, 160ms).
- **t=440ms:** "See exactly where ↗" link fades in (opacity, 160ms).
- The card outer box appears with the heading (opacity + scale 0.97 → 1, 280ms). No rotation. No blur.

Under `prefers-reduced-motion: reduce`, all four elements appear together with opacity only (200ms).

Link text: `See exactly where` + external-link arrow `↗`. Feels like an invitation, not a technical fetch.

### 5. Done state — pair each category with what it exposed

Current: "Removed location". Correct but educational value is thin.

New: `{ removedCategories, findings }` — DoneSummary now takes the original findings so it can pair each removed category with a short description of what it held.

Category → description mapping (constants in `DoneSummary.tsx`):

| Category | Row text |
|---|---|
| Location | Removed location · where you were |
| Device | Removed device · what you shot with |
| Timestamps | Removed timestamps · when it happened |
| Identity | Removed identity · who created it |
| Other | Removed other technical fields |

The middle-dot separator (`·`) is a repeat of the masthead motif — small cohesion win.

Rendered as `<span>Removed location</span><span aria-hidden="true"> · </span><span>where you were</span>` so screen readers get "Removed location where you were" without the dot noise.

Requires `App.tsx` to pass the pre-scrub findings into `SCRUB_COMPLETE` and thread them through the reducer to the `done` state.

### 6. Micro-typography tuning

- Category headings (`.report-section__label`): `letter-spacing` stays at spec's `0.02em` (fixed in the previous review pass).
- File header filename (`.file-header__name`): `font-weight: 500` → `font-weight: 500` (keep), but tighten `letter-spacing: -0.01em` so it reads as a filename rather than sentence text.
- Masthead app name: `letter-spacing: 0.06em` (same rhythm as the category eyebrow labels — cohesion).
- Middle-dot separators (`·`) get consistent color: `var(--ink-3)`, non-breaking ` · `.

## Non-goals (explicit)

- No new font family (spec: one family only).
- No decorative graphics (no crosshair, no seal, no icon set).
- No new colors or tokens.
- No new dependencies.
- No feature additions.
- No behavior changes in the state machine.
- No new e2e tests (existing suite must stay green; existing tests get updated only where their string assertions target strings that were rewritten).

## Test surface that will need updates

The following existing tests assert against exact strings that this iteration changes. Each must be updated to match the new copy:

- `tests/unit/smoke.test.tsx` — "Files stay on your device" → "Nothing leaves this tab"; "Drop a file to see what it's leaking" → "Drop a photo. See what it says about you."
- `tests/unit/components/basics.test.tsx` — PrivacyBadge assertion.
- `tests/unit/components/drop-zone.test.tsx` — prompt + hint assertions.
- `tests/unit/components/metadata-report.test.tsx` — "reveals where it was taken" → "remembers where you were"; "no hidden metadata found" → "clean already".
- `tests/unit/components/scrub-button.test.tsx` — "remove metadata and download" → "strip it clean"; "scrubbing" → "stripping".
- `tests/unit/components/done-summary.test.tsx` — "done. your file is clean." → "clean. ready to share."; "scrub another file" → "do another"; "had no metadata" → "already clean" (nothing to strip); rows now include the paired phrase.
- `tests/unit/components/error-banner.test.tsx` — "only support jpeg" → "jpeg, png, heic, or pdf only".
- `tests/unit/components/app-integration.test.tsx` — "remove metadata and download" → "strip it clean"; "done. your file is clean." → "clean. ready to share."; "only support jpeg" → "jpeg, png, heic, or pdf only"; "removed location" / "removed device" assertions still match (prefix is unchanged in the pair).

## Success criteria

- All existing tests still pass (after the string updates listed above).
- New test: `tests/unit/components/done-summary.test.tsx` gets one added case asserting the paired-phrase output for two categories.
- `npm run build` exit 0. No new HIGH/CRITICAL from `npm audit`.
- File-count delta: +1 file (`Masthead.tsx`). No deletions.
- Bundle size: no new deps, no images. Regressions bounded by copy length only (measured in bytes, not KB).
