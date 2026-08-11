# Performance & Tech-Fit Notes

The core tension: cinematic scroll + 3D + high-craft imagery vs. fast load and flawless mobile. This budget is a constraint Fable must respect — not an aspiration. A privacy leader's site that's slow or janky on a phone undercuts the "craft" claim.

## Performance budget (targets)
| Metric | Target | Ceiling |
|---|---|---|
| LCP (mobile, 4G) | < 2.0s | 2.5s |
| CLS | < 0.05 | 0.1 |
| INP | < 150ms | 200ms |
| Initial JS (gzipped) | < 150KB | 200KB |
| Initial transfer (above-the-fold) | < 800KB | 1.2MB |
| Lighthouse Perf (mobile) | ≥ 90 | — |
| Time to Interactive (mobile) | < 3.5s | — |

Core Web Vitals are also an SEO ranking factor — performance and `03-seo` reinforce each other.

## How to hit it (directives for Fable)
- **Defer the heavy stuff.** The 3D signal-field loads *after* first paint and only when in/near viewport (IntersectionObserver). Above-the-fold hero must paint from a lightweight poster image first, then upgrade to motion/WebGL.
- **Static-first hero.** Ship an optimized poster still (AVIF/WebP) as the LCP element; the animated/WebGL layer enhances on top. If WebGL is unavailable, low-power, `prefers-reduced-motion`, or `prefers-reduced-data`, the poster *is* the hero — no penalty.
- **Code-split by section.** Scroll scenes lazy-load as the user approaches them; nothing below the fold is in the critical bundle.
- **Images:** AVIF with WebP fallback; responsive `srcset`/`sizes`; explicit width/height (protect CLS); the abstract signal art compresses well as AVIF — exploit that. Portraits at 2× max, no larger.
- **3D:** if using Three.js/R3F, tree-shake, cap DPR (≤2), throttle to viewport visibility, dispose on scroll-away, keep geometry/particle counts modest; provide a pre-rendered fallback frame. Budget the 3D chunk lazy + ≤ ~120KB gzipped.
- **Fonts:** self-hosted, subset to Latin, `font-display: swap`, preload the two most critical faces (Space Grotesk display, Inter body); Plex Mono can load non-blocking. No Google Fonts CDN (privacy + perf).
- **Zero third-party render-blocking.** No tag managers, no external font/JS CDNs on the critical path. Analytics (if any) is a single tiny async script (see `07`).
- **Scroll library:** prefer a lightweight approach (CSS scroll-driven animations / `ScrollTimeline` where supported, or a small library) over a heavyweight bundle. Progressive enhancement: if JS fails, the page is still a complete, readable, scrollable document.

## Mobile (flawless is the bar)
- Design and test mobile-first; the hero, ledger, and cards must be excellent at 375px.
- Reduce/disable particle counts and 3D on small/low-power devices; serve A1b vertical hero.
- Touch targets ≥ 44px; no hover-only affordances; momentum scroll never hijacked.
- Test on a real mid-tier Android, not just an iPhone simulator.

## Graceful degradation matrix
| Condition | Behavior |
|---|---|
| `prefers-reduced-motion` | static hero still; no scrub/parallax/3D; final metrics shown instantly |
| `prefers-reduced-data` / Save-Data | static hero; skip non-essential imagery; system-ish fonts if needed |
| No WebGL / low-power GPU | static rendered fallback frame replaces 3D |
| JS disabled/failed | full semantic HTML content readable and scrollable; nav anchors work |
| Slow network | poster paints first; enhancements stream in; never a blank hero |

## Stack fit (guidance, Fable decides specifics)
- Static-first / SSG or SSR-to-static; a single-page site with these needs suits an Astro/Next-static or similar output — ship mostly HTML/CSS with islands of JS for the scroll/3D scenes.
- Host on an edge/static host with HTTP/2-3, Brotli, long-cache immutable assets, and a good CDN. Ensure the host doesn't inject its own trackers.
- Everything centralizes: copy in one content object, metrics in one place, `SHOW_WRITING`/`SHOW_PORTFOLIO` flags (see `02` + `00`).
