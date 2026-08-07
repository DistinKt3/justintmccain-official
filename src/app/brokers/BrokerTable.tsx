"use client";

import { useMemo, useState } from "react";
import { ui as s } from "@/components/ui";
import b from "./brokers.module.css";

interface Row {
  n: string;
  s: string;
  e: string;
  u: string;
  k: string;
  t?: string;
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

  return (
    <section className={b.tableSection}>
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
          &ldquo;Behind the scenes&rdquo; brokers have no public search page
          &mdash; you can&rsquo;t look yourself up on them, but they still hold
          and sell data about you. Opting out is still worth doing; there&rsquo;s
          just nothing to find first.
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
            <li key={row.n + i} className={b.row}>
              <div className={b.rowMain}>
                <p className={b.rowName}>
                  {row.n}
                  {row.k === "p" ? (
                    <span className={b.tagPeople}>Searchable</span>
                  ) : null}
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
              </div>

              <div className={b.rowActions}>
                {row.u ? (
                  <a
                    className={`${s.btn} ${s.btnSecondary} ${b.optBtn}`}
                    href={row.u}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                  >
                    Opt out &rarr;
                  </a>
                ) : null}
                {row.e ? (
                  <a className={b.rowEmail} href={`mailto:${row.e}`}>
                    {row.e}
                  </a>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
