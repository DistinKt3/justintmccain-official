"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ConfidenceBadge, Footer, TopBar, ui as s } from "@/components/ui";
import { buildSearchUrl, getBroker } from "@/lib/brokers";
import { buildRequest } from "@/lib/requests";
import { selectedMatches, useSession, useSessionDispatch } from "@/lib/session";
import type { GeneratedRequest, Match } from "@/lib/types";
import v from "./results.module.css";

export default function ResultsPage() {
  const router = useRouter();
  const session = useSession();
  const dispatch = useSessionDispatch();

  const blocked = useMemo(
    () => session.scanResults.filter((r) => r.outcome === "blocked"),
    [session.scanResults],
  );
  const checked = session.scanResults.length;

  useEffect(() => {
    if (session.scanResults.length === 0) router.replace("/scan");
  }, [session.scanResults.length, router]);

  const selected = selectedMatches(session);

  function prepare() {
    if (selected.length === 0) return;
    const requests: Record<string, GeneratedRequest> = {};
    for (const match of selected) {
      const broker = getBroker(match.brokerId);
      if (!broker) continue;
      requests[match.id] = buildRequest(broker, match, session);
    }
    dispatch({ type: "ATTACH_REQUESTS", requests });
    router.push("/dashboard");
  }

  const foundNothing = session.matches.length === 0 && blocked.length === 0;

  return (
    <main className={s.shell}>
      <TopBar step={3} />

      {foundNothing ? (
        <EmptyState checked={checked} />
      ) : (
        <>
          <h1 className={s.h1}>
            {session.matches.length > 0
              ? `We found you on ${session.matches.length} ${
                  session.matches.length === 1 ? "site" : "sites"
                }. Confirm which are you.`
              : "Confirm which listings are you."}
          </h1>
          <p className={s.lede}>
            Open each listing and check it&rsquo;s really you before requesting
            removal &mdash; some listings belong to a different person with your
            name.
          </p>
        </>
      )}

      {session.matches.length > 0 ? (
        <ul className={v.list}>
          {session.matches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              onToggle={() =>
                dispatch({ type: "TOGGLE_MATCH", matchId: match.id })
              }
            />
          ))}
        </ul>
      ) : null}

      {blocked.length > 0 ? (
        <AssistedSection count={blocked.length} />
      ) : null}

      {!foundNothing ? (
        <div className={s.stickyFooter}>
          <p className={s.mono}>
            {selected.length} selected
          </p>
          <button
            className={`${s.btn} ${s.btnPrimary}`}
            onClick={prepare}
            disabled={selected.length === 0}
          >
            Prepare removals
          </button>
        </div>
      ) : null}

      <Footer />
    </main>
  );
}

/* --- Empty state ----------------------------------------------------------
   Finding nothing is a GOOD outcome here, and the easiest thing to
   accidentally ship looking like a failure. No error styling of any kind.
   -------------------------------------------------------------------------- */

function EmptyState({ checked }: { checked: number }) {
  return (
    <section className={v.empty}>
      <span className={v.emptyMark} aria-hidden="true" />
      <h1 className={s.h1}>
        Good news &mdash; we didn&rsquo;t find you on any of the {checked} sites
        we checked.
      </h1>
      <p className={s.lede}>
        That doesn&rsquo;t mean you&rsquo;re invisible everywhere, but these
        brokers have nothing on you right now. A clean scan is still worth
        keeping a record of.
      </p>
      <div className={v.emptyActions}>
        <Link href="/report" className={`${s.btn} ${s.btnPrimary}`}>
          Download the record
        </Link>
        <Link href="/scan" className={`${s.btn} ${s.btnSecondary}`}>
          Search again with other names
        </Link>
      </div>
    </section>
  );
}

/* --- Assisted checks ------------------------------------------------------
   Brokers that refuse automated requests. Vanish does not try to get around
   that; the user opens the search themselves — a normal visit from their own
   browser — and pastes back the listing URL if they find one.
   -------------------------------------------------------------------------- */

