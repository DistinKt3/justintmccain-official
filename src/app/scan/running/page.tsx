"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ScanChip, TopBar, ui as s } from "@/components/ui";
import { activeBrokers } from "@/lib/brokers";
import { canScan, useSession, useSessionDispatch } from "@/lib/session";
import type { BrokerScanResult, ScanOutcome } from "@/lib/types";
import r from "./running.module.css";

/** Rows resolve at a staggered, human pace so the list reads as progress
 *  rather than flashing complete. Real work happens in one request; this
 *  paces the reveal, it does not fake the result. */
const REVEAL_MS = 420;

export default function ScanRunningPage() {
  const router = useRouter();
  const session = useSession();
  const dispatch = useSessionDispatch();

  const brokers = activeBrokers();
  const [resolved, setResolved] = useState<Record<string, ScanOutcome>>({});
  const [done, setDone] = useState(0);

  useEffect(() => {
    // A user who lands here without completing intake goes back, not into a
    // broken scan.
    if (!canScan(session)) {
      router.replace("/scan");
      return;
    }

    // Each mount owns its own controller and its own fetch. Deliberately NOT
    // guarded by a ref that survives remount: React StrictMode mounts, cleans
    // up, then mounts again in development, and a surviving "already started"
    // flag would let the cleanup abort the only request we ever send — the
    // scan would hang at 0 forever. The same would happen on any genuine
    // remount. The abort signal alone is the right staleness guard: a stale
    // response is discarded below, and a fresh mount simply scans again.
    // /api/scan is side-effect-free, so running it twice in dev costs nothing.
    const controller = new AbortController();
    let timers: ReturnType<typeof setTimeout>[] = [];

    dispatch({ type: "START_SCAN" });

    (async () => {
      try {
        const res = await fetch("/api/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // Identity travels in the BODY only — never a query string, so it
          // cannot land in hosting or CDN access logs.
          body: JSON.stringify({ identity: session.identity }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const detail = (await res.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(detail?.error ?? "The scan could not be completed.");
        }

        const data = (await res.json()) as { results: BrokerScanResult[] };

        // A response that landed after this mount was torn down belongs to a
        // navigation the user already left. Drop it rather than driving the
        // UI of a screen that no longer exists.
        if (controller.signal.aborted) return;

        data.results.forEach((result, i) => {
          timers.push(
            setTimeout(
              () => {
                setResolved((prev) => ({
                  ...prev,
                  [result.brokerId]: result.outcome,
                }));
                setDone((n) => n + 1);
              },
              REVEAL_MS * (i + 1),
            ),
          );
        });

        timers.push(
          setTimeout(
            () => {
              dispatch({ type: "SCAN_COMPLETE", results: data.results });
              router.push("/results");
            },
            REVEAL_MS * (data.results.length + 1),
          ),
        );
      } catch (err) {
        if (controller.signal.aborted) return;
        dispatch({
          type: "SCAN_FAILED",
          message:
            err instanceof Error
              ? err.message
              : "The scan could not be completed.",
        });
        router.replace("/scan");
      }
    })();

    return () => {
      controller.abort();
      timers.forEach(clearTimeout);
      timers = [];
    };
    // Runs per mount. Leaving mid-scan aborts the in-flight request so a
    // stale response can't land after the user has navigated away.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = brokers.length;
  const matches = Object.values(resolved).filter((o) => o === "match").length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <main className={s.shell}>
      <TopBar step={2} />

      <h1 className={s.h1}>Scanning&hellip;</h1>

      <div className={r.progressHead}>
        <p className={s.mono} aria-hidden="true">
          Searched {done} of {total} sites &middot; {matches}{" "}
          {matches === 1 ? "match" : "matches"} so far
        </p>
        {/* Eased fill, never a hard jump — broker timing is uneven and an
            eased bar reads as "still working" rather than "stalled". */}
        <div
          className={r.track}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Scan progress: searched ${done} of ${total} sites, ${matches} matches so far`}
        >
          <div className={r.fill} style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Screen readers get the running count without the bar's noise */}
      <p className={s.srOnly} role="status" aria-live="polite">
        Searched {done} of {total} sites. {matches} matches so far.
      </p>

      <ul className={r.list}>
        {brokers.map((broker) => {
          const state = resolved[broker.id];
          return (
            <li
              key={broker.id}
              className={`${r.row} ${state ? r.rowIn : ""}`}
              data-resolved={state ? "true" : "false"}
            >
              <span className={r.brokerName}>{broker.name}</span>
              <ScanChip state={state ?? "searching"} />
            </li>
          );
        })}
      </ul>
    </main>
  );
}
