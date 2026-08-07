/**
 * VANISH — Request generator (PRD §17)
 *
 * Builds the removal request the USER will dispatch. Vanish transmits nothing:
 * there is no email service provider, no server-side submission, no queue.
 * Everything here is pure client-side string building.
 *
 * The `bodySnapshot` is shown to the user verbatim before they send it. That
 * transparency is a product requirement, not a nicety — the user is the sender
 * and is entitled to read exactly what goes out under their name.
 */

import type { BrokerRecord } from "./brokers";
import type { GeneratedRequest, Match, SessionState } from "./types";

/** mailto: has real length limits in some clients (~2000 chars is the safe
 *  ceiling in practice). The body below stays well inside that. */
export function buildEmailBody(
  broker: BrokerRecord,
  match: Match,
  session: SessionState,
): string {
  const { identity } = session;
  const lines: string[] = [];

  lines.push(
    `To the ${broker.name} privacy team,`,
    "",
    `I am writing to request the removal of my personal information from ${broker.name}, and to opt out of the sale and sharing of that information.`,
    "",
    `I am making this request on my own behalf as the consumer whose information is listed, under the California Consumer Privacy Act as amended by the CPRA, and any other state privacy law that applies to me.`,
    "",
    "The listing I am asking you to remove:",
    `  ${match.listingUrl}`,
    "",
    "To identify the record:",
    `  Name: ${identity.fullName}`,
  );

  if (identity.aliases.length > 0) {
    lines.push(`  Other names used: ${identity.aliases.join(", ")}`);
  }

  lines.push(`  City and state: ${identity.city}, ${identity.state}`);

  if (identity.priorCities.length > 0) {
    lines.push(`  Previous locations: ${identity.priorCities.join("; ")}`);
  }

  lines.push(
    `  Age range: ${identity.ageRange}`,
    `  Email for your reply: ${identity.email}`,
  );

  if (identity.phone) {
    lines.push(`  Phone: ${identity.phone}`);
  }

  lines.push(
    "",
    "Please:",
    "  1. Remove this listing from public display and search results.",
    "  2. Opt me out of any sale or sharing of my personal information.",
    "  3. Suppress this record so it is not re-listed from future data sources.",
    "  4. Confirm in writing to the email address above once this is done.",
    "",
    "I am providing the details above solely to let you locate and remove my record. Please do not use them for any other purpose, and do not add them to any marketing or data product.",
    "",
    "Thank you,",
    identity.fullName,
  );

  return lines.join("\n");
}

export function buildSubject(broker: BrokerRecord, name: string): string {
  return `Personal information removal and opt-out request — ${name} (${broker.name})`;
}

/**
 * mailto: URLs must be fully percent-encoded, and encodeURIComponent leaves
 * a few characters RFC 6068 wants escaped. Getting this wrong silently
 * truncates the body in some mail clients, which would send an incomplete
 * legal request — hence the extra pass.
 */
function encodeMailtoComponent(value: string): string {
  return encodeURIComponent(value)
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29")
    .replace(/\*/g, "%2A")
    .replace(/!/g, "%21");
}

export function buildMailtoUrl(
  to: string,
  subject: string,
  body: string,
): string {
  return `mailto:${to}?subject=${encodeMailtoComponent(
    subject,
  )}&body=${encodeMailtoComponent(body)}`;
}

export function buildRequest(
  broker: BrokerRecord,
  match: Match,
  session: SessionState,
): GeneratedRequest {
  const body = buildEmailBody(broker, match, session);
  const subject = buildSubject(broker, session.identity.fullName);

  // Prefer the broker's own opt-out form when they publish one — a form
  // submission is what their process is built around and gets handled fastest.
  // Email is the fallback, and the authorized-agent route when no form exists.
  if (broker.optOutMethod === "link") {
    return {
      method: "link",
      prefilledUrl: broker.optOutUrl,
      emailTo: broker.emailTo,
      subject,
      bodySnapshot: body,
      dispatched: false,
      status: "READY",
    };
  }

  const to = broker.emailTo ?? "";
  return {
    method: "email",
    mailtoUrl: buildMailtoUrl(to, subject, body),
    emailTo: to,
    subject,
    bodySnapshot: body,
    dispatched: false,
    status: "READY",
  };
}
