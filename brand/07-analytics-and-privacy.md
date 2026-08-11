# Analytics & Privacy of Your Own Site

The site must practice what it preaches. For Justin specifically, a creepy analytics stack or a dark-pattern cookie banner would be reputationally fatal. The goal: **useful signal, zero personal data, no consent banner needed — and say so out loud.** This is a brand asset, not just compliance.

## Guiding posture
1. **Collect nothing personal.** No cookies, no localStorage tracking, no fingerprinting, no cross-site identifiers, no ad/marketing pixels, no Google Analytics, no Meta pixel, no session recording.
2. **No third-party data leakage on the critical path.** Self-host fonts (no Google Fonts CDN — it sees visitor IPs), self-host all assets. No tag manager.
3. **If it needs a consent banner, don't ship it.** A truly cookieless, no-personal-data setup does not legally require a consent banner in most jurisdictions — which is the flex. The absence of a banner *is* the statement.
4. **Honor the signals you build for a living.** Respect Global Privacy Control (GPC) and Do Not Track — and put that in the footer. The privacy-enforcement guy's own site honoring GPC is the perfect proof point.

## Recommended analytics (pick one)
- **Preferred: privacy-first, cookieless analytics** — Plausible or Fathom (or self-hosted Plausible/Umami/GoatCounter). Aggregate, no cookies, no personal data, no cross-site tracking, EU-hostable, single small async script (<2KB), doesn't touch the consent question. Gives pageviews, referrers, top sections — enough to know the site is working.
- **Most private: server-log / edge analytics only** — no client script at all; count requests at the edge. Zero client footprint. Least granular, maximum purity.
- **Do not use:** Google Analytics / GA4, anything cookie-based, anything that phones a third party with the visitor's IP for ad purposes.

**Config requirements if using a script:** load `async`/`defer`, self-host or first-party-proxy where possible, IP anonymized/never stored, no cross-site, honor GPC/DNT (skip counting when set). Keep it off the critical render path (see `06`).

## Cookie / consent posture
- **Target: no cookie banner at all**, because there are no cookies or personal-data trackers to consent to. Verify with the chosen analytics that it's genuinely cookieless before claiming this.
- If any future addition would require consent (e.g., an embedded video that sets cookies), gate it behind a genuine, symmetric, no-dark-pattern consent choice — reject and accept equally easy — or don't add it.
- Provide a short, human `/privacy` page (also an SEO/entity asset): what's collected (essentially nothing), why, retention (aggregate/short), no third-party sharing, and the GPC/DNT commitment. Written in the brand voice — plain, specific, no legalese theater.

## Footer privacy line (copy)
> This site collects nothing personal — no cookies, no trackers, no ad pixels. Fonts and assets are self-hosted. It honors your Global Privacy Control signal. [Read the details →/privacy]

## Acceptance criteria (hand to Fable)
- Network tab on load shows **only first-party requests** — no google-analytics, no googlefonts, no facebook, no third-party beacons.
- No cookies set (verify Application → Cookies is empty).
- Lighthouse "Best Practices" ≥ 95; no third-party cookies flagged.
- GPC present → analytics does not count / no tracking occurs.
- `/privacy` page live, linked in footer, accurate to the actual implementation (never claim more privacy than shipped).
