"use client";

import { useMemo, useState } from "react";
import { ui as s } from "@/components/ui";
import { useSession, useSessionDispatch } from "@/lib/session";
import { buildDirectoryEmail, buildMailtoUrl } from "@/lib/requests";
import { US_STATES } from "@/lib/validation";
import b from "./brokers.module.css";

interface Row {
  n: string;
  s: string;
  e: string;
  u: string;
  k: string;
  t?: string;
  /** HTTP status if the filed opt-out link is genuinely gone (404/5xx). */
  d?: number;
  /** Why this record was hand-corrected away from the state filing. */
  o?: string;
}

type Filter = "all" | "p" | "d";

export default function BrokerTable({
  brokers,
  peopleCount,
  dataCount,
}: {
  brokers: Row[];
  peopleCount: number;
  dataCount: number;
}) {
  const session = useSession();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return brokers.filter((row) => {
      if (filter !== "all" && row.k !== filter) return false;
      if (!q) return true;
      return (
        row.n.toLowerCase().includes(q) ||
        row.s.toLowerCase().includes(q) ||
        row.e.toLowerCase().includes(q)
      );
    });
  }, [brokers, query, filter]);

  // Deliberately NOT hasIdentity(), which also requires an age range. Age is
  // there to tell you apart from a namesake in a search result, and the
  // directory does no searching. Demanding it here would ask for a detail we
  // have no use for and then still show "not personalised" once given.
  const { fullName, city, email } = session.identity;
  const personalised = Boolean(fullName && city && email);

  return (
    <section className={b.tableSection}>
      <Personalise personalised={personalised} />

      <div className={b.controls}>
        <div className={b.searchWrap}>
          <label className={s.srOnly} htmlFor="broker-search">
            Search brokers by name, website or email
          </label>
          <input
            id="broker-search"
            className={s.input}
            type="search"
            placeholder="Search by company, site or email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div
          className={b.filters}
          role="group"
          aria-label="Filter by broker type"
        >
          {(
            [
              ["all", `All ${brokers.length}`],
              ["p", `Look yourself up (${peopleCount})`],
              ["d", `Behind the scenes (${dataCount})`],
            ] as [Filter, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              className={`${b.filterBtn} ${filter === value ? b.filterOn : ""}`}
              onClick={() => setFilter(value)}
              aria-pressed={filter === value}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <p className={b.countLine} role="status" aria-live="polite">
        {shown.length === brokers.length
          ? `Showing all ${brokers.length}`
          : `${shown.length} of ${brokers.length}`}
      </p>

      {filter === "d" || filter === "all" ? (
        <p className={b.kindHint}>
          &ldquo;Behind the scenes&rdquo; brokers have no public search page, so
          you cannot look yourself up on them. They still hold and sell data
          about you, and opting out still works. There is just nothing to find
          first.
        </p>
      ) : null}

      {shown.length === 0 ? (
        <p className={b.empty}>
          Nothing matches &ldquo;{query}&rdquo;. Try part of the company name, or
          a domain like <code>acxiom.com</code>.
        </p>
      ) : (
        <ul className={b.list}>
          {shown.map((row, i) => (
            <BrokerRow key={row.n + i} row={row} />
          ))}
        </ul>
      )}
    </section>
  );
}

/* --- Personalisation -------------------------------------------------------
   Lets someone who landed here directly get prefilled requests without walking
   the whole flow. Same session state as everything else, so it is never
   written anywhere.
   -------------------------------------------------------------------------- */

function Personalise({ personalised }: { personalised: boolean }) {
  const session = useSession();
  const dispatch = useSessionDispatch();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({
    fullName: session.identity.fullName,
    city: session.identity.city,
    state: session.identity.state,
    email: session.identity.email,
  });

  function save(e: React.FormEvent) {
    e.preventDefault();
    dispatch({
      type: "SET_IDENTITY",
      identity: { ...session.identity, ...draft },
    });
    setOpen(false);
  }

  if (personalised && !open) {
    return (
      <p className={b.personalOn}>
        Requests below are filled in for{" "}
        <strong>{session.identity.fullName}</strong>.{" "}
        <button className={b.linkBtn} onClick={() => setOpen(true)}>
          Change
        </button>
      </p>
    );
  }

  if (!open) {
    return (
      <div className={b.personalPrompt}>
        <p className={b.personalCopy}>
          Add your name and city and every email below arrives already written,
          with your details in it. It stays in this tab and is never sent
          anywhere.
        </p>
        <button
          className={`${s.btn} ${s.btnSecondary}`}
          onClick={() => setOpen(true)}
        >
          Fill in my details
        </button>
      </div>
    );
  }

  return (
    <form className={b.personalForm} onSubmit={save}>
      <div className={b.personalRow}>
        <label className={s.srOnly} htmlFor="pd-name">
          Full name
        </label>
        <input
          id="pd-name"
          className={s.input}
          placeholder="Full name"
          value={draft.fullName}
          onChange={(e) => setDraft({ ...draft, fullName: e.target.value })}
        />
        <label className={s.srOnly} htmlFor="pd-city">
          City
        </label>
        <input
          id="pd-city"
          className={s.input}
          placeholder="City"
          value={draft.city}
          onChange={(e) => setDraft({ ...draft, city: e.target.value })}
        />
        <label className={s.srOnly} htmlFor="pd-state">
          State
        </label>
        <select
          id="pd-state"
          className={s.select}
          value={draft.state}
          onChange={(e) => setDraft({ ...draft, state: e.target.value })}
        >
          <option value="">State</option>
          {US_STATES.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>
        <label className={s.srOnly} htmlFor="pd-email">
          Email
        </label>
        <input
          id="pd-email"
          type="email"
          className={s.input}
          placeholder="Your email"
          value={draft.email}
          onChange={(e) => setDraft({ ...draft, email: e.target.value })}
        />
      </div>
      <div className={b.personalActions}>
        <button type="submit" className={`${s.btn} ${s.btnPrimary}`}>
          Use these details
        </button>
        <button
          type="button"
          className={`${s.btn} ${s.btnGhost}`}
          onClick={() => setOpen(false)}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

/* --- Row -------------------------------------------------------------------- */

function BrokerRow({ row }: { row: Row }) {
  const session = useSession();
  const [copied, setCopied] = useState(false);

  const { subject, body } = buildDirectoryEmail(row.n, session.identity);
  const mailto = row.e ? buildMailtoUrl(row.e, subject, body) : "";

  async function copy() {
    try {
      await navigator.clipboard.writeText(
        `To: ${row.e}\nSubject: ${subject}\n\n${body}`,
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      /* clipboard can be blocked; the mailto link still works */
    }
  }

  return (
    <li className={b.row}>
      <div className={b.rowMain}>
        <p className={b.rowName}>
          {row.n}
          {row.k === "p" ? <span className={b.tagPeople}>Searchable</span> : null}
        </p>
        {row.s ? (
          <a
            className={b.rowSite}
            href={row.s}
            target="_blank"
            rel="noopener noreferrer nofollow"
          >
            {row.s.replace(/^https?:\/\//, "").replace(/\/$/, "")}
          </a>
        ) : null}
        {row.t ? <p className={b.rowText}>{row.t}</p> : null}

        {/* A filed link that now 404s. Say so rather than sending someone to a
            broken page and letting them conclude the opt-out is impossible. */}
        {row.d ? (
          <p className={b.deadNote}>
            The opt-out link this company filed with the state is broken (
            {row.d}). Email them instead, or look for &ldquo;Do Not Sell My
            Info&rdquo; in their site footer.
          </p>
        ) : null}

        {row.o ? <p className={b.fixedNote}>Corrected by us: {row.o}</p> : null}
      </div>

      <div className={b.rowActions}>
        {row.u && !row.d ? (
          <a
            className={`${s.btn} ${s.btnSecondary} ${b.optBtn}`}
            href={row.u}
            target="_blank"
            rel="noopener noreferrer nofollow"
          >
            Opt-out page &rarr;
          </a>
        ) : null}

        {mailto ? (
          <>
            <a
              className={`${s.btn} ${row.d || !row.u ? s.btnPrimary : s.btnSecondary} ${b.optBtn}`}
              href={mailto}
            >
              Email request
            </a>
            <button className={b.copyBtn} onClick={copy}>
              {copied ? "Copied" : "Copy text"}
            </button>
          </>
        ) : null}

        {row.e ? <span className={b.rowEmail}>{row.e}</span> : null}
      </div>
    </li>
  );
}