function AssistedSection({ count }: { count: number }) {
  const session = useSession();
  const dispatch = useSessionDispatch();
  const blocked = session.scanResults.filter((r) => r.outcome === "blocked");

  return (
    <section className={v.assisted}>
      <h2 className={s.h2}>
        {count} {count === 1 ? "site needs" : "sites need"} a quick look from you
      </h2>
      <p className={s.help}>
        These brokers block automated checks, so Vanish can&rsquo;t search them
        for you. Open each one, search for yourself, and if you find your
        listing, paste its address back here &mdash; then we&rsquo;ll write the
        removal request the same as any other.
      </p>

      <ul className={v.list}>
        {blocked.map((result) => {
          const broker = getBroker(result.brokerId);
          if (!broker) return null;
          const already = session.matches.find(
            (m) => m.brokerId === broker.id,
          );
          return (
            <li key={broker.id} className={`${s.card} ${v.assistedCard}`}>
              <div className={v.cardHead}>
                <span className={v.brokerName}>
                  {broker.name}
                  {broker.freeToView ? (
                    <span className={v.freeTag}>Free to view</span>
                  ) : (
                    <span className={v.paidTag}>May ask you to pay</span>
                  )}
                </span>
                <a
                  className={v.viewLink}
                  href={buildSearchUrl(broker, session.identity)}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                >
                  Search {broker.name} &rarr;
                </a>
              </div>
              {broker.note ? (
                <p className={v.brokerNote}>{broker.note}</p>
              ) : null}
              {already ? (
                <p className={v.addedNote}>
                  Added. It&rsquo;s in your list above.
                </p>
              ) : (
                <PasteListing
                  onAdd={(url) => {
                    const match: Match = {
                      id: `${broker.id}-manual`,
                      brokerId: broker.id,
                      brokerName: broker.name,
                      // The user looked at it themselves — that is the
                      // strongest confirmation available in this product.
                      confidence: "high",
                      listingUrl: url,
                      matchedFields: ["confirmed by you"],
                      selected: true,
                    };
                    dispatch({ type: "ADD_MANUAL_MATCH", match });
                  }}
                />
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function PasteListing({ onAdd }: { onAdd: (url: string) => void }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) {
      setError("Paste the address of your listing to add it.");
      return;
    }
    if (!/^https?:\/\//i.test(trimmed)) {
      setError("That should start with https:// — copy it from your address bar.");
      return;
    }
    setError("");
    onAdd(trimmed);
  }

  return (
    <form className={v.pasteRow} onSubmit={submit}>
      <input
        className={`${s.input} ${error ? s.inputError : ""}`}
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Paste your listing's address"
        aria-label="Listing address"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? "paste-error" : undefined}
      />
      <button type="submit" className={`${s.btn} ${s.btnSecondary}`}>
        Add it
      </button>
      {error ? (
        <span className={s.fieldError} id="paste-error" role="alert">
          {error}
        </span>
      ) : null}
    </form>
  );
}

/* --- Match card ----------------------------------------------------------- */

function MatchCard({
  match,
  onToggle,
}: {
  match: Match;
  onToggle: () => void;
}) {
  const inputId = `match-${match.id}`;
  return (
    <li className={`${s.card} ${v.matchCard}`}>
      <div className={v.matchMain}>
        <input
          id={inputId}
          type="checkbox"
          className={s.checkbox}
          checked={match.selected}
          onChange={onToggle}
        />
        <div className={v.matchBody}>
          <label className={v.matchLabel} htmlFor={inputId}>
            {match.brokerName}
          </label>
          <p className={v.matchFields}>
            Matched on {match.matchedFields.join(", ")}
          </p>
        </div>
        <div className={v.matchMeta}>
          <ConfidenceBadge level={match.confidence} />
          <a
            className={v.viewLink}
            href={match.listingUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
          >
            View listing &rarr;
          </a>
        </div>
      </div>
    </li>
  );
}
