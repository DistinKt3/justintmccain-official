import Link from "next/link";
import type { ReactNode } from "react";
import type { Confidence, RequestStatus, ScanOutcome } from "@/lib/types";
import s from "./ui.module.css";

export { s as ui };

/* --- Wordmark -------------------------------------------------------------
   The mark is the node atom rendered as a left-to-right opacity fade:
   erasure, not capture — the visual inverse of the JTM brand's solid node.
   -------------------------------------------------------------------------- */

export function Wordmark({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className={s.wordmark} aria-label="Vanish — home">
      <span className={s.markFade} aria-hidden="true">
        <span className={s.markDot} />
        <span className={s.markDot} />
        <span className={s.markDot} />
        <span className={s.markDot} />
      </span>
      VANISH
    </Link>
  );
}

/** Derived from the route, never stored. Landing and report aren't steps. */
export function StepIndicator({ step }: { step: 1 | 2 | 3 | 4 }) {
  return <p className={s.step}>Step {step} of 4</p>;
}

export function TopBar({
  step,
  children,
}: {
  step?: 1 | 2 | 3 | 4;
  children?: ReactNode;
}) {
  return (
    <header className={s.topBar}>
      <Wordmark />
      {step ? <StepIndicator step={step} /> : null}
      {children}
    </header>
  );
}

export function Footer() {
  return (
    <footer className={s.siteFooter}>
      <p>
        A SIGNAL project by{" "}
        <a
          href="https://justintmccain.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          Justin T. McCain
        </a>
        .
      </p>
    </footer>
  );
}

/* --- Status chip ---------------------------------------------------------- */

const scanChipClass: Record<ScanOutcome | "searching", string> = {
  searching: s.chipSearching,
  match: s.chipMatch,
  "no-match": s.chipNoMatch,
  error: s.chipError,
  blocked: s.chipError,
};

const scanChipLabel: Record<ScanOutcome | "searching", string> = {
  searching: "Searching",
  match: "Match found",
  "no-match": "No match",
  error: "Error — skipped",
  blocked: "Blocked — skipped",
};

export function ScanChip({ state }: { state: ScanOutcome | "searching" }) {
  return (
    <span className={`${s.chip} ${scanChipClass[state]}`}>
      {state === "searching" ? <span className={s.pulseDot} /> : null}
      {scanChipLabel[state]}
    </span>
  );
}

const requestChipClass: Record<RequestStatus, string> = {
  FOUND: s.chipReady,
  READY: s.chipReady,
  DISPATCHED: s.chipSent,
  DONE: s.chipDone,
};

const requestChipLabel: Record<RequestStatus, string> = {
  FOUND: "Found",
  READY: "Ready",
  DISPATCHED: "Sent",
  DONE: "Done",
};

export function RequestChip({ status }: { status: RequestStatus }) {
  return (
    <span className={`${s.chip} ${requestChipClass[status]}`}>
      {requestChipLabel[status]}
    </span>
  );
}

/* --- Confidence badge ----------------------------------------------------- */

const badgeClass: Record<Confidence, string> = {
  high: s.badgeHigh,
  medium: s.badgeMedium,
  low: s.badgeLow,
};

const badgeLabel: Record<Confidence, string> = {
  high: "High",
  medium: "Med",
  low: "Low",
};

export function ConfidenceBadge({ level }: { level: Confidence }) {
  return (
    <span className={`${s.badge} ${badgeClass[level]}`}>
      <span className={s.srOnly}>Match confidence: </span>
      {badgeLabel[level]}
    </span>
  );
}
