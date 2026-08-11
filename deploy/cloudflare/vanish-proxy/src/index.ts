/**
 * ============================================================================
 * justintmccain.com/vanish  →  Netlify
 * ============================================================================
 *
 * Vanish is a Next.js app with one server-side route (/api/scan), so it cannot
 * ship as files inside the static Cloudflare Pages project the way the Metadata
 * Scrubber does. It stays on Netlify, where its Node runtime and 30s budget
 * work, and this Worker makes it answer under the portfolio's domain so the
 * tools read as part of the work rather than as links off to somewhere else.
 *
 * WHY A WORKER AND NOT A PAGES FUNCTION:
 *   A Pages Function would live inside the same project as the static site and
 *   deploy with it. That couples them: a mistake in the proxy is a mistake in
 *   the site. This is deliberately a separate deployable with a route pattern,
 *   so the worst case for the portfolio is that /vanish 502s while every other
 *   page is untouched.
 *
 * WHY A PROXY AND NOT A REDIRECT:
 *   A redirect would move the visitor to a netlify.app URL and put the tool
 *   visibly outside the portfolio, which is the thing this is meant to avoid.
 *
 * ---------------------------------------------------------------------------
 * ZERO-LOG DISCIPLINE — read before editing
 * ---------------------------------------------------------------------------
 * POST /vanish/api/scan carries the user's name, city and state in its BODY.
 * This Worker sits directly in the path of that request. The rules from the
 * route it fronts (tools/vanish/src/app/api/scan/route.ts) therefore apply
 * here too, and they are the product, not a preference:
 *
 *   1. NEVER read, clone, inspect or log the request body. It is passed through
 *      as an opaque stream. `new Request(url, req)` below does not buffer it.
 *   2. NEVER move any part of it into the URL, a query string or a header.
 *   3. NEVER add an analytics or error-reporting binding to this Worker.
 *      Their default configuration captures request bodies.
 *   4. Do not enable Logpush on this Worker.
 *
 * Cloudflare already terminates TLS for justintmccain.com, so this proxy adds
 * no party that was not already in the path. That is only true while the tool
 * is served from this domain — it is the reason a subdomain pointed straight at
 * Netlify, DNS-only, would be the stronger privacy posture and the weaker
 * portfolio. That trade was made deliberately.
 * ---------------------------------------------------------------------------
 */

export interface Env {
  /** Origin of the Netlify deployment, no trailing slash. Set in wrangler.toml. */
  VANISH_ORIGIN: string;
}

/** The path this Worker owns. Must match Vanish's NEXT_PUBLIC_BASE_PATH. */
const PREFIX = "/vanish";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    /* Defensive: the route pattern should mean we only ever see /vanish*, but a
       Worker that quietly proxies everything if its route is misconfigured is a
       bad failure mode for a domain that also serves a static site. */
    if (url.pathname !== PREFIX && !url.pathname.startsWith(`${PREFIX}/`)) {
      return new Response("Not found", { status: 404 });
    }

    if (!env.VANISH_ORIGIN) {
      return new Response("Vanish origin is not configured", { status: 500 });
    }

    /* The path is forwarded UNCHANGED. Netlify builds Vanish with basePath
       "/vanish", so the app expects to be addressed at /vanish/* on its own
       origin too. Rewriting the prefix off here would break every asset URL
       Next has already baked into the HTML. */
    const target = new URL(url.pathname + url.search, env.VANISH_ORIGIN);

    /* Pass method, headers and body straight through. Constructing from
       `request` keeps the body as a stream — nothing is buffered or read. */
    const proxied = new Request(target, request);

    /* Netlify needs to see its own host to route to the right site; without
       this it receives Host: justintmccain.com and cannot match a site. */
    proxied.headers.set("Host", new URL(env.VANISH_ORIGIN).host);

    /* Preserve the real client protocol/host for anything downstream that
       builds absolute URLs. Deliberately NOT X-Forwarded-For: the client IP is
       not needed to serve this app, and forwarding it would hand an identifier
       to another processor for no functional gain. */
    proxied.headers.set("X-Forwarded-Proto", url.protocol.replace(":", ""));
    proxied.headers.set("X-Forwarded-Host", url.host);

    let response: Response;
    try {
      /* redirect: "manual" so Next's own redirects (for example /vanish/ → the
         canonical /vanish) reach the browser as redirects against THIS domain,
         instead of being followed here and silently resolving to a netlify.app
         URL that the visitor would then see in the address bar. */
      response = await fetch(proxied, { redirect: "manual" });
    } catch {
      /* No error detail is surfaced or logged: an exception here can carry the
         request that caused it. Fail closed and say nothing. */
      return new Response("Vanish is temporarily unavailable.", {
        status: 502,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    const out = new Response(response.body, response);

    /* Rewrite any Location that points back at the origin, so a redirect never
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

    return out;
  },
};
