#!/usr/bin/env node
/**
 * Builds src/data/registry.json from the California data broker registry.
 *
 *   node scripts/build-registry.mjs            fetch, pick, validate, write
 *   node scripts/build-registry.mjs --no-check skip the HTTP validation pass
 *
 * Re-run this when brokers re-register, which they do annually.
 *
 * Two things this does that a plain CSV-to-JSON conversion does not:
 *
 * 1. PICKS the right URL. 56 filings list more than one link, and the first
 *    one is often a privacy policy rather than the actual opt-out form. Oracle
 *    files both a policy page and datacloudoptout.oracle.com; only the second
 *    one is any use to somebody trying to opt out. URLs are scored, not taken
 *    in document order.
 *
 * 2. CHECKS that the link still works. The filings themselves go stale: First
 *    Movers Advantage registered fmadata.com/do-not-sell-my-personal-information,
 *    which now returns 404, while their real form sits at /opt-out-requests/new.
 *    Being state-filed makes a URL authoritative, not correct. Anything that
 *    fails here is marked dead so the page can warn instead of sending someone
 *    to a broken link.
 */

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { gzipSync } from "node:zlib";

const CSV_URL =
  "https://cppa.ca.gov/data_broker_registry/complete-reg-data-brokers.csv";
const OUT = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "src",
  "data",
  "registry.json",
);

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

/**
 * Hand-corrections for filings we know are wrong. Keep this list short and
 * always say who checked and when. It is a liability, not a feature. Anything
 * here is a claim we are making on our own authority rather than the state's.
 */
const OVERRIDES = {
  "fmadata.com": {
    url: "https://www.fmadata.com/opt-out-requests/new",
    why: "Filed URL /do-not-sell-my-personal-information returns 404. Confirmed working 2026-08-06.",
  },
};

function parseCSV(text) {
  const rows = [];
  let row = [],
    field = "",
    inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") field += c;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

const clean = (s) => (s || "").replace(/\s+/g, " ").trim();
const deObfuscate = (s) => clean(s).replace(/\s*\[at\]\s*/gi, "@");

/**
 * Higher score = more likely to be the page that actually starts an opt-out,
 * rather than a policy that merely describes one.
 */
function scoreUrl(url) {
  const u = url.toLowerCase();
  let score = 0;
  if (/opt[-_]?out|donotsell|do[-_]not[-_]sell|dns[a-z]*request/.test(u))
    score += 100;
  if (/privacy[-_]?(request|choice|center|portal|rights)/.test(u)) score += 60;
  if (/\b(dsar|ccpa|cpra|gdpr)\b/.test(u)) score += 40;
  if (/request|form|submit|remove|removal|suppress|delete/.test(u)) score += 30;
  if (/subdomain|^https?:\/\/(optout|privacy|datacloudoptout)\./.test(u))
    score += 20;
  // policies describe rights; they rarely let you exercise one
  if (/privacy[-_]?policy|\/legal\/|\/terms|policy\.html?$/.test(u)) score -= 50;
  if (/#/.test(u)) score += 5; // an anchor usually points at the right section
  return score;
}

function pickOptOutUrl(text) {
  const urls = [
    ...new Set(
      (text.match(/https?:\/\/[^\s,)"'<>]+/g) || []).map((u) =>
        u.replace(/[.,;:]+$/, ""),
    ),
    ),
  ];
  if (!urls.length) return "";
  return urls.sort((a, b) => scoreUrl(b) - scoreUrl(a))[0];
}

async function checkUrl(url) {
  try {
    const res = await fetch(url, {
      headers: { Accept: "text/html", "User-Agent": UA },
      redirect: "follow",
      signal: AbortSignal.timeout(12000),
    });
    return { status: res.status, final: res.url };
  } catch (err) {
    // A broker that blocks bots is not a broken link. A person with a browser
    // gets through fine. Only genuine 4xx/5xx should be treated as dead.
    return { status: err.name === "TimeoutError" ? "timeout" : "error" };
  }
}

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++;
        out[idx] = await fn(items[idx], idx);
      }
    }),
  );
  return out;
}

