#!/usr/bin/env node
/**
 * Justin T. McCain — SIGNAL · local preview server
 * ================================================
 *
 *     node tools/serve.mjs [port]        # default 4173
 *
 * Zero dependencies (Node built-ins only).
 *
 * WHY THIS EXISTS INSTEAD OF `python3 -m http.server`:
 *
 *   The scroll-scrubbed master film seeks constantly — every scroll event sets
 *   video.currentTime. Seeking requires the server to honour HTTP Range
 *   requests (206 Partial Content). Python's SimpleHTTPRequestHandler does NOT
 *   implement Range: it answers every request with a 200 and the whole file.
 *   The browser then reports the video as `seekable: [0, 0]` and silently
 *   refuses to move off frame 0 — the film loads, reports readyState 4, and
 *   simply never scrubs. It looks like a broken scrubber, not a broken server.
 *
 *   So: preview with this, not with python. And note the same requirement
 *   applies in production — any host must serve Range (Netlify, Vercel,
 *   Cloudflare, S3+CloudFront, nginx and Apache all do by default).
 */

import { createServer } from "node:http";
import { createReadStream, statSync, existsSync, readFileSync } from "node:fs";
import { join, extname, normalize } from "node:path";
import { fileURLToPath } from "node:url";

/* Serve site/, the same directory Cloudflare Pages publishes. This file lives
   in build/ precisely so it is not one of the things being served. */
const ROOT = join(fileURLToPath(import.meta.url), "..", "..", "site");
const PORT = Number(process.argv[2]) || 4173;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".woff2": "font/woff2",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

/* ---------------------------------------------------------------------------
 * Apply site/_headers locally.
 *
 * The production CSP is strict enough to break the page if anything is missed
 * (default-src 'none', inline script pinned by hash). Discovering that after
 * deploying is the wrong order, and duplicating the policy here would let the
 * two drift. So we parse the same file Cloudflare Pages will read.
 *
 * Cloudflare's semantics, approximated: rules apply in file order and later
 * matches override earlier ones for the same header name.
 * ------------------------------------------------------------------------- */
function loadHeaderRules() {
  const f = join(ROOT, "_headers");
  if (!existsSync(f)) return [];
  const rules = [];
  let current = null;
  for (const raw of readFileSync(f, "utf8").split("\n")) {
    if (!raw.trim() || raw.trim().startsWith("#")) continue;
    if (!/^\s/.test(raw)) {
      current = { pattern: raw.trim(), headers: [] };
      rules.push(current);
    } else if (current) {
      const i = raw.indexOf(":");
      if (i > 0) current.headers.push([raw.slice(0, i).trim(), raw.slice(i + 1).trim()]);
    }
  }
  return rules;
}
const HEADER_RULES = loadHeaderRules();

function headersFor(urlPath) {
  const out = {};
  for (const r of HEADER_RULES) {
    const p = r.pattern;
    const hit = p.endsWith("*") ? urlPath.startsWith(p.slice(0, -1)) : urlPath === p;
    if (hit) for (const [k, v] of r.headers) out[k] = v;
  }
  return out;
}

createServer((req, res) => {
  let path = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (path.endsWith("/")) path += "index.html";

  /* Extensionless path → the matching .html file.
     Cloudflare Workers Static Assets serves privacy.html at /privacy and
     307-redirects /privacy.html to it, so /privacy is the canonical URL and it
     is what build.mjs now links to. Without this the local preview 404s on the
     footer's own Privacy link.

     This MUST run before `file` and `policy` are derived below — both are
     computed from `path`, so rewriting it afterwards would leave them pointing
     at the extensionless path that does not exist on disk. */
  if (!extname(path)) {
    const direct = join(ROOT, normalize(path).replace(/^(\.\.[/\\])+/, ""));
    const asHtml = join(ROOT, normalize(`${path}.html`).replace(/^(\.\.[/\\])+/, ""));
    if (!existsSync(direct) && asHtml.startsWith(ROOT) && existsSync(asHtml)) {
      path = `${path}.html`;
    }
  }

  const policy = headersFor(path);

  // Contain everything under ROOT — no traversal out of the site directory.
  const file = join(ROOT, normalize(path).replace(/^(\.\.[/\\])+/, ""));

  /* Directory without a trailing slash → 301 to the slashed form, which the
     line above then resolves to index.html. This is what Cloudflare Pages does
     for /scrubber, and without it the local preview 404s on exactly the URL a
     visitor is most likely to type. A preview that disagrees with production
     about a real URL is worse than no preview. */
  if (
    file.startsWith(ROOT) &&
    !path.endsWith("/index.html") &&
    existsSync(file) &&
    statSync(file).isDirectory()
  ) {
    const search = new URL(req.url, "http://x").search;
    res.writeHead(301, { Location: `${path}/${search}` });
    return res.end();
  }

  if (!file.startsWith(ROOT) || !existsSync(file) || statSync(file).isDirectory()) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    return res.end("404");
  }

  const { size } = statSync(file);
  const type = TYPES[extname(file).toLowerCase()] || "application/octet-stream";
  const range = req.headers.range;

  // 206 Partial Content — this is the branch that makes video scrubbing work.
  if (range) {
    const m = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
    if (m) {
      let start = m[1] === "" ? null : parseInt(m[1], 10);
      let end = m[2] === "" ? null : parseInt(m[2], 10);
      if (start === null) { start = size - end; end = size - 1; }   // suffix range
      if (end === null || end >= size) end = size - 1;

      if (Number.isNaN(start) || start > end || start >= size) {
        res.writeHead(416, { "Content-Range": `bytes */${size}` });
        return res.end();
      }
      res.writeHead(206, {
        ...policy,
        "Content-Type": type,
        "Content-Length": end - start + 1,
        "Content-Range": `bytes ${start}-${end}/${size}`,
        "Accept-Ranges": "bytes",
        // local preview always revalidates, whatever _headers says about
        // production caching — otherwise an edit appears not to have worked
        "Cache-Control": "no-cache",
      });
      return createReadStream(file, { start, end }).pipe(res);
    }
  }

  res.writeHead(200, {
    ...policy,
    "Content-Type": type,
    "Content-Length": size,
    "Accept-Ranges": "bytes",
    "Cache-Control": "no-cache",
  });
  createReadStream(file).pipe(res);
}).listen(PORT, () => {
  console.log(`SIGNAL preview  →  http://localhost:${PORT}   (Range requests enabled)`);
});
