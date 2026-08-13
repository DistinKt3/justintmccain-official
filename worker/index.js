/**
 * ============================================================================
 * justintmccain.com — edge entry
 * ============================================================================
 *
 * The site is a Cloudflare Worker with static assets. Assets are served FIRST:
 * for any path that matches a file in site/ (the landing page, /scrubber/, the
 * fonts, the film) this Worker is never invoked at all, and those responses
 * keep the headers from site/_headers.
 *
 * This code therefore only runs for paths with no matching asset — which is
 * exactly one thing we care about:
 *
 *     /vanish  and  /vanish/*   →  proxied to the Netlify deployment
 *
 * Everything else falls through to the asset server's own 404.
 *
 * ---------------------------------------------------------------------------
 * WHY THE PROXY LIVES HERE AND NOT IN A SEPARATE WORKER
 * ---------------------------------------------------------------------------
 * Vanish is a Next.js app with a server route (/api/scan), so it cannot ship as
 * files inside this project the way the Metadata Scrubber does. It stays on
 * Netlify, and this makes it answer under the portfolio's own domain so the
 * tools read as part of the work rather than as links off to somewhere else.
 *
 * This was originally written as a standalone Worker bound to a route pattern,
 * on the assumption the site would be Cloudflare Pages. It is not — it is a
 * Worker already — so a second Worker plus route config would be two
 * deployables and a routing precedence question, to do a job the existing
 * Worker can do in its own fetch handler. Fewer moving parts, one deploy.
 *
 * ---------------------------------------------------------------------------
 * ZERO-LOG DISCIPLINE — read before editing
 * ---------------------------------------------------------------------------
 * POST /vanish/api/scan carries a person's name, city and state in its BODY.
 * This Worker sits directly in the path of that request, so the rules from the
 * route it fronts (tools/vanish/src/app/api/scan/route.ts) apply here too. They
 * are the product, not a preference:
 *
 *   1. NEVER read, clone, inspect or log the request body. It is passed through
 *      as an opaque stream — `new Request(url, request)` does not buffer it.
 *   2. NEVER move any part of it into a URL, query string or header.
 *   3. NEVER add an analytics or error-reporting binding to this Worker. Their
 *      default configuration captures request bodies.
 *   4. Do not enable observability or Logpush. Both are off in wrangler.jsonc
 *      deliberately, not by omission.
 *
 * Cloudflare already terminates TLS for this domain, so proxying adds no party
 * that was not already in the path. That is only true while the tool is served
 * from this domain — which is the trade that was made when we chose a path over
 * a subdomain.
 */

/** The path this Worker owns. Must match Vanish's NEXT_PUBLIC_BASE_PATH. */
const PREFIX = "/vanish";

export default {
  /**
   * @param {Request} request
   * @param {{ ASSETS: { fetch: (req: Request) => Promise<Response> }, VANISH_ORIGIN?: string }} env
   */
  async fetch(request, env) {
    const url = new URL(request.url);
    const isVanish =
      url.pathname === PREFIX || url.pathname.startsWith(`${PREFIX}/`);

    if (!isVanish) {
      // No matching asset and not a Vanish path — let the asset server answer,
      // so the 404 looks the same as every other missing path on the site.
      return env.ASSETS.fetch(request);
    }

    if (!env.VANISH_ORIGIN) {
      return new Response("Vanish is not configured.", {
        status: 500,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    /* The path is forwarded UNCHANGED. Netlify builds Vanish with basePath
       "/vanish", so the app expects to be addressed at /vanish/* on its own
       origin too. Rewriting the prefix off here would break every asset URL
       Next has already baked into the HTML. */
    const target = new URL(url.pathname + url.search, env.VANISH_ORIGIN);

    /* Method, headers and body pass straight through. Constructing from
       `request` keeps the body as a stream — nothing is read or buffered. */
    const proxied = new Request(target, request);

    /* Netlify needs its own host to route to the right site; without this it
       receives the portfolio's Host header and cannot match a deployment. */
    proxied.headers.set("Host", new URL(env.VANISH_ORIGIN).host);

    /* Deliberately NOT X-Forwarded-For. The client IP is not needed to serve
       this app, and forwarding it would hand an identifier to another
       processor for no functional gain. */
    proxied.headers.set("X-Forwarded-Proto", url.protocol.replace(":", ""));
    proxied.headers.set("X-Forwarded-Host", url.host);

    let response;
    try {
      /* redirect: "manual" so Next's own redirects reach the browser as
         redirects against THIS domain, rather than being followed here and
         silently resolving to a netlify.app URL the visitor would then see. */
      response = await fetch(proxied, { redirect: "manual" });
    } catch {
      /* No detail is surfaced or logged: an exception here can carry the
         request that caused it. Fail closed and say nothing. */
      return new Response("Vanish is temporarily unavailable.", {
        status: 502,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    const out = new Response(response.body, response);

    /* Rewrite any Location pointing back at the origin, so a redirect never
       leaks the netlify.app hostname into the visitor's address bar. */
    const location = out.headers.get("Location");
    if (location) {
      try {
        const abs = new URL(location, env.VANISH_ORIGIN);
        if (abs.host === new URL(env.VANISH_ORIGIN).host) {
          out.headers.set("Location", abs.pathname + abs.search + abs.hash);
        }
      } catch {
        /* Relative or malformed Location — leave it alone. */
      }
    }

    /* The scan endpoint must never be cached: it is a POST carrying identity,
       and a cached response would be both wrong and a disclosure. Belt and
       braces alongside the route's own `dynamic = "force-dynamic"`. */
    if (url.pathname.startsWith(`${PREFIX}/api/`)) {
      out.headers.set("Cache-Control", "no-store");
    }

    /* NOTE: site/_headers does NOT apply to these responses — it is an asset
       feature and this response never touched the asset server. That is
       correct and intended: Vanish ships its own CSP from next.config.ts, and
       the portfolio's `default-src 'none'` would break the app instantly. */
    return out;
  },
};
