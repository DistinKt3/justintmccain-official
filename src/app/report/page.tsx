"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getBroker } from "@/lib/brokers";
import { downloadReport } from "@/lib/report";
import { useSession } from "@/lib/session";
import { ui as s } from "@/components/ui";
import p from "./report.module.css";

/**
 * The one screen rendered on Evidence Paper (light). Proof and record content
 * goes light; everything else in the product stays dark. This is what the user
 * actually keeps after the tab closes, so it gets the art direction.
 */
export default function ReportPage() {
  const router = useRouter();
  const session = useSession();
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (session.scanResults.length === 0) router.replace("/scan");
  }, [session.scanResults.length, router]);

  const withRequests = session.matches.filter((m) => m.request);

  function download() {
    setDownloading(true);
    setError("");
    try {
      downloadReport(session);
    } catch {
      setError(
        "The download didn't start. Your browser may be blocking it — try again, or use your browser's print-to-PDF on this page.",
      );
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className={p.paper}>
      <main className={p.sheet}>
        <header className={p.masthead}>
          {/* The masthead carries the page's H1 — every screen needs one, and
              on a printed record the title IS the masthead. */}
          <div>
            <h1 className={p.wordmark}>VANISH</h1>
            <p className={p.subtitle}>Data removal record</p>
          </div>
          <Link href="/dashboard" className={p.backLink}>
            &larr; Back to requests
          </Link>
        </header>

        <p className={p.callout}>
          This is the only record that survives closing this tab. Download it.
        </p>

        <div className={p.actions}>
          <button
            className={p.primaryBtn}
            onClick={download}
            disabled={downloading}
          >
            {downloading ? "Preparing…" : "Download PDF"}
          </button>
        </div>

        {error ? (
          <p className={p.error} role="alert">
            {error}
          </p>
        ) : null}

        <section className={p.section}>
          <h2 className={p.h2}>Who this record is for</h2>
          <dl className={p.ledger}>
            <Row label="Name" value={session.identity.fullName || "—"} />
            {session.identity.aliases.length ? (
              <Row
                label="Other names"
                value={session.identity.aliases.join(", ")}
              />
            ) : null}
            <Row
              label="Location"
              value={`${session.identity.city}${
                session.identity.state ? `, ${session.identity.state}` : ""
              }`}
            />
            <Row label="Age range" value={session.identity.ageRange || "—"} />
            <Row label="Contact email" value={session.identity.email || "—"} />
            <Row
              label="Authorized"
              value={
                session.consentAt
                  ? new Date(session.consentAt).toLocaleString()
                  : "—"
              }
            />
          </dl>
        </section>

        <section className={p.section}>
          <h2 className={p.h2}>Every site checked</h2>
          <ul className={p.checkList}>
            {session.scanResults.map((result) => (
              <li key={result.brokerId} className={p.checkRow}>
                <span>{result.brokerName}</span>
                <span
                  className={
                    result.outcome === "match" ? p.outcomeMatch : p.outcomeMuted
                  }
                >
                  {result.outcome === "match"
                    ? "Match found"
                    : result.outcome === "no-match"
                      ? "No match"
                      : result.outcome === "blocked"
                        ? "Blocked automated check"
                        : "Error — skipped"}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className={p.section}>
          <h2 className={p.h2}>Removal requests</h2>
          {withRequests.length === 0 ? (
            <p className={p.muted}>
              No removal requests were prepared in this session.
            </p>
          ) : (
            withRequests.map((match) => {
              const broker = getBroker(match.brokerId);
              return (
                <article key={match.id} className={p.request}>
                  <h3 className={p.h3}>{match.brokerName}</h3>
                  <dl className={p.ledger}>
                    <Row label="Status" value={match.request?.status ?? "—"} />
                    <Row
                      label="Method"
                      value={
                        match.request?.method === "email"
                          ? `Email to ${match.request?.emailTo}`
                          : "Opt-out form on their site"
                      }
                    />
                    <Row label="Listing" value={match.listingUrl} />
                    {broker?.manualStep ? (
                      <Row label="Follow-up" value={broker.manualStep} />
                    ) : null}
                  </dl>
                  <p className={p.snippetLabel}>What you sent</p>
                  <pre className={p.snippet}>{match.request?.bodySnapshot}</pre>
                </article>
              );
            })
          )}
        </section>

        <section className={p.section}>
          <h2 className={p.h2}>What happens next</h2>
          <p className={p.muted}>
            Vanish can&rsquo;t watch for the brokers&rsquo; replies — it has no
            access to your inbox and keeps no record of you. Confirmations
            arrive in your own email, and some brokers need you to click a
            confirmation link before the removal takes effect. Check your spam
            folder too.
          </p>
          <p className={p.muted}>
            Listings can reappear as brokers take in new public records.
            Re-running a scan every few months is worth doing.
          </p>
        </section>

        <footer className={p.footer}>
          <span className={s.srOnly}>End of record.</span>
          Generated by Vanish · nothing about this record was stored
        </footer>
      </main>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className={p.ledgerRow}>
      <dt className={p.ledgerLabel}>{label}</dt>
      <dd className={p.ledgerValue}>{value}</dd>
    </div>
  );
}
