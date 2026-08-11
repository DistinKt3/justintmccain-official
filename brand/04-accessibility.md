# Accessibility Guardrails (WCAG 2.2 AA)

For a privacy leader, an accessible, reduced-motion-respecting, keyboard-navigable site is not compliance overhead — it's the brand proving it respects the user. Scroll-driven/3D sites routinely fail here; this one won't. **AA is the floor; hit AAA on body text where we already do.**

## Color contrast (computed against the locked palette)
Dark surface = Signal Black `#0A0F14`. Light surface = Evidence Paper `#F5F3ED`.

| Pair | Ratio | Verdict |
|---|---|---|
| Daylight `#EEF2F6` on Signal Black | ~17.5:1 | AAA ✓ |
| Slate `#A6B2BF` on Signal Black | ~8.6:1 | AAA ✓ (safe for body + labels) |
| Signal Mint `#5FE3C4` on Signal Black | ~12:1 | AAA ✓ (text, links, graphics) |
| Seal Amber `#E9B44C` on Signal Black | ~9.9:1 | AAA ✓ (metrics, accents) |
| Ink `#14181D` on Evidence Paper | ~16:1 | AAA ✓ |
| **Signal Mint `#5FE3C4` on Evidence Paper** | **~1.4:1** | **FAIL — never use.** On paper, use **Mint Ink `#0B6B58`** for mint text/links/small marks. |
| Mint Ink `#0B6B58` on Evidence Paper | ~5.3:1 | AA ✓ (normal text) |

**Rules:**
- Body text ≥ 4.5:1 (we exceed). Large text (≥24px or ≥19px bold) ≥ 3:1.
- UI/graphic boundaries (buttons, form fields, focus, the node atom, chart strokes) ≥ 3:1.
- **Never** rely on color alone. Amber "honored" states also carry the filled-node shape + a label; mint links are underlined (not color-only).
- On the Evidence Paper surface, accents must use **Mint Ink**, never Signal Mint.

## Motion & `prefers-reduced-motion` (hard requirement)
- Wrap all scroll-scrubbed, parallax, count-up, and 3D animation in `@media (prefers-reduced-motion: no-preference)`.
- Reduced-motion fallback: static, fully-legible layout; hero shows the final signal-field still; **metrics render as final numbers instantly** (no count-up); no parallax; 3D replaced by a static render/image. **Content is identical** either way.
- No animation flashes more than 3×/second (seizure safety).
- Optional in-UI "reduce motion" toggle in addition to the OS setting (nice-to-have, not required).
- Scroll effects must never hijack native scroll speed/direction disorientingly; the page must be fully usable by scrollbar, Page Down, and keyboard alone.

## Keyboard & focus
- Full keyboard operability; logical tab order matching visual/DOM order.
- Visible focus on every interactive element: a **2px Signal Mint focus ring** (`#5FE3C4`, ≥3:1 on both surfaces — on paper use Mint Ink ring) with 2px offset. Never `outline:none` without an equal-or-better replacement.
- **Skip link** ("Skip to content") as the first focusable element.
- No keyboard traps (esp. any 3D/canvas element — it must be skippable and not steal focus).
- Mobile nav menu: focus moves into it on open, returns to trigger on close, `Esc` closes.
- Respect `:focus-visible` so mouse users don't see rings but keyboard users always do.

## Structure & semantics
- Landmarks: `<header>`, `<nav>`, `<main>`, `<section aria-labelledby>`, `<footer>`.
- One `<h1>`; ordered headings; no skipped levels.
- The decorative signal-field canvas/SVG: `aria-hidden="true"` + `role="presentation"`; it must convey no information that isn't also in text.
- Interactive controls are real `<a>`/`<button>` with discernible names; icon-only controls (LinkedIn glyph, menu) have `aria-label`.
- Prefers-reduced-data / low-power: serve the static hero (see performance doc).

## Alt-text conventions (abstract imagery)
Abstract art still needs intent-based alt text, not literal pixel description.
- **Decorative-only** (background grain, ambient signal field already described in nearby text): `alt=""` + `aria-hidden`.
- **Meaningful** motif images get concept alt text, e.g.:
  - Hero: `alt="A single luminous mint signal traveling across a dark field of nodes and being honored at an amber-sealed gate."`
  - Survives-Deletion: `alt="A field of data dissolving while one glowing thread of evidence remains intact."`
  - Portrait: `alt="Justin T. McCain, lit by a single mint key light in a dark architectural space."`
- Keep alt ≤ ~150 chars, describe *meaning/mood*, never start with "image of."

## Targets / testing (hand to Fable as acceptance criteria)
- axe-core / Lighthouse a11y ≥ 95; zero critical violations.
- Manual: full keyboard pass, VoiceOver + NVDA smoke test, reduced-motion pass, 200% zoom with no loss of content/function, mobile screen-reader pass.
- Forms: none by design (mailto only), which removes a whole class of a11y + privacy risk.
- Touch targets ≥ 44×44px.
