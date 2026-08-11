import type { Identity } from "./types";

/**
 * Validation messages are written to the product's voice: plain, specific, and
 * about the user's situation, never "Invalid input". Design spec §3.2.
 */

export type FieldErrors = Partial<Record<keyof Identity, string>>;

/** Deliberately permissive. This gate exists to catch typos, not to police
 *  address formats. A false rejection on a real email is worse than a
 *  loose pattern, since the user's own email is where broker replies land. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", "HI",
  "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN",
  "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH",
  "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA",
  "WV", "WI", "WY",
] as const;

export const AGE_RANGES = [
  "18-24",
  "25-29",
  "30-39",
  "40-49",
  "50-59",
  "60-69",
  "70+",
] as const;

export function validateIdentity(identity: Identity): FieldErrors {
  const errors: FieldErrors = {};

  if (!identity.fullName.trim()) {
    errors.fullName = "We need this to search for you.";
  } else if (!identity.fullName.trim().includes(" ")) {
    errors.fullName =
      "Add a last name too. Brokers index by full name, so a first name on its own returns everyone.";
  }

  if (!identity.city.trim()) {
    errors.city = "We need this to search for you.";
  }

  if (!identity.state.trim()) {
    errors.state = identity.city.trim()
      ? "Which state? Brokers index by state, so this narrows the search."
      : "We need this to search for you.";
  }

  if (!identity.ageRange.trim()) {
    errors.ageRange = "We need this to search for you.";
  }

  if (!identity.email.trim()) {
    errors.email = "We need this to search for you.";
  } else if (!EMAIL.test(identity.email.trim())) {
    errors.email = "Doesn't look like a full email address. Check for typos.";
  }

  return errors;
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
