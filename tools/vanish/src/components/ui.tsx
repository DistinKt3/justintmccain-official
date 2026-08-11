import Link from "next/link";
import type { ReactNode } from "react";
import type { Confidence, RequestStatus, ScanOutcome } from "@/lib/types";
import s from "./ui.module.css";

export { s as ui };

/* --- Wordmark -------------------------------------------------------------
   The mark is the node atom rendered as a left-to-right opacity fade:
   erasure rather than capture, the visual inverse of the JTM brand's node.
   -------------------------------------------------------------------------- */

export function Wordmark({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className={s.wordmark} aria-label="Vanish, home">
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

/**
 * Footer identity block.
 *
 * Mirrors the three tiers of the portfolio footer on justintmccain.com, below
 * this app's own resources nav, so Vanish, the Metadata Scrubber and the
 * landing page read as one system instead of three separate projects:
 *
 *   0. resources nav      — Vanish only
 *   1. identity · elsewhere-links
 *   2. the note specific to THIS surface (here: where the broker data is from)
 *   3. copyright
 *
 * The canonical wording lives in the portfolio's `build/content.mjs`
 * (IDENTITY + FOOTER). This app builds independently, so those strings are
 * duplicated here by necessity. Change the name, role or copyright line and
 * you must change it in all three places — here, `build/content.mjs`, and the
 * Scrubber's `src/components/Footer.tsx`.
 *
 * The CPPA provenance line stays because it is a real attribution obligation,
 * not decoration: the registry is public data republished here, and saying so
 * is the difference between citing a source and quietly passing it off.
 */

const PORTFOLIO = "https://justintmccain.com";
const LINKEDIN = "https://www.linkedin.com/in/justintmccain/";
const EMAIL = "JustinTMcCain@protonmail.com";

/* Constant, not new Date().getFullYear(). This footer is server-rendered, and
   a runtime year can disagree between server and client across a New Year
   boundary — a hydration mismatch for the sake of a number nobody reads. */
const YEAR = "2026";

export function Footer() {
  return (
    <footer className={s.siteFooter}>
      <nav className={s.footerLinks} aria-label="Resources">
        <Link href="/brokers">Every registered data broker (549)</Link>
        <span className={s.footerDot} aria-hidden="true">
          ·
        </span>
        <Link href="/about">What Vanish is &amp; isn&rsquo;t</Link>
      </nav>

      <div className={s.footerTop}>
        <p className={s.footerId}>
          <span className={s.footerName}>Justin T. McCain</span>
          <span className={s.footerDot} aria-hidden="true">
            ·
          </span>
          <span>Privacy Product Leader</span>
        </p>

        <nav className={s.footerElsewhere} aria-label="Elsewhere">
          <a href={PORTFOLIO} target="_blank" rel="noopener noreferrer">
            Portfolio
          </a>
          <span className={s.footerDot} aria-hidden="true">
            ·
          </span>
          <a href={LINKEDIN} target="_blank" rel="noopener noreferrer">
            LinkedIn
          </a>
          <span className={s.footerDot} aria-hidden="true">
            ·
          </span>
          {/* The address itself, not the word "Email" — matching the portfolio
              footer. A visible address can be copied without clicking. */}
          <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
        </nav>
      </div>

      <p className={s.footerCredit}>
        Also built:{" "}
        <a href={`${PORTFOLIO}/scrubber/`} target="_blank" rel="noopener noreferrer">
          Metadata Scrubber
        </a>{" "}
        — see what your photos say about you, then strip it.
      </p>

      <p className={s.footerCredit}>
        Broker data from the{" "}
        <a
          href="https://cppa.ca.gov/data_broker_registry/"
          target="_blank"
          rel="noopener noreferrer"
        >
          California Privacy Protection Agency
        </a>{" "}
        registry, published under the Delete Act. Reorganized, not authored by
        us.
      </p>

      <p className={s.footerCopy}>
        © {YEAR} Justin T. McCain. Built with respect for your attention and
        your data.
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
  error: "Error, skipped",
  blocked: "Blocked, skipped",
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
