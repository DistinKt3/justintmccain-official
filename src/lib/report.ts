/**
 * VANISH — PDF report generator
 *
 * Runs entirely in the browser. The user's identity never touches a server to
 * produce this file — jsPDF builds the bytes locally and the browser saves
 * them. This is the ONLY record that survives closing the tab (PRD §11.6).
 *
 * Rendered on Evidence Paper: the brand's light "ledger" surface, used exactly
 * as documented — proof/record content goes light, everything else stays dark.
 */

import { jsPDF } from "jspdf";
import { getBroker } from "./brokers";
import type { SessionState } from "./types";

/* Evidence Paper palette, from the design tokens. */
const PAPER: [number, number, number] = [245, 243, 237];
const INK: [number, number, number] = [20, 24, 29];
const MINT_INK: [number, number, number] = [11, 107, 88];
const RULE: [number, number, number] = [200, 196, 186];
const MUTED: [number, number, number] = [110, 112, 108];

const MARGIN = 46;
const PAGE_W = 595.28; // A4 portrait, points
const PAGE_H = 841.89;
const CONTENT_W = PAGE_W - MARGIN * 2;

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function buildReport(session: SessionState): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  let y = MARGIN;

  function paintPage() {
    doc.setFillColor(...PAPER);
    doc.rect(0, 0, PAGE_W, PAGE_H, "F");
  }

  function newPage() {
    doc.addPage();
    paintPage();
    y = MARGIN;
  }

  function need(space: number) {
    if (y + space > PAGE_H - MARGIN) newPage();
  }

  function rule(gap = 10) {
    need(gap + 6);
    doc.setDrawColor(...RULE);
    doc.setLineWidth(0.6);
    doc.line(MARGIN, y, PAGE_W - MARGIN, y);
    y += gap;
  }

  function heading(text: string, size = 13) {
    need(size + 14);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(size);
    doc.setTextColor(...INK);
    doc.text(text, MARGIN, y);
    y += size + 6;
  }

  function body(text: string, opts: { muted?: boolean; size?: number } = {}) {
    const size = opts.size ?? 9.5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
    doc.setTextColor(...(opts.muted ? MUTED : INK));
    const lines = doc.splitTextToSize(text, CONTENT_W) as string[];
    for (const line of lines) {
      need(size + 4);
      doc.text(line, MARGIN, y);
      y += size + 3.5;
    }
  }

  function kv(label: string, value: string) {
    const size = 9.5;
    need(size + 4);
    doc.setFont("courier", "normal");
    doc.setFontSize(size);
    doc.setTextColor(...MUTED);
    doc.text(label, MARGIN, y);
    doc.setTextColor(...INK);
    const lines = doc.splitTextToSize(value, CONTENT_W - 130) as string[];
    doc.text(lines[0] ?? "", MARGIN + 130, y);
    y += size + 3.5;
    for (const extra of lines.slice(1)) {
      need(size + 4);
      doc.text(extra, MARGIN + 130, y);
      y += size + 3.5;
    }
  }

  paintPage();

  /* --- Masthead --------------------------------------------------------- */
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...INK);
  doc.text("VANISH", MARGIN, y);
  y += 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MINT_INK);
  doc.text("Data removal record", MARGIN, y);
  y += 16;
  rule(14);

  body(
    "This is your record of what was searched, what was found, and exactly what you sent. Vanish stored none of it — this file is the only copy.",
    { muted: true },
  );
  y += 8;

  /* --- Identity --------------------------------------------------------- */
  heading("Who this record is for");
  kv("Name", session.identity.fullName || "—");
  if (session.identity.aliases.length) {
    kv("Other names", session.identity.aliases.join(", "));
  }
  kv(
    "Location",
    `${session.identity.city}${
      session.identity.state ? `, ${session.identity.state}` : ""
    }`,
  );
  if (session.identity.priorCities.length) {
    kv("Previous", session.identity.priorCities.join("; "));
  }
  kv("Age range", session.identity.ageRange || "—");
  kv("Contact email", session.identity.email || "—");
  if (session.identity.phone) kv("Phone", session.identity.phone);
  y += 6;

  /* --- Authorization ---------------------------------------------------- */
  heading("Authorization");
  kv("Granted", fmtDate(session.consentAt));
  kv("Legal basis", "CCPA / CPRA — consumer acting on own behalf");
  y += 2;
  body(session.consentText, { muted: true });
  y += 8;
  rule(14);

  /* --- Every broker searched, found or not ------------------------------ */
  heading("Every site checked");
  body(
    "Included in full — sites that had nothing on you are part of the record too.",
    { muted: true, size: 8.5 },
  );
  y += 6;

  for (const result of session.scanResults) {
    need(26);
    doc.setFont("courier", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...INK);
    doc.text(result.brokerName, MARGIN, y);

    const label =
      result.outcome === "match"
        ? "MATCH FOUND"
        : result.outcome === "no-match"
          ? "no match"
          : result.outcome === "blocked"
            ? "blocked automated check"
            : "error — skipped";
    doc.setTextColor(...(result.outcome === "match" ? MINT_INK : MUTED));
    doc.text(label, MARGIN + 220, y);
    y += 13;
  }
  y += 10;
  rule(14);

  /* --- Requests --------------------------------------------------------- */
  const withRequests = session.matches.filter((m) => m.request);
  heading("Removal requests");

  if (withRequests.length === 0) {
    body("No removal requests were prepared in this session.", { muted: true });
  }

  for (const match of withRequests) {
    const request = match.request;
    if (!request) continue;
    const broker = getBroker(match.brokerId);

    need(70);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...INK);
    doc.text(match.brokerName, MARGIN, y);
    y += 14;

    kv("Status", request.status);
    kv(
      "Method",
      request.method === "email"
        ? `Email to ${request.emailTo ?? "—"}`
        : `Opt-out form — ${request.prefilledUrl ?? "—"}`,
    );
    kv("Listing", match.listingUrl);
    kv("Confidence", match.confidence.toUpperCase());
    if (broker?.manualStep) kv("Follow-up needed", broker.manualStep);
    y += 4;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...MUTED);
    need(14);
    doc.text("WHAT YOU SENT", MARGIN, y);
    y += 11;

    doc.setFont("courier", "normal");
    doc.setFontSize(7.8);
    doc.setTextColor(...INK);
    for (const rawLine of request.bodySnapshot.split("\n")) {
      const wrapped = doc.splitTextToSize(
        rawLine || " ",
        CONTENT_W - 10,
      ) as string[];
      for (const line of wrapped) {
        need(11);
        doc.text(line, MARGIN + 8, y);
        y += 9.6;
      }
    }
    y += 10;
    rule(12);
  }

  /* --- What happens next ------------------------------------------------ */
  heading("What happens next");
  body(
    "Vanish cannot watch for the brokers' replies — it has no access to your inbox and keeps no record of you. Confirmations arrive in your own email. Some brokers require you to click a confirmation link before the removal takes effect, so check your inbox and spam folder.",
    { muted: true },
  );
  y += 4;
  body(
    "Listings can reappear as brokers ingest new public records. Re-running a scan every few months is worth doing.",
    { muted: true },
  );

  /* --- Footer on every page --------------------------------------------- */
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont("courier", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(
      `Generated ${fmtDate(new Date().toISOString())}  ·  vanish  ·  nothing about this record was stored`,
      MARGIN,
      PAGE_H - 26,
    );
    doc.text(`${i} / ${pages}`, PAGE_W - MARGIN - 24, PAGE_H - 26);
  }

  return doc;
}

export function reportFilename(session: SessionState): string {
  const name = session.identity.fullName
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-]/g, "")
    .toLowerCase();
  const date = new Date().toISOString().slice(0, 10);
  return `vanish-removal-record-${name || "report"}-${date}.pdf`;
}

export function downloadReport(session: SessionState): void {
  buildReport(session).save(reportFilename(session));
}
