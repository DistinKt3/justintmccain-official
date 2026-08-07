import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import {
  activeBrokers,
  buildSearchUrl,
  type BrokerRecord,
} from "@/lib/brokers";
import type {
  BrokerScanResult,
  Confidence,
  Identity,
  Match,
} from "@/lib/types";

/**
 * POST /api/scan — the ONLY server-side function in Vanish. (PRD §18)
 *
 * ============================ ZERO-LOG DISCIPLINE ============================
 * This function is the single point where identity data touches a server. The
 * product's central promise depends on the rules below. Read them before
 * editing anything in this file.
 *
 *  1. NEVER log the request body, any field of it, or anything derived from it.
 *     No console.log(identity), no console.error(err) where err may carry the
 *     body, no structured logger with the payload attached.
 *  2. NEVER put identity in a URL, query string, path, or header on this side.
 *     It arrives in a POST body and stays there. This is what keeps it out of
 *     hosting/CDN access logs that we do not control.
 *  3. NEVER add an error-monitoring or analytics SDK (Sentry, LogRocket, etc.)
 *     to this route. Their default configs capture request bodies.
 *  4. Nothing is retained after the response is returned. No cache, no queue,
 *     no writes of any kind.
 *
 * If you need to debug this route, log the broker id and an error CLASS only
 * (see safeReason below) — never a value that came from the user.
 * ============================================================================
 */

// Never prerender or cache — this is a pure request/response function.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

/** Per-broker network timeout. One slow broker must never stall the scan. */
const BROKER_TIMEOUT_MS = 8000;

/** Maximum identity payload we will even look at, as a crude abuse guard. */
const MAX_FIELD_LEN = 200;

interface ScanRequestBody {
  identity?: Partial<Identity>;
}

/**
 * Reduces any thrown value to a non-identifying, safe-to-display class.
 * Deliberately does NOT pass through err.message — a fetch error message can
 * embed the request URL, which for some brokers contains the user's name.
 */
function safeReason(err: unknown): string {
  if (err instanceof DOMException && err.name === "AbortError") {
    return "Timed out";
  }
  if (err instanceof Error && err.name === "TimeoutError") {
    return "Timed out";
  }
  return "Could not reach this site";
}

function sanitize(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.slice(0, MAX_FIELD_LEN).trim();
}

function sanitizeIdentity(raw: Partial<Identity> | undefined): Identity | null {
  if (!raw) return null;
  const identity: Identity = {
    fullName: sanitize(raw.fullName),
    aliases: Array.isArray(raw.aliases)
      ? raw.aliases.slice(0, 10).map(sanitize).filter(Boolean)
      : [],
    city: sanitize(raw.city),
    state: sanitize(raw.state),
    ageRange: sanitize(raw.ageRange),
    email: sanitize(raw.email),
    phone: sanitize(raw.phone),
    priorCities: Array.isArray(raw.priorCities)
      ? raw.priorCities.slice(0, 10).map(sanitize).filter(Boolean)
      : [],
  };
  if (!identity.fullName || !identity.city || !identity.state) return null;
  return identity;
}

/* --- Confidence scoring ---------------------------------------------------
   Conservative on purpose. A false HIGH gets pre-checked on /results, which
   could send a removal request for a stranger who shares the user's name.
   Under-calling confidence is a mild annoyance; over-calling it is a harm.
   -------------------------------------------------------------------------- */

