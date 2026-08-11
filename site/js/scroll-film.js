/* ==========================================================================
   SIGNAL · scroll-film.js  —  TECHNIQUE A (desktop)

   Scrubs ONE master film across the WHOLE page. Not one clip per section:
   a single <video> in a single fixed layer, whose currentTime is a pure
   function of the one global scroll value. Scrolling *is* the transport.

   The master is a chain of segments rendered between fixed keyframe anchors,
   so segment N ends on exactly the frame segment N+1 begins on — the seams
   are joins, not cuts. See assets/ASSET-LOG.md.

   Loaded only on capable large screens by main.js. Any failure here is
   non-fatal: the poster underneath is already the correct image.
   ========================================================================== */
window.SIGNAL_FILM = (() => {
  "use strict";

  const SRC_MP4 = "assets/motion/signal-master.mp4";

  function init({ root, subscribe }) {
    const film = root.querySelector("[data-signal-film]");
    const poster = root.querySelector("[data-signal-poster]");
    if (!film) return;

    let duration = 0;
    let target = 0;      // where scroll says we should be
    let shown = 0;       // where the video actually is (eased toward target)
    let ready = false;
    let raf = 0;

    /* Seeking on every scroll event is what makes scrubbed video feel broken.
       Instead we ease `shown` toward `target` on a rAF loop and only issue a
       seek when the delta is meaningful — smooth, and far fewer decodes. */
    const EPS = 1 / 60;

    function loop() {
      raf = 0;
      if (!ready) return;

      const d = target - shown;
      if (Math.abs(d) < EPS) { shown = target; }
      else { shown += d * 0.18; schedule(); }

      const t = shown * duration;
      if (Math.abs(film.currentTime - t) > EPS) seek(t);
    }

    function schedule() { if (!raf) raf = requestAnimationFrame(loop); }

    function seek(t) {
      if (!isFinite(t)) return;
      try { film.currentTime = t; } catch { /* seek raced a reload */ }
    }

    function onProgress(p) {
      // A big jump means an anchor click or a scrollbar drag, not a scroll.
      // Easing through it would crawl the film across the whole journey, so
      // snap instead — and do it synchronously, without waiting on rAF.
      if (Math.abs(p - shown) > 0.12) {
        shown = target = p;
        if (ready) seek(shown * duration);
        return;
      }
      target = p;
      schedule();
    }

    film.addEventListener("loadedmetadata", () => {
      duration = film.duration || 0;
      if (!duration || !isFinite(duration)) return;   // unusable → poster stays
      ready = true;
      film.pause();
      shown = target;
      loop();
    }, { once: true });

    /* Only reveal the film once it can actually paint a frame, so we never
       flash a black box over the poster. */
    film.addEventListener("loadeddata", () => {
      film.classList.add("is-ready");
      poster?.classList.add("is-superseded");
    }, { once: true });

    film.addEventListener("error", () => {
      ready = false;
      film.classList.remove("is-ready");
      poster?.classList.remove("is-superseded");
    });

    /* Stop burning decode work when the tab is backgrounded. */
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && raf) { cancelAnimationFrame(raf); raf = 0; }
      else schedule();
    });

    subscribe(onProgress);

    film.preload = "auto";
    film.src = SRC_MP4;
    film.load();
  }

  return { init };
})();
