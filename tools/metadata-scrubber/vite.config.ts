import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  /**
   * This app is not served from a root. It ships inside the justintmccain.com
   * Cloudflare Pages project at /scrubber/, alongside the landing page that
   * links to it, so every emitted asset URL has to carry that prefix.
   *
   * Without this, the built index.html asks for /assets/index-*.js and the
   * @font-face rules in tokens.css ask for /fonts/*.woff2 — all of which
   * resolve against the ROOT of the portfolio, where they do not exist. The
   * page loads a bare white screen and the only clue is four 404s.
   *
   * The trailing slash is required: Vite concatenates this verbatim.
   */
  base: "/scrubber/",

  build: {
    /**
     * Build straight into the Pages publish directory, so "built" and
     * "deployed" cannot drift apart. There is no copy step to forget.
     *
     * This app's SOURCE deliberately lives outside site/. Cloudflare Pages
     * publishes its output directory wholesale with no exclude mechanism, so
     * anything under site/ is a public URL — src/, docs/, .git/ and all. Only
     * the contents of dist land there. Keep it that way.
     */
    outDir: "../../site/scrubber",
    emptyOutDir: true,
  },

  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.{test,spec}.{ts,tsx}'],
  },
});