function scoreMatch(
  text: string,
  identity: Identity,
): { confidence: Confidence; matchedFields: string[] } | null {
  const haystack = text.toLowerCase();
  const matched: string[] = [];

  const name = identity.fullName.toLowerCase();
  const nameParts = name.split(/\s+/).filter(Boolean);
  const nameHit =
    haystack.includes(name) ||
    (nameParts.length > 1 &&
      nameParts.every((p) => p.length > 1 && haystack.includes(p)));
  if (nameHit) matched.push("name");

  if (identity.city && haystack.includes(identity.city.toLowerCase())) {
    matched.push("city");
  }
  if (identity.state && haystack.includes(identity.state.toLowerCase())) {
    matched.push("state");
  }
  if (identity.ageRange) {
    const [lo, hi] = identity.ageRange.split(/[-+]/);
    const low = Number(lo);
    const high = hi ? Number(hi) : low + 15;
    if (Number.isFinite(low)) {
      // Any age token in the listing that falls inside the user's stated band.
      const ages = [...haystack.matchAll(/\bage[^0-9]{0,6}(\d{2})\b/g)].map(
        (m) => Number(m[1]),
      );
      if (ages.some((a) => a >= low && a <= high)) matched.push("age");
    }
  }
  if (identity.phone) {
    const digits = identity.phone.replace(/\D/g, "");
    if (digits.length >= 7 && haystack.replace(/\D/g, "").includes(digits)) {
      matched.push("phone");
    }
  }

  if (!nameHit) return null;

  // HIGH requires the name PLUS at least two corroborating signals.
  let confidence: Confidence = "low";
  const corroborating = matched.filter((m) => m !== "name").length;
  if (corroborating >= 2) confidence = "high";
  else if (corroborating === 1) confidence = "medium";

  return { confidence, matchedFields: matched };
}

async function scanBroker(
  broker: BrokerRecord,
  identity: Identity,
): Promise<BrokerScanResult> {
  const searchUrl = buildSearchUrl(broker, identity);

  // `assisted` brokers actively refuse automated requests. We do NOT attempt
  // to work around that — no header spoofing, no proxying, no CAPTCHA
  // handling (explicitly out of scope, PRD §4.2). The user checks these in
  // their own browser, which is a normal human visit and the self-search the
  // product is built around.
  if (broker.scanStrategy === "assisted") {
    return {
      brokerId: broker.id,
      brokerName: broker.name,
      outcome: "blocked",
      reason: "This site blocks automated checks — open it yourself below.",
    };
  }

  try {
    const res = await fetch(searchUrl, {
      signal: AbortSignal.timeout(BROKER_TIMEOUT_MS),
      redirect: "follow",
      headers: { Accept: "text/html" },
      cache: "no-store",
    });

    if (res.status === 403 || res.status === 429) {
      return {
        brokerId: broker.id,
        brokerName: broker.name,
        outcome: "blocked",
        reason: "This site blocks automated checks — open it yourself below.",
      };
    }
    if (!res.ok) {
      return {
        brokerId: broker.id,
        brokerName: broker.name,
        outcome: "error",
        reason: `Site returned ${res.status}`,
      };
    }

    const html = await res.text();
    const $ = cheerio.load(html);
    $("script, style, noscript").remove();
    const text = $("body").text().replace(/\s+/g, " ");

    const scored = scoreMatch(text, identity);
    if (!scored) {
      return {
        brokerId: broker.id,
        brokerName: broker.name,
        outcome: "no-match",
      };
    }

    const match: Match = {
      id: `${broker.id}-0`,
      brokerId: broker.id,
      brokerName: broker.name,
      confidence: scored.confidence,
      listingUrl: searchUrl,
      matchedFields: scored.matchedFields,
      // Only HIGH is pre-checked. PRD §11.4 — the user must consciously
      // confirm borderline ones.
      selected: scored.confidence === "high",
    };

    return {
      brokerId: broker.id,
      brokerName: broker.name,
      outcome: "match",
      match,
    };
  } catch (err) {
    // NOTE: safeReason deliberately discards err.message — it can contain the
    // request URL, which for some brokers embeds the user's name.
    return {
      brokerId: broker.id,
      brokerName: broker.name,
      outcome: "error",
      reason: safeReason(err),
    };
  }
}

export async function POST(request: Request) {
  let body: ScanRequestBody;
  try {
    body = (await request.json()) as ScanRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Malformed request." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const identity = sanitizeIdentity(body.identity);
  if (!identity) {
    return NextResponse.json(
      { error: "Need at least a full name, city and state to search." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const brokers = activeBrokers();

  // Isolated per broker: one failure skips, it never halts the scan (PRD §20).
  const results = await Promise.all(brokers.map((b) => scanBroker(b, identity)));

  // Response is returned and nothing is retained. No writes happen anywhere
  // in this function — verify that stays true before merging any change here.
  return NextResponse.json(
    { results },
    { headers: { "Cache-Control": "no-store" } },
  );
}
