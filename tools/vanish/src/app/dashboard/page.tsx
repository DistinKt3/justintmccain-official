"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Footer, RequestChip, TopBar, ui as s } from "@/components/ui";
import { getBroker } from "@/lib/brokers";
import {
  dashboardCounts,
  useSession,
  useSessionDispatch,
} from "@/lib/session";
import type { Match } from "@/lib/types";
import d from "./dashboard.module.css";

export default function DashboardPage() {
  const router = useRouter();
  const session = useSession();
  const dispatch = useSessionDispatch();
  const [confirmingClear, setConfirmingClear] = useState(false);

  const withRequests = session.matches.filter((m) => m.request);
  const counts = dashboardCounts(session);

  useEffect(() => {
    if (withRequests.length === 0) router.replace("/results");
  }, [withRequests.length, router]);

  function clearEverything() {
    dispatch({ type: "RESET" });
    router.push("/");
  }

  return (
    <main className={s.shell}>
      <TopBar step={4} />

      <h1 className={s.h1}>Your removal requests</h1>

      <p className={`${s.mono} ${d.counts}`}>
        {counts.ready} ready &middot; {counts.sent} sent &middot; {counts.done}{" "}
        done
      </p>

      {/* The product's core promise, always visible, never behind a click. */}
      <p className={d.reminder}>
        Nothing here is stored. Closing this tab erases all of it, including
        requests you haven&rsquo;t sent yet. Download the report to keep a
        record.
      </p>

      <ul className={d.list}>
        {withRequests.map((match) => (
          <RequestRow key={match.id} match={match} />
        ))}
      </ul>

      <div className={d.footerActions}>
        <Link href="/report" className={`${s.btn} ${s.btnPrimary}`}>
          Download report
        </Link>

        {/* Inline confirmation rather than a modal. Keeps the user in context, and
            this is still just resetting a browser tab, not a server-side
            deletion. But it can discard unsent work, so it gets a step. */}
        {confirmingClear ? (
          <div className={d.confirmRow} role="group" aria-label="Confirm clear">
            <span className={d.confirmText}>
              This clears everything, including requests you haven&rsquo;t sent
              yet. Clear it?
            </span>
            <button
              className={`${s.btn} ${s.btnSecondary}`}
              onClick={clearEverything}
            >
              Clear it
            </button>
            <button
              className={`${s.btn} ${s.btnGhost}`}
              onClick={() => setConfirmingClear(false)}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            className={`${s.btn} ${s.btnSecondary}`}
            onClick={() => setConfirmingClear(true)}
          >
            Clear everything
          </button>
        )}
      </div>

      <Footer />
    </main>
  );
}

function RequestRow({ match }: { match: Match }) {
  const dispatch = useSessionDispatch();
  const [showBody, setShowBody] = useState(false);
  const [copied, setCopied] = useState(false);
  const request = match.request;
  const broker = getBroker(match.brokerId);
  if (!request) return null;

  const status = request.status;

  async function copyBody() {
    if (!request) return;
    const text = request.emailTo
      ? `To: ${request.emailTo}\nSubject: ${request.subject}\n\n${request.bodySnapshot}`
      : request.bodySnapshot;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      // Clipboard can be blocked by permissions or an insecure context.
      // Reveal the text so the user can select it by hand rather than
      // leaving them with a button that silently does nothing.
      setShowBody(true);
    }
  }

  function markStatus(next: "DISPATCHED" | "DONE") {
    dispatch({ type: "SET_REQUEST_STATUS", matchId: match.id, status: next });
  }

  return (
    <li className={`${s.card} ${d.row}`}>
      <div className={d.rowHead}>
        <div>
          <p className={d.brokerName}>{match.brokerName}</p>
          <p className={d.method}>
            {request.method === "email"
              ? `Email to ${request.emailTo}`
              : "Opt-out form on their site"}
          </p>
        </div>
        <RequestChip status={status} />
      </div>

      {broker?.manualStep === "confirmation-email" && status !== "DONE" ? (
        <p className={d.manualNote}>
          Heads up: {match.brokerName} sends a confirmation email you must click
          before the removal takes effect. Watch your inbox.
        </p>
      ) : null}

      {broker?.manualStep === "find-footer-link" && status !== "DONE" ? (
        <p className={d.manualNote}>
          {match.brokerName} doesn&rsquo;t publish a direct opt-out link. Look
          for &ldquo;Do Not Sell My Info&rdquo; in the footer of their site.
        </p>
      ) : null}

      {broker?.note ? <p className={d.brokerNote}>{broker.note}</p> : null}

      <div className={d.actions}>
        {status !== "DONE" ? (
          <>
            {request.method === "email" && request.mailtoUrl ? (
              <a
                className={`${s.btn} ${s.btnPrimary}`}
                href={request.mailtoUrl}
                onClick={() => markStatus("DISPATCHED")}
              >
                Open email
              </a>
            ) : (
              <a
                className={`${s.btn} ${s.btnPrimary}`}
                href={request.prefilledUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
                onClick={() => markStatus("DISPATCHED")}
              >
                Open opt-out form
              </a>
            )}

            {/* Always visible, never hidden behind a failure. A user whose
                mail client isn't configured needs the way out BEFORE they're
                stuck, not a recovery path they have to go find. */}
            <button className={`${s.btn} ${s.btnSecondary}`} onClick={copyBody}>
              {copied ? "Copied" : "Copy instead"}
            </button>
          </>
        ) : null}

        <button
          className={`${s.btn} ${s.btnGhost}`}
          onClick={() => setShowBody((v) => !v)}
          aria-expanded={showBody}
        >
          {showBody ? "Hide" : "View exactly what you'll send"}
        </button>

        {status === "DISPATCHED" ? (
          <button
            className={`${s.btn} ${s.btnGhost}`}
            onClick={() => markStatus("DONE")}
          >
            Mark done
          </button>
        ) : null}
        {status === "READY" ? (
          <button
            className={`${s.btn} ${s.btnGhost}`}
            onClick={() => markStatus("DISPATCHED")}
          >
            I sent this
          </button>
        ) : null}
      </div>

      {/* A phone line the broker filed with California. Worth surfacing: if
          someone's mail client won't open and their form submission fails,
          this is the route that still works. */}
      {broker?.optOutPhone && status !== "DONE" ? (
        <p className={d.phoneNote}>
          Stuck? {match.brokerName} takes removal requests by phone at{" "}
          <a href={`tel:${broker.optOutPhone.replace(/[^\d+]/g, "")}`}>
            {broker.optOutPhone}
          </a>
          .
        </p>
      ) : null}

      {showBody ? (
        <div className={d.bodyBlock}>
          {request.emailTo ? (
            <p className={d.bodyMeta}>
              <strong>To:</strong> {request.emailTo}
              <br />
              <strong>Subject:</strong> {request.subject}
            </p>
          ) : null}
          <pre className={d.bodyText}>{request.bodySnapshot}</pre>
          {request.method === "link" ? (
            <p className={d.bodyHint}>
              Their form won&rsquo;t have these fields laid out the same way.
              Copy what it asks for from the text above.
            </p>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}
