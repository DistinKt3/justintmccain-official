# Higgsfield Asset Brief — Shot List & Prompts

Every image the site needs, prioritized. **Palette (paste into prompts as needed):** near-black `#0A0F14`, Signal Mint `#5FE3C4`, Seal Amber `#E9B44C`, off-white Evidence Paper `#F5F3ED`.

**Global style (prepend/keep consistent across all assets):**
> cinematic, high-craft, editorial, abstract data-infrastructure aesthetic; dramatic single-source directional light; deep shadows; fine film grain and subtle noise; precise linework; luminous accents only in mint (#5FE3C4) and warm amber (#E9B44C) against near-black (#0A0F14); restrained, premium, intentional; ultra-detailed, 8k.

**Global negative (apply to all):**
> no padlocks, no shields, no keys, no chains, no hoodies, no hackers, no binary code rain, no fingerprints, no glossy corporate 3D render clichés, no stock-photo people at laptops, no blue corporate gradient, no third accent color, no clutter, no text artifacts, no lens flare kitsch.

**Priority key:** ⭐ = hero / scroll-critical (must be excellent) · ○ = secondary.
**Mode:** all dark unless noted. The Ledger (A4) needs a **light Evidence-Paper** treatment. Mode is locked dark-primary, so no other asset needs a light twin.

---

### ⭐ A1 — Hero Signal Field (landscape)
- **Purpose:** the hero backdrop; the signal traveling and being honored.
- **Placement:** §1 Hero, full-bleed behind headline.
- **Aspect:** 16:9 (also export 21:9 crop). **Mode:** dark.
- **Motion intent:** SCROLL-CRITICAL — scrubbed to scroll; the mint signal travels left→deep as the user descends, resolving to an amber-sealed node. Provide as a sequence/loop-friendly frame set if possible; otherwise a still + CSS/WebGL motion.
- **Prompt:**
> A vast, dark volumetric space receding into black (#0A0F14). Fine luminous mint (#5FE3C4) signal lines propagate across an immense field of faint, evenly-spaced nodes, like opt-out signals traveling through infrastructure. One signal line is brighter than the rest, arcing toward a distant threshold where it terminates in a single glowing node that seals warm amber (#E9B44C) — the moment a signal is honored. Single-source directional light, deep shadow, fine grain, immense sense of scale and calm. Abstract, cinematic, premium. [global style] [global negative]

### ⭐ A1b — Hero Signal Field (mobile / vertical)
- **Purpose:** flawless mobile hero (do not just crop A1).
- **Placement:** §1 Hero on ≤480px. **Aspect:** 9:16. **Mode:** dark. **Motion:** scroll-critical (lighter on mobile; may fall back to static).
- **Prompt:** same as A1, recomposed vertically — the bright signal travels top→bottom and seals amber near lower third; more negative space at top for the headline overlay. [global style] [global negative]

### ○ A2 — The Honored Node (macro seal)
- **Purpose:** transition beat between Work cards / Contact seal.
- **Placement:** §3 card transitions; §9 Contact close. **Aspect:** 1:1 and 16:9. **Mode:** dark.
- **Motion intent:** the node pulse-seals (mint → amber) on enter.
- **Prompt:**
> Extreme macro of a single luminous node against near-black (#0A0F14): a mint (#5FE3C4) point of light meeting a thin vertical amber (#E9B44C) threshold line, the instant it is captured and honored. A faint concentric pulse ring radiates once. Minimal, precise, jewel-like, deep shadow, fine grain. [global style] [global negative]

### ○ A3 — Enforcement Lattice
- **Purpose:** structural backdrop for Capabilities / section dividers.
- **Placement:** §5 background (very low contrast, behind text). **Aspect:** 16:9. **Mode:** dark.
- **Motion intent:** subtle parallax only; paths light in sequence.
- **Prompt:**
> An precise architectural lattice of thin mint (#5FE3C4) lines forming gates and thresholds in dark space (#0A0F14), like a blueprint of an enforcement layer — signals must pass through checkpoints. Structural, cool, technical, blueprint-like, deep perspective, very low overall brightness so text sits on top. Fine linework, subtle grain. [global style] [global negative]

### ⭐ A4 — The Ledger (Evidence) — LIGHT + dark variants
- **Purpose:** proof-section texture; "receipts, not promises."
- **Placement:** §4 Ledger. **Primary render: light Evidence Paper `#F5F3ED`.** Also a dark variant for optional use. **Aspect:** 16:9 and a tall 4:5.
- **Motion intent:** rows stamp in; amber seal on key figures. Mostly static/structural.
- **Prompt (light):**
> Warm off-white paper surface (#F5F3ED) like a fine printed record. Crisp horizontal strata stacking upward like an append-only, tamper-evident ledger; thin dark ink (#14181D) rule lines and fragments of monospace receipt text (abstract, unreadable). One row carries a warm amber (#E9B44C) wax-seal-like mark — a record made real. Editorial, precise, calm, archival, subtle paper grain, soft single-source light. [global style, adapted to light surface] [global negative]
- **Prompt (dark variant):** same ledger structure on near-black (#0A0F14) with mint rule lines and an amber seal.

### ⭐ A5 — Survives Deletion (signature image)
- **Purpose:** the emotional differentiator — evidence that outlives the account.
- **Placement:** §3 Card 4 feature, or a standalone scroll beat. **Aspect:** 16:9 + 9:16. **Mode:** dark.
- **Motion intent:** hero-secondary; the field dissolves on scroll while one thread persists.
- **Prompt:**
> In dark space (#0A0F14), a dense field of fine data points and lines is dissolving and scattering into nothing — an account being deleted. Through the disintegration, a single continuous luminous thread of evidence remains perfectly intact and glowing, mint (#5FE3C4) shifting to warm amber (#E9B44C) along its length — proof that survives deletion. Poignant, cinematic, high contrast between dissolution and the one enduring line, fine grain, deep shadow. [global style] [global negative]

### ⭐ A6 — Portrait, primary (The Human) — REQUIRES JUSTIN'S PHOTOS
- **Purpose:** the hybrid human moment; trust + warmth.
- **Placement:** §6 About. **Aspect:** 4:5 portrait + 1:1 crop. **Mode:** dark.
- **Production note:** requires Justin's reference photos. Use Higgsfield **Soul** (train a character from 5–20 photos) for identity fidelity, or a reference-element workflow for a one-off. Confirm likeness before locking.
- **Prompt:**
> Editorial cinematic portrait of a confident man in a dark, architectural space that reads like privacy infrastructure abstracted into a cathedral of structure — not a literal server room. Single-source mint (#5FE3C4) key light rakes across his face and shoulder; deep shadow; near-black surroundings (#0A0F14). Composed, human, serious but warm, premium magazine quality. Shallow depth of field, fine grain. [global style] [global negative]

### ○ A7 — Portrait, secondary (amber key) — REQUIRES JUSTIN'S PHOTOS
- **Purpose:** alt portrait for contact/meta.
- **Aspect:** 1:1 + 3:2. **Mode:** dark.
- **Prompt:** as A6 but warm amber (#E9B44C) key light, slightly closer crop, a hint of a knowing half-smile — the human behind the escalation point. [global style] [global negative]

### ○ A8 — Texture & particle utility kit
- **Purpose:** overlays and building blocks for Fable (grain, node sprite, signal-line PNGs with alpha).
- **Deliverables:** (1) fine film-grain overlay (transparent PNG); (2) single node sprite — mint glow, transparent bg, 512px; (3) amber sealed-node sprite; (4) a few isolated signal-line strokes (transparent PNG).
- **Prompt (node sprite):**
> A single softly glowing mint (#5FE3C4) circular node with a faint concentric pulse ring, centered on a fully transparent background, high resolution, crisp, no artifacts. (Repeat with amber #E9B44C for the sealed node.) [global negative]

### ⭐ A9 — OG / social share image
- **Purpose:** link-preview card (see `03-seo-and-metadata.md`).
- **Aspect:** 1200×630 exact. **Mode:** dark. **Static.**
- **Prompt:**
> A 1200x630 social share card on near-black (#0A0F14). Left third negative space reserved for wordmark overlay. Right two-thirds: a single luminous mint (#5FE3C4) signal line traveling and resolving into one amber-sealed (#E9B44C) node. Clean, legible at thumbnail size, generous negative space, no text baked in (text added in build). [global style] [global negative]

### ○ A10 — Favicon / monogram render (reference)
- **Purpose:** reference for the SVG mark (mark itself is coded, not image-dependent).
- **Aspect:** 1:1. **Mode:** dark + a light-bg version.
- **Prompt:**
> A minimal monogram glyph: a mint (#5FE3C4) node resting against a thin vertical amber (#E9B44C) threshold line, extremely simple, iconic, legible at 16px, centered, transparent background. [global negative]

### ○ A11 — Privacy × AI motif (optional)
- **Purpose:** the emerging-thread visual in Capabilities.
- **Aspect:** 16:9. **Mode:** dark. **Secondary.**
- **Prompt:**
> In dark space (#0A0F14), a neural-lattice of fine mint (#5FE3C4) lines flows into the same enforcement-gate/threshold motif, where an amber (#E9B44C) checkpoint governs it — privacy controls governing an AI system. Abstract, structural, forward-looking, restrained. [global style] [global negative]

---

## Build order (recommend to Fable)
1. ⭐ A1 + A1b (hero) → 2. ⭐ A5 (survives deletion) → 3. ⭐ A4 light (ledger) → 4. ⭐ A9 (OG) → 5. ⭐ A6 (portrait, needs Justin's photos) → 6. ○ A2, A3, A8 → 7. ○ A7, A10, A11.

**Open dependency:** A6/A7 portraits need Justin's reference photos. Everything else can proceed immediately. Flag to Justin at the Phase-2 kickoff.
