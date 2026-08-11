/**
 * VANISH: Core types
 *
 * Mirrors PRD §13 (Client-Side Session State) exactly.
 *
 * ARCHITECTURAL INVARIANT: none of this is ever persisted. No localStorage,
 * no sessionStorage, no cookies, no IndexedDB, no server round-trip except
 * the single stateless POST /api/scan. Closing the tab is the purge.
 * If you are about to write any of these types to a store, stop. That is
 * the v1.1 line and it is a deliberate product decision, not an oversight.
 */

export type FlowStatus = "intake" | "scanning" | "review" | "acting" | "done";

export type Confidence = "high" | "medium" | "low";

export type OptOutMethod = "email" | "link";

/** Display-only. Vanish never observes a broker's reply. See PRD §15. */
export type RequestStatus = "FOUND" | "READY" | "DISPATCHED" | "DONE";

export interface Identity {
  fullName: string;
  aliases: string[];
  city: string;
  state: string;
  ageRange: string;
  email: string;
  phone?: string;
  priorCities: string[];
}

/** Static registry record: version-controlled JSON, not user data. */
export interface Broker {
  id: string;
  name: string;
  category: "people-search";
  /** Public search URL template. {name}/{state}/{city} are substituted. */
  searchUrl: string;
  matchStrategy: "html-parse";
  optOutMethod: OptOutMethod;
  optOutUrl: string;
  /** Broker privacy contact. The USER emails this; Vanish never sends. */
  emailTo?: string;
  requiredFields: string[];
  /** Extra hoop the user must clear after sending, e.g. a confirmation email. */
  manualStep: string | null;
  legalBasis: "CCPA" | "CPRA" | "CCPA/CPRA";
  rateLimitMs: number;
  enabled: boolean;
  /** Human note surfaced in the UI when a broker has a known quirk. */
  note?: string;
  /** Verification provenance: when this record's opt-out data was last checked. */
  verifiedAt?: string;
}

export interface GeneratedRequest {
  method: OptOutMethod;
  mailtoUrl?: string;
  prefilledUrl?: string;
  /** Exactly what the user will send. Shown verbatim before dispatch. */
  bodySnapshot: string;
  subject?: string;
  emailTo?: string;
  dispatched: boolean;
  status: RequestStatus;
}

export interface Match {
  id: string;
  brokerId: string;
  brokerName: string;
  confidence: Confidence;
  listingUrl: string;
  matchedFields: string[];
  selected: boolean;
  request?: GeneratedRequest;
}

/** Per-broker outcome of the scan, including the ones that found nothing. */
export type ScanOutcome = "match" | "no-match" | "error" | "blocked";

export interface BrokerScanResult {
  brokerId: string;
  brokerName: string;
  outcome: ScanOutcome;
  /** Present only when outcome === "match". */
  match?: Match;
  /** Non-identifying reason, safe to display and safe to log. */
  reason?: string;
}

export interface SessionState {
  consentText: string;
  consentAt: string | null;
  status: FlowStatus;
  identity: Identity;
  matches: Match[];
  /** Every broker searched, found or not. The report needs the full audit. */
  scanResults: BrokerScanResult[];
  scanError: string | null;
}

/** The exact consent language from PRD §11.2. Do not reword; it is the
 *  legal hinge for authorized-agent status under CCPA/CPRA. */
export const CONSENT_TEXT =
  "I authorize Vanish to submit opt-out and deletion requests for my own personal information on my behalf.";

export const EMPTY_IDENTITY: Identity = {
  fullName: "",
  aliases: [],
  city: "",
  state: "",
  ageRange: "",
  email: "",
  phone: "",
  priorCities: [],
};

export const INITIAL_SESSION: SessionState = {
  consentText: CONSENT_TEXT,
  consentAt: null,
  status: "intake",
  identity: EMPTY_IDENTITY,
  matches: [],
  scanResults: [],
  scanError: null,
};