const PEOPLE_SEARCH =
  /people ?search|people ?find|background ?check|public ?record|reverse ?phone|phone ?lookup|find ?people|person ?search|lookup|directory|whitepages|spokeo|intelius|nuwber|radaris|peekyou|catfish|dialer|searchbug|gladiknow|truthfinder|checkmate|beenverified/i;

async function main() {
  const doCheck = !process.argv.includes("--no-check");
  process.stdout.write("fetching CPPA registry… ");
  const csv = await (
    await fetch(CSV_URL, { headers: { "User-Agent": UA } })
  ).text();
  const rows = parseCSV(csv)
    .slice(1)
    .filter((r) => r.length > 4 && clean(r[0]));
  console.log(`${rows.length} filings`);

  const brokers = rows.map((r) => {
    const optOutText = clean(r[4]);
    const site = clean(r[2]).split(/\s/)[0].replace(/[.,]$/, "");
    let host = "";
    try {
      host = new URL(site).hostname.replace(/^www\./, "");
    } catch {
      /* some filings have no parseable site */
    }

    let url = pickOptOutUrl(optOutText);
    let override = null;
    if (OVERRIDES[host]) {
      override = OVERRIDES[host].why;
      url = OVERRIDES[host].url;
    }

    const b = {
      n: clean(r[0]),
      s: site,
      e: deObfuscate(r[1]),
      u: url,
      k: PEOPLE_SEARCH.test([r[0], r[2], r[4], r[6]].join(" ")) ? "p" : "d",
    };
    // Carry the filing text only when there is no link. Otherwise it is
    // boilerplate that triples the payload for no benefit.
    if (!url && optOutText)
      b.t = optOutText.length > 240 ? optOutText.slice(0, 237) + "…" : optOutText;
    if (override) b.o = override;
    return b;
  });

  if (doCheck) {
    const withUrl = brokers.filter((b) => b.u);
    console.log(`checking ${withUrl.length} opt-out links…`);
    let done = 0;
    let blocked = 0;
    await mapLimit(withUrl, 10, async (b) => {
      const r = await checkUrl(b.u);
      // 401/403/429 mean "no bots", not "no page". A person with a browser
      // gets through, and most of this industry answers us this way. Marking
      // these dead would steer users away from links that work perfectly
      // well, which is the same false-negative trap as reporting an
      // unreadable page as "no match".
      if (r.status === 401 || r.status === 403 || r.status === 429) {
        blocked++;
      } else if (typeof r.status === "number" && r.status >= 400) {
        b.d = r.status; // genuinely gone: surfaced in the UI as a warning
      } else if (r.final && r.final !== b.u) {
        b.u = r.final; // follow the redirect once, at build time
      }
      if (++done % 100 === 0)
        process.stdout.write(`  ${done}/${withUrl.length}\n`);
    });
    const dead = brokers.filter((b) => b.d);
    console.log(
      `link check done: ${dead.length} genuinely dead, ${blocked} bot-blocked (fine for humans)`,
    );
    dead.forEach((b) => console.log(`  ${b.d}  ${b.n} → ${b.u}`));
  }

  brokers.sort((a, b) =>
    a.k === b.k ? a.n.localeCompare(b.n) : a.k === "p" ? -1 : 1,
  );

  const payload = {
    source: {
      name: "California Privacy Protection Agency Data Broker Registry",
      url: "https://cppa.ca.gov/data_broker_registry/",
      dataUrl: CSV_URL,
      statute: "California Delete Act (SB 362)",
      retrieved: new Date().toISOString().slice(0, 10),
      linksChecked: doCheck,
    },
    counts: {
      total: brokers.length,
      peopleSearch: brokers.filter((b) => b.k === "p").length,
      dataBroker: brokers.filter((b) => b.k === "d").length,
      withOptOutUrl: brokers.filter((b) => b.u).length,
      deadLinks: brokers.filter((b) => b.d).length,
      corrected: brokers.filter((b) => b.o).length,
    },
    brokers,
  };

  writeFileSync(OUT, JSON.stringify(payload));
  const raw = Buffer.byteLength(JSON.stringify(payload));
  const gz = gzipSync(JSON.stringify(payload)).length;
  console.log(
    `\nwrote ${OUT}\n  ${(raw / 1024).toFixed(0)}KB raw / ${(gz / 1024).toFixed(0)}KB gzipped`,
  );
  console.log("  " + JSON.stringify(payload.counts));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
