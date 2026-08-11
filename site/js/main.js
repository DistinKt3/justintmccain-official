/* ==========================================================================
   Justin T. McCain — SIGNAL · main.js
   Orchestrator. Small on purpose: it decides WHICH motion system runs, owns
   the ONE global scroll value both systems share, and handles nav/reveals.

   The single scroll value is the whole point. Desktop scrubs a master film,
   mobile draws a procedural field — but both are driven by exactly the same
   progress(), mapped to exactly the same beat map. Different renderers, one
   choreography. The signal cannot fragment because there is only one clock.
   ========================================================================== */
(() => {
  "use strict";

  /* -- environment ------------------------------------------------------- */
  const mqReduced = matchMedia("(prefers-reduced-motion: reduce)");
  const conn = navigator.connection || {};
  const saveData = conn.saveData === true;
  const reducedData = matchMedia("(prefers-reduced-data: reduce)").matches;
  const coarse = matchMedia("(pointer: coarse)").matches;

  const clamp = (n, lo = 0, hi = 1) => (n < lo ? lo : n > hi ? hi : n);

  /* ======================================================================
     1. THE ONE GLOBAL SCROLL VALUE
     0.0 = top of the hero · 1.0 = the contact seal fully in view.
     Everything downstream is a pure function of this number.
     ====================================================================== */
  let endOffset = 1;

  function measure() {
    const contact = document.getElementById("contact");
    const docEnd = document.documentElement.scrollHeight - innerHeight;
    endOffset = contact
      ? Math.max(1, Math.min(docEnd, contact.offsetTop + contact.offsetHeight - innerHeight))
      : Math.max(1, docEnd);
    measureBeats();
  }

  function progress() {
    return clamp(scrollY / endOffset);
  }

  /* ======================================================================
     1b. NARRATIVE TIME — what the motion layer actually runs on.

     `progress()` is raw geometry: what fraction of the page has been
     scrolled. The motion is not authored against that, it is authored
     against SECTIONS. The master film is a chain of six equal segments,
     each rendered between two fixed keyframe anchors and each belonging to
     a named section (build/ASSET-LOG.md), and signal-field.js draws the
     same beats procedurally.

     Those two things only agree while the sections happen to land on the
     film's even sixths. Every time a section is added they stop agreeing,
     because every boundary below the insertion point slides earlier in raw
     progress. That has now happened twice: the asset log records the Ledger
     sliding 0.546 → 0.441 when testimonials was added (~2.5 s of drift, and
     the film had to be re-cut), and adding Tools slid About by a further
     0.100 — the film's "paths branch" beat firing roughly three seconds
     before the section it belongs to.

     Re-cutting the film a second time would fix this instance and leave the
     next one waiting. Instead, this remaps raw progress onto narrative time
     by MEASURING where each anchored section actually enters the viewport
     and pinning it to the film time it was authored for. Between anchors it
     interpolates linearly, so a segment stretches or compresses to cover
     whatever content now sits under it, and the joins still land frame-exact
     on their sections.

     The practical consequence: the film never needs re-cutting for a layout
     change again, and signal-field.js's beat numbers below are expressed in
     the same units as the film's segment table instead of in raw scroll.
     Add a section anywhere and both layers self-correct on the next measure.

     A section added AFTER contact would fall outside this map and is the one
     case still needing thought — nothing is authored past the seal.
     ====================================================================== */
  const BEAT_ANCHORS = [
    ["work",         0.167],   // segment B  K1 → K2
    ["proof",        0.333],   // segment C  K2 → K3
    ["capabilities", 0.500],   // segment D  K3 → K4
    ["about",        0.667],   // segment E1 K4 → K4b
    ["contact",      0.833],   // segment E2 K4b → K5, the seal
  ];

  /* [[rawProgress, narrativeTime], …] strictly increasing in both columns. */
  let beatMap = [[0, 0], [1, 1]];

  function measureBeats() {
    const pts = [[0, 0]];
    let prev = 0;
    for (const [id, t] of BEAT_ANCHORS) {
      const el = document.getElementById(id);
      if (!el) continue;
      /* A beat belongs to the moment its section ENTERS the viewport, not the
         moment its top reaches the top of the screen. Contact never reaches
         the top at all — it is shorter than the viewport — which is why the
         seal was always keyed to entry. */
      const raw = clamp((el.offsetTop - innerHeight) / endOffset);
      const x = Math.max(raw, prev + 1e-4);   // keep it strictly increasing
      if (x >= 1) break;                      // past the end: nothing to pin
      pts.push([x, t]);
      prev = x;
    }
    pts.push([1, 1]);
    beatMap = pts;
  }

  function narrative(p) {
    for (let i = 1; i < beatMap.length; i++) {
      const [x1, t1] = beatMap[i];
      if (p <= x1) {
        const [x0, t0] = beatMap[i - 1];
        const span = x1 - x0;
        return span <= 0 ? t1 : t0 + (t1 - t0) * ((p - x0) / span);
      }
    }
    return 1;
  }

  /* Subscribers get the new progress whenever scroll changes.
     Deliberately NOT wrapped in requestAnimationFrame: both motion modules
     already do their own frame scheduling, so throttling here just added a
     second gate that stalls the whole chain whenever rAF is throttled. The
     work done in this handler is a scroll read, a class toggle and (briefly)
     some rect reads — cheap enough to run per event. */
  const subscribers = new Set();
  let lastP = -1;

  function onScroll() {
    revealInView();
    navState();
    const p = progress();
    if (p !== lastP) {
      lastP = p;
      subscribers.forEach((fn) => fn(p));
    }
  }

  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", () => { measure(); onScroll(); }, { passive: true });

  /* ======================================================================
     2. NAV — transparent over the hero, blur panel once scrolled.
     ====================================================================== */
  const nav = document.querySelector(".nav");
  function navState() {
    if (nav) nav.classList.toggle("is-stuck", scrollY > 24);
  }

  /* ======================================================================
     3. REVEALS — entrance choreography.

     Deliberately NOT IntersectionObserver-driven. An observer that fails to
     fire — throttled tab, delayed script, engine quirk — leaves every element
     at opacity 0, i.e. a blank page. Content must never depend on an
     animation callback firing. So reveals are plain rect checks run from the
     scroll handler we already have: if it is on screen, it is visible, full
     stop. Cheap (the pending list drains to empty and then no-ops) and it
     cannot strand content.
     ====================================================================== */
  let pending = [];

  function revealNow(el) {
    el.classList.add("is-in");
    if (el.matches("[data-count-scope]")) countScope(el);
  }

  function revealInView() {
    if (!pending.length) return;
    const h = innerHeight;
    const still = [];
    for (let i = 0; i < pending.length; i++) {
      const el = pending[i];
      const r = el.getBoundingClientRect();
      if (r.top < h * 0.94 && r.bottom > -h * 0.25) revealNow(el);
      else still.push(el);
    }
    pending = still;
  }

  function initReveals() {
    const items = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));
    if (mqReduced.matches) { items.forEach(revealNow); return; }
    pending = items;
    revealInView();
    // Belt and braces: late layout (fonts, images) can move things into view
    // without a scroll event ever firing.
    setTimeout(revealInView, 400);
    setTimeout(revealInView, 1600);
  }

  /* ======================================================================
     4. COUNT-UPS — metrics animate once on reveal (brand/01 §3.5.5).
     Under reduced motion the final number is already in the DOM and simply
     stays there; nothing animates, nothing is lost. (brand/04)
     ====================================================================== */
  const NUM = /^(\D*?)([\d][\d,]*(?:\.\d+)?)(.*)$/s;

  function countScope(scope) {
    if (mqReduced.matches) return;
    scope.querySelectorAll("strong").forEach(countEl);
  }

  function countEl(el) {
    if (el.dataset.counted) return;
    const m = NUM.exec(el.textContent);
    if (!m) return;                       // no leading figure (e.g. "NIST") — leave as-is
    const [, pre, rawNum, post] = m;
    const target = parseFloat(rawNum.replace(/,/g, ""));
    if (!isFinite(target)) return;
    const decimals = (rawNum.split(".")[1] || "").length;
    const grouped = rawNum.includes(",");
    el.dataset.counted = "1";

    const dur = 900;
    const t0 = performance.now();
    const fmt = (n) => {
      const s = n.toFixed(decimals);
      return grouped ? Number(s).toLocaleString("en-US", {
        minimumFractionDigits: decimals, maximumFractionDigits: decimals,
      }) : s;
    };

    (function step(now) {
      const t = clamp((now - t0) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = pre + fmt(target * eased) + post;
      if (t < 1) requestAnimationFrame(step);
      else el.textContent = pre + fmt(target) + post;
    })(t0);
  }

  /* ======================================================================
     5. MOTION SYSTEM SELECTION
     Poster is always the LCP and always the floor. Everything below is an
     enhancement layered on top of it, and any failure just leaves the poster.
     ====================================================================== */
  const root = document.querySelector("[data-signal]");

  function chooseMotion() {
    if (!root) return "none";
    if (mqReduced.matches || saveData || reducedData) return "none";
    if (conn.effectiveType && /(^|-)2g$/.test(conn.effectiveType)) return "none";

    const lowPower =
      (navigator.deviceMemory && navigator.deviceMemory < 4) ||
      (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);

    // Technique A (master film) on capable large screens; technique B
    // (procedural field) everywhere else — including phones, where v1 shipped
    // no motion at all. Same beat map either way.
    if (coarse || innerWidth < 900 || lowPower) return "field";
    return "film";
  }

  function load(src) {
    return new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = res;
      s.onerror = rej;
      document.head.appendChild(s);
    });
  }

  const V = (document.currentScript && document.currentScript.src.split("?v=")[1]) || "1";

  async function initMotion() {
    const mode = chooseMotion();
    if (mode === "none") return;

    // Defer until after first paint so the poster owns the LCP.
    await new Promise((r) => requestIdleCallback ? requestIdleCallback(r, { timeout: 1200 }) : setTimeout(r, 400));

    /* ONLY the motion layer runs on narrative time. Reveals and the nav state
       stay on raw progress: they are tied to where an element physically is,
       not to which beat is playing, and remapping them would make copy fade in
       at subtly wrong moments. */
    const motion = {
      root,
      subscribe: (fn) => subscribers.add((p) => fn(narrative(p))),
      progress: () => narrative(progress()),
    };

    try {
      if (mode === "film") {
        await load(`js/scroll-film.js?v=${V}`);
        window.SIGNAL_FILM.init(motion);
      } else {
        await load(`js/signal-field.js?v=${V}`);
        window.SIGNAL_FIELD.init(motion);
      }
    } catch {
      /* Enhancement failed. The poster is already correct — do nothing. */
    }
  }

  /* If the user turns reduced-motion on mid-session, honour it immediately. */
  mqReduced.addEventListener?.("change", (e) => {
    if (!e.matches) return;
    root?.querySelector("[data-signal-film]")?.remove();
    root?.querySelector("[data-signal-canvas]")?.remove();
    root?.querySelector("[data-signal-poster]")?.classList.remove("is-superseded");
  });

  /* ======================================================================
     6. BOOT
     ====================================================================== */
  function boot() {
    measure();
    navState();
    initReveals();

    // Ledger figures count up when the table scrolls in.
    document.querySelectorAll(".ledger__proof").forEach((el) => el.setAttribute("data-count-scope", ""));
    if (!("IntersectionObserver" in window)) {
      // countScope is an enhancement only; final values are already rendered.
    }

    initMotion();
    onScroll();

    // Section heights settle after fonts load; re-measure so progress is exact.
    if (document.fonts?.ready) document.fonts.ready.then(() => { measure(); onScroll(); });
    addEventListener("load", () => { measure(); onScroll(); }, { once: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
