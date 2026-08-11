# Justin T. McCain — Career Site Brand System

**Codename:** SIGNAL · **Spine:** signal → enforcement → evidence
**Status:** Phase 1 (Brand) complete — awaiting sign-off to start Phase 2 (Build).

This folder is the complete Phase-1 output: the brand system plus every build-critical spec, written so an image model (Higgsfield) and a build model (Fable) can execute without guessing.

## Files
| File | What it is |
|---|---|
| `01-brand-guidelines.md` | **Master doc.** Positioning, verbal identity, visual identity (color/type/motion/imagery), do/don'ts. Start here. |
| `02-site-architecture-and-copy.md` | Section-by-section IA + final in-voice copy, dual-audience annotations, hidden portfolio/writing slots. |
| `03-seo-and-metadata.md` | Title/meta, Open Graph/Twitter, JSON-LD, OG image spec. |
| `04-accessibility.md` | WCAG 2.2 AA guardrails, computed contrast, reduced-motion, keyboard, alt-text. |
| `05-higgsfield-asset-brief.md` | Prioritized shot list with ready-to-paste generation prompts. |
| `06-performance-and-tech-fit.md` | Performance budget, degradation matrix, stack fit. |
| `07-analytics-and-privacy.md` | Privacy-respecting analytics + no-banner consent posture. |

**Source of truth for facts:** `Justin_T_McCain_Resume_2026.docx` (in the project root).

## Locked decisions (do not silently change)
- **Direction:** SIGNAL-led (signal → enforcement → evidence).
- **Voice:** POV-forward challenger — "Privacy, built to be obeyed."
- **Intent:** balanced brand + hire; both audiences on the same pixels, always.
- **Presence:** hybrid — abstract world + 1–2 art-directed portraits (need Justin's photos).
- **Mode:** dark-primary (canonical) + light "Evidence Paper" surface for proof sections + optional `prefers-color-scheme` light theme.
- **Palette:** Signal Black `#0A0F14`, Signal Mint `#5FE3C4`, Seal Amber `#E9B44C`, Evidence Paper `#F5F3ED`, text `#EEF2F6`/`#A6B2BF`, Mint Ink `#0B6B58` (mint on light only).
- **Type:** Space Grotesk (display) · Inter (body) · IBM Plex Mono (data) — all self-hosted.
- **Mark:** the "node" atom; JTM signal-baseline monogram; node-at-the-gate favicon.

## How to update it later (for Justin — Phase 2 deliverable will implement these)
- **Change copy:** all site copy lives in a single content config/object; edit there, not in components.
- **Change a metric:** proof numbers are centralized in one place so a figure updates everywhere at once.
- **Add the portfolio:** flip `SHOW_PORTFOLIO = true`; the section + case-study component already exist (scaffolded, hidden). Populate the case-study template (mirrors the Work card format).
- **Add writing/speaking:** flip `SHOW_WRITING = true`; add entries to the writing list; empty-state and card component already built.
- **Swap an asset:** replace the file in `/assets` keeping the same name/dimensions; poster + full-motion versions are referenced by convention (see `06`).
- **Replace a portrait:** drop in the new Higgsfield render at the specified aspect ratios; alt text lives with the content config.
- **Domain:** replace `[DOMAIN]` placeholders in `03-seo-and-metadata.md` before launch; keep the LinkedIn URL exact everywhere.

## Phase 2 (Build — Fable) — not started
Build the site from these specs + the Higgsfield assets. Non-negotiables: flawless mobile, `prefers-reduced-motion` fallback, WCAG AA, fast load w/ graceful degradation, SEO + OG wired, correct prominent LinkedIn link, hidden-but-scaffolded portfolio + writing slots, privacy-respecting analytics, and a "how to update" note shipped with the code.
