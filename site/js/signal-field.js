/* ==========================================================================
   SIGNAL · signal-field.js  —  TECHNIQUE B (mobile / low-power / no-film)

   The same journey as the master film, drawn procedurally instead of decoded.
   It runs the IDENTICAL beat map off the IDENTICAL global scroll value, so the
   choreography matches the desktop film even though the renderer differs.

   Two deliberate properties:
     · It is a PURE FUNCTION of scroll progress — no idle animation loop, no
       timers. It redraws only when you scroll. Calm, and cheap on a phone
       battery. (brand/01 §3.5: restraint over spectacle.)
     · It is 2D canvas, not WebGL — universally supported, so the "no WebGL"
       degradation case simply cannot occur.

   v1 shipped NO motion below 768px. This is why that is now fixed.
   ========================================================================== */
window.SIGNAL_FIELD = (() => {
  "use strict";

  const MINT  = [95, 227, 196];
  const AMBER = [233, 180, 76];

  const clamp = (n, a = 0, b = 1) => (n < a ? a : n > b ? b : n);
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const mix = (a, b, t) => a + (b - a) * t;
  const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  const blend = (t) => [mix(MINT[0], AMBER[0], t), mix(MINT[1], AMBER[1], t), mix(MINT[2], AMBER[2], t)];

  function init({ root, subscribe, progress }) {
    const cv = root.querySelector("[data-signal-canvas]");
    if (!cv) return;
    const ctx = cv.getContext("2d", { alpha: false });
    if (!ctx) return;

    let W = 0, H = 0, dpr = 1, nodes = [], horizon = 0;

    function resize() {
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = cv.clientWidth || innerWidth;
      H = cv.clientHeight || innerHeight;
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    }

    /* The node field: households, receding to a low horizon. Precomputed once
       per resize — drawing is then just fills. */
    function build() {
      horizon = H * 0.42;
      nodes = [];
      const rows = W < 520 ? 16 : 22;
      const cols = W < 520 ? 16 : 26;
      for (let r = 0; r < rows; r++) {
        const t = r / (rows - 1);
        const depth = Math.pow(t, 2.35);              // perspective compression
        const y = horizon + depth * (H - horizon) * 1.04;
        const spread = 0.5 + depth * 2.6;             // rows widen as they near
        for (let c = 0; c < cols; c++) {
          const u = (c / (cols - 1) - 0.5) * spread;
          nodes.push({ x: W / 2 + u * W, y, d: t, r: 0.5 + t * 1.7 });
        }
      }
    }

    /* --------------------------------------------------------------------
       draw(p) — every mark below is a function of p and nothing else.

       p IS NARRATIVE TIME, NOT RAW SCROLL. main.js remaps scroll onto the
       film's segment table before handing it over, so these numbers are in
       exactly the units of build/ASSET-LOG.md — even sixths, one per beat:

         0.000–0.167  hero + thesis   the signal ignites and crosses the gap
         0.167–0.333  work            it hardens into an enforcement lattice
         0.333–0.500  ledger          it resolves into fixed ledger strata
         0.500–0.667  capabilities    paths branch and light in sequence
         0.667–0.833  about
                      + testimonials
                      + tools         paths converge; one warm line, held
         0.833–1.000  contact         it arrives and seals amber

       These used to be raw-scroll offsets that had to be re-measured by hand
       whenever a section was added, and they silently rotted twice when that
       did not happen. They no longer do: main.js pins each anchor to the
       section it belongs to at measure time, so a layout change moves the
       mapping instead of these constants. Change them only to change the
       CHOREOGRAPHY — never to compensate for a section being added.
       -------------------------------------------------------------------- */
    function draw(p) {
      const warm = smooth(0.40, 0.95, p);           // cool → warm across the page
      const col = blend(warm);

      ctx.fillStyle = "#0a0f14";
      ctx.fillRect(0, 0, W, H);

      // -- the field ----------------------------------------------------
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const a = 0.05 + n.d * 0.30;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, 6.2832);
        ctx.fillStyle = rgba(col, a * (0.55 + 0.45 * (1 - warm * 0.5)));
        ctx.fill();
      }

      // -- the signal: one filament, extending left → right ---------------
      const reach = smooth(0, 0.16, p);
      const lineY = horizon + H * 0.045;
      if (reach > 0.001) {
        const x1 = W * (1 - reach) * 0.0;
        const x2 = W * reach;
        const g = ctx.createLinearGradient(x1, 0, x2, 0);
        g.addColorStop(0, rgba(col, 0.0));
        g.addColorStop(0.25, rgba(col, 0.85));
        g.addColorStop(1, rgba(col, 0.95));

        ctx.save();
        ctx.shadowBlur = 18;
        ctx.shadowColor = rgba(col, 0.55);
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(x1, lineY);
        // a gentle sag so it reads as drawn, not ruled
        ctx.quadraticCurveTo((x1 + x2) / 2, lineY + H * 0.012, x2, lineY);
        ctx.stroke();
        ctx.restore();

        // the leading point of light, while it is still travelling
        const head = 1 - smooth(0.12, 0.17, p);
        if (head > 0.01) {
          ctx.beginPath();
          ctx.arc(x2, lineY, 3.2, 0, 6.2832);
          ctx.fillStyle = rgba(col, head);
          ctx.fill();
          const halo = ctx.createRadialGradient(x2, lineY, 0, x2, lineY, 42);
          halo.addColorStop(0, rgba(col, 0.30 * head));
          halo.addColorStop(1, rgba(col, 0));
          ctx.fillStyle = halo;
          ctx.fillRect(x2 - 42, lineY - 42, 84, 84);
        }
      }

      // -- hardening into the enforcement lattice -------------------------
      const wLat = smooth(0.17, 0.26, p) * (1 - smooth(0.33, 0.42, p));
      if (wLat > 0.004) {
        ctx.save();
        ctx.globalAlpha = wLat;
        ctx.strokeStyle = rgba(col, 0.5);
        ctx.lineWidth = 1;
        const bays = 7;
        for (let i = 0; i < bays; i++) {
          const t = i / (bays - 1);
          const x = W * (0.08 + t * 0.84);
          const h = H * (0.06 + 0.16 * (1 - Math.abs(t - 0.5) * 1.4));
          ctx.strokeRect(x - W * 0.055, lineY - h, W * 0.11, h);
          ctx.beginPath();
          ctx.moveTo(x, lineY - h);
          ctx.lineTo(x, lineY);
          ctx.stroke();
        }
        ctx.restore();
      }

      // -- resolving into fixed ledger strata ------------------------------
      const wLed = smooth(0.33, 0.42, p) * (1 - smooth(0.50, 0.58, p));
      if (wLed > 0.004) {
        ctx.save();
        ctx.globalAlpha = wLed;
        const bandN = 9;
        const bw = W * 0.42;
        for (let i = 0; i < bandN; i++) {
          const t = i / (bandN - 1);
          const y = lineY - H * 0.13 + t * H * 0.26;
          const inset = Math.abs(t - 0.5) * W * 0.03;
          const sealed = i === Math.floor(bandN * 0.55);
          ctx.strokeStyle = sealed ? rgba(AMBER, 0.95) : rgba(col, 0.55);
          ctx.lineWidth = sealed ? 1.6 : 1;
          ctx.beginPath();
          ctx.moveTo(W / 2 - bw / 2 + inset, y);
          ctx.lineTo(W / 2 + bw / 2 - inset, y);
          ctx.stroke();
          if (sealed) {
            ctx.beginPath();
            ctx.arc(W / 2, y, 3.4, 0, 6.2832);
            ctx.fillStyle = rgba(AMBER, 0.95);
            ctx.fill();
          }
        }
        ctx.restore();
      }

      // -- paths branching and lighting in sequence ------------------------
      // Fading these out by 0.72 is what leaves the whole converge stretch —
      // about, testimonials and now tools — showing one calm warm line and
      // nothing else. That is the mobile equivalent of holding on K4b.
      const wPath = smooth(0.50, 0.58, p) * (1 - smooth(0.67, 0.72, p));
      if (wPath > 0.004) {
        ctx.save();
        ctx.globalAlpha = wPath;
        ctx.lineWidth = 1.3;
        const legs = 4;
        for (let i = 0; i < legs; i++) {
          // each leg lights slightly after the one before it
          const lit = smooth(0.50 + i * 0.02, 0.58 + i * 0.02, p);
          if (lit <= 0.01) continue;
          const dir = i % 2 === 0 ? -1 : 1;
          const spread = (0.10 + 0.12 * Math.floor(i / 2)) * dir;
          ctx.strokeStyle = rgba(blend(Math.max(warm, 0.75)), 0.30 + 0.55 * lit);
          ctx.beginPath();
          ctx.moveTo(W / 2, H * 0.86);
          ctx.quadraticCurveTo(W / 2 + W * spread * 0.6, lineY + H * 0.12, W / 2 + W * spread, lineY - H * 0.02);
          ctx.stroke();
        }
        ctx.restore();
      }

      // -- arrival: the node rests on the threshold and seals ---------------
      const wSeal = smooth(0.84, 1.0, p);
      if (wSeal > 0.004) {
        const cx = W / 2;
        const cy = lineY;
        ctx.save();
        ctx.globalAlpha = wSeal;

        // the vertical amber threshold it comes to rest against
        ctx.strokeStyle = rgba(AMBER, 0.45);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, cy - H * 0.30);
        ctx.lineTo(cx, cy + H * 0.06);
        ctx.stroke();

        // one concentric pulse ring, expanding as the seal completes
        const ring = 10 + smooth(0.89, 1.0, p) * 46;
        ctx.strokeStyle = rgba(AMBER, 0.34 * (1 - smooth(0.94, 1.0, p) * 0.6));
        ctx.beginPath();
        ctx.arc(cx, cy, ring, 0, 6.2832);
        ctx.stroke();

        const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, 70);
        halo.addColorStop(0, rgba(AMBER, 0.34));
        halo.addColorStop(1, rgba(AMBER, 0));
        ctx.fillStyle = halo;
        ctx.fillRect(cx - 70, cy - 70, 140, 140);

        ctx.beginPath();
        ctx.arc(cx, cy, 4.4, 0, 6.2832);
        ctx.fillStyle = rgba(AMBER, 1);
        ctx.fill();
        ctx.restore();
      }

      // -- vignette: keeps overlaid copy legible at every beat --------------
      const vg = ctx.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.18, W / 2, H * 0.45, Math.max(W, H) * 0.78);
      vg.addColorStop(0, "rgba(10,15,20,0)");
      vg.addColorStop(1, "rgba(10,15,20,0.80)");
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);
    }

    /* -- wiring ----------------------------------------------------------
       Coalesce to one draw per frame, but always draw the LATEST progress.
       Capturing `p` in the closure instead would drop every scroll event that
       arrived while a frame was queued and paint a stale position. */
    let queued = false;
    let latest = 0;

    function render(p) {
      latest = p;
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; draw(latest); });
    }

    resize();
    draw(progress());
    cv.classList.add("is-ready");
    root.querySelector("[data-signal-poster]")?.classList.add("is-superseded");

    subscribe(render);
    addEventListener("resize", () => { resize(); draw(progress()); }, { passive: true });
    addEventListener("orientationchange", () => { setTimeout(() => { resize(); draw(progress()); }, 120); });
  }

  return { init };
})();
