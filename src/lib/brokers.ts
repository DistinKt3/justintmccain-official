/**
 * VANISH — Broker registry loader
 *
 * Static, version-controlled reference data. Read-only. Never user data.
 */

import registry from "@/data/brokers.json";

export type ScanStrategy = "html-parse" | "assisted";

export interface BrokerRecord {
  id: string;
  name: string;
  category: "people-search";
  searchUrl: string;
  scanStrategy: ScanStrategy;
  matchStrategy: string;
  optOutMethod: "email" | "link";
  optOutUrl: string;
  emailTo?: string;
  requiredFields: string[];
  manualStep: string | null;
  legalBasis: string;
  rateLimitMs: number;
  enabled: boolean;
  verifiedAt?: string;
  note?: string;
}

const ALL: BrokerRecord[] = (registry.brokers as BrokerRecord[]).map((b) => ({
  ...b,
  manualStep: b.manualStep ?? null,
}));

/** Only brokers whose opt-out details have been verified against the live site. */
export function activeBrokers(): BrokerRecord[] {
  return ALL.filter((b) => b.enabled);
}

/** Includes staged/unverified records — for admin views and docs only. */
export function allBrokers(): BrokerRecord[] {
  return ALL;
}

export function getBroker(id: string): BrokerRecord | undefined {
  return ALL.find((b) => b.id === id);
}

/* --- URL building ---------------------------------------------------------
   Identity values are URL-encoded into a search link the USER opens in their
   own browser. This never leaves the client for `assisted` brokers, so the
   broker sees a normal human visit from the user's own IP — not a scrape,
   and not Vanish's server acting on their behalf.
   ------------------------------------------------------------------------ */

function slug(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-]/g, "");
}

export function buildSearchUrl(
  broker: BrokerRecord,
  identity: {
    fullName: string;
    city: string;
    state: string;
  },
): string {
  const parts = identity.fullName.trim().split(/\s+/);
  const firstName = parts[0] ?? "";
  const lastName = parts.length > 1 ? parts[parts.length - 1] : "";

  return broker.searchUrl
    .replace("{name}", slug(identity.fullName))
    .replace("{firstName}", slug(firstName))
    .replace("{lastName}", slug(lastName))
    .replace("{city}", encodeURIComponent(identity.city.trim()))
    .replace("{state}", encodeURIComponent(identity.state.trim().toUpperCase()));
}
