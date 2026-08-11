import type { NextConfig } from "next";

/**
 * Security headers.
 *
 * These are not decoration — several of them are load-bearing for the product's
 * privacy claims:
 *
 * - `Referrer-Policy: no-referrer` stops the broker listing URLs the user opens
 *   from "view listing" from carrying a Vanish referrer, which would tell the
 *   broker their visitor arrived from an opt-out tool.
 * - CSP `form-action 'none'` + `connect-src 'self'` means identity data has
 *   nowhere to go but our own single scan endpoint, even if a dependency were
 *   compromised. This is the technical backstop to the zero-log promise.
 * - No `unsafe-eval`. `unsafe-inline` for style is required by Next's runtime
 *   style injection; script keeps a strict policy.
 */
const isDev = process.env.NODE_ENV === "development";

/**
 * React's dev build uses eval() for debugging features (it never does in
 * production). Rather than weaken the shipped policy, 'unsafe-eval' is added
 * ONLY when NODE_ENV is development — production keeps the strict policy.
 */
const scriptSrc = isDev
  ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
  : "script-src 'self' 'unsafe-inline'";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "no-referrer" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      scriptSrc,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "connect-src 'self'",
      "form-action 'none'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "object-src 'none'",
    ].join("; "),
  },
];

/**
 * Sub-path deployment.
 *
 * In production Vanish is not the root of its domain — it answers at
 * justintmccain.com/vanish, proxied from Netlify by Cloudflare, so that the
 * tool lives inside the portfolio rather than beside it. Without a basePath,
 * Next emits its bundles at /_next/… which resolves against the ROOT of
 * justintmccain.com, where the static portfolio lives and no such files exist.
 * The app would render an unstyled shell and every route would 404.
 *
 * Read from the environment rather than hardcoded so this same tree still runs
 * at the root during `next dev` and on a bare *.netlify.app URL. Netlify sets
 * it in netlify.toml. Note the docs' warning: the value is INLINED into the
 * client bundle at build time, so changing it requires a rebuild, not a redeploy.
 */
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  basePath: BASE_PATH || undefined,

  /* Re-exported so client code can build absolute-from-root URLs that Next does
     NOT rewrite for us. basePath covers <Link>, the router and asset URLs; it
     does not touch fetch(). See the /api/scan call in scan/running/page.tsx. */
  env: { NEXT_PUBLIC_BASE_PATH: BASE_PATH },

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
