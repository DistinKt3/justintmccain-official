"use client";

/**
 * VANISH — Session state
 *
 * The entire run lives in this reducer, in browser memory, for the lifetime of
 * the tab. There is no persistence layer by design (PRD §5, §14).
 *
 * Deliberately NOT used anywhere in this file: localStorage, sessionStorage,
 * document.cookie, IndexedDB. Adding any of them silently breaks the product's
 * core promise. "Clear everything" is just a RESET action.
 */

import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";
import {
  CONSENT_TEXT,
  INITIAL_SESSION,
  type BrokerScanResult,
  type FlowStatus,
  type GeneratedRequest,
  type Identity,
  type Match,
  type RequestStatus,
  type SessionState,
} from "./types";

export type SessionAction =
  | { type: "SET_IDENTITY"; identity: Identity }
  | { type: "GRANT_CONSENT" }
  | { type: "REVOKE_CONSENT" }
  | { type: "SET_STATUS"; status: FlowStatus }
  | { type: "START_SCAN" }
  | { type: "SCAN_COMPLETE"; results: BrokerScanResult[] }
  | { type: "SCAN_FAILED"; message: string }
  | { type: "ADD_MANUAL_MATCH"; match: Match }
  | { type: "TOGGLE_MATCH"; matchId: string }
  | { type: "SET_ALL_MATCHES"; selected: boolean }
  | { type: "ATTACH_REQUESTS"; requests: Record<string, GeneratedRequest> }
  | { type: "SET_REQUEST_STATUS"; matchId: string; status: RequestStatus }
  | { type: "RESET" };

function sessionReducer(
  state: SessionState,
  action: SessionAction,
): SessionState {
  switch (action.type) {
    case "SET_IDENTITY":
      return { ...state, identity: action.identity };

    case "GRANT_CONSENT":
      // Timestamp is captured at the moment of the click, in session memory
      // only. It exists to be shown back to the user in the report, not to
      // be stored anywhere.
      return {
        ...state,
        consentText: CONSENT_TEXT,
        consentAt: new Date().toISOString(),
      };

    case "REVOKE_CONSENT":
      return { ...state, consentAt: null };

    case "SET_STATUS":
      return { ...state, status: action.status };

    case "START_SCAN":
      return {
        ...state,
        status: "scanning",
        matches: [],
        scanResults: [],
        scanError: null,
      };

    case "SCAN_COMPLETE": {
      const matches = action.results
        .filter((r) => r.outcome === "match" && r.match)
        .map((r) => r.match as Match);
      return {
        ...state,
        status: "review",
        scanResults: action.results,
        matches,
        scanError: null,
      };
    }

    case "SCAN_FAILED":
      return { ...state, status: "intake", scanError: action.message };

    case "ADD_MANUAL_MATCH": {
      // A listing the user found themselves on a broker that blocks automated
      // checks. Their own eyes are the strongest confirmation this product
      // has, so it lands as a normal match and flips that broker's scan
      // result from "blocked" to "match" for the report's audit trail.
      if (state.matches.some((m) => m.id === action.match.id)) return state;
      return {
        ...state,
        matches: [...state.matches, action.match],
        scanResults: state.scanResults.map((r) =>
          r.brokerId === action.match.brokerId
            ? { ...r, outcome: "match", match: action.match, reason: undefined }
            : r,
        ),
      };
    }

    case "TOGGLE_MATCH":
      return {
        ...state,
        matches: state.matches.map((m) =>
          m.id === action.matchId ? { ...m, selected: !m.selected } : m,
        ),
      };

    case "SET_ALL_MATCHES":
      return {
        ...state,
        matches: state.matches.map((m) => ({ ...m, selected: action.selected })),
      };

    case "ATTACH_REQUESTS":
      return {
        ...state,
        status: "acting",
        matches: state.matches.map((m) =>
          action.requests[m.id] ? { ...m, request: action.requests[m.id] } : m,
        ),
      };

    case "SET_REQUEST_STATUS":
      return {
        ...state,
        matches: state.matches.map((m) =>
          m.id === action.matchId && m.request
            ? {
                ...m,
                request: {
                  ...m.request,
                  status: action.status,
                  dispatched:
                    action.status === "DISPATCHED" || action.status === "DONE",
                },
              }
            : m,
        ),
      };

    case "RESET":
      // Total purge. There is nothing else to clear — no server call needed,
      // no storage to evict. This is the whole of "Clear everything".
      return INITIAL_SESSION;

    default:
      return state;
  }
}

const SessionStateContext = createContext<SessionState | null>(null);
const SessionDispatchContext = createContext<Dispatch<SessionAction> | null>(
  null,
);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(sessionReducer, INITIAL_SESSION);
  const memoState = useMemo(() => state, [state]);
  return (
    <SessionStateContext.Provider value={memoState}>
      <SessionDispatchContext.Provider value={dispatch}>
        {children}
      </SessionDispatchContext.Provider>
    </SessionStateContext.Provider>
  );
}

export function useSession(): SessionState {
  const ctx = useContext(SessionStateContext);
  if (!ctx) throw new Error("useSession must be used within a SessionProvider");
  return ctx;
}

export function useSessionDispatch(): Dispatch<SessionAction> {
  const ctx = useContext(SessionDispatchContext);
  if (!ctx)
    throw new Error("useSessionDispatch must be used within a SessionProvider");
  return ctx;
}

/* --- Derived helpers ------------------------------------------------------ */

export function hasIdentity(state: SessionState): boolean {
  const { fullName, city, state: st, ageRange, email } = state.identity;
  return Boolean(fullName && city && st && ageRange && email);
}

export function canScan(state: SessionState): boolean {
  return hasIdentity(state) && Boolean(state.consentAt);
}

export function selectedMatches(state: SessionState): Match[] {
  return state.matches.filter((m) => m.selected);
}

export function dashboardCounts(state: SessionState) {
  const withRequests = state.matches.filter((m) => m.request);
  return {
    ready: withRequests.filter((m) => m.request?.status === "READY").length,
    sent: withRequests.filter((m) => m.request?.status === "DISPATCHED").length,
    done: withRequests.filter((m) => m.request?.status === "DONE").length,
    total: withRequests.length,
  };
}
