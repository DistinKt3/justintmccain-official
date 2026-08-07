"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Footer, TopBar, ui as s } from "@/components/ui";
import { useSession, useSessionDispatch } from "@/lib/session";
import type { Identity } from "@/lib/types";
import { CONSENT_TEXT } from "@/lib/types";
import {
  AGE_RANGES,
  US_STATES,
  hasErrors,
  validateIdentity,
  type FieldErrors,
} from "@/lib/validation";
import f from "./scan.module.css";

export default function IntakePage() {
  const router = useRouter();
  const session = useSession();
  const dispatch = useSessionDispatch();

  // Seeded from session so navigating BACK to this screen never loses work
  // (design spec §3.0) — SessionState lives above the router.
  const [identity, setIdentity] = useState<Identity>(session.identity);
  const [consented, setConsented] = useState(Boolean(session.consentAt));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const lastAliasRef = useRef<HTMLInputElement | null>(null);
  const focusNewAlias = useRef(false);

  // Added repeatable fields scroll into view on mobile — a field that appears
  // off-screen is a common one-handed form failure (design spec §3.0).
  useEffect(() => {
    if (focusNewAlias.current && lastAliasRef.current) {
      lastAliasRef.current.focus();
      lastAliasRef.current.scrollIntoView({ block: "center" });
      focusNewAlias.current = false;
    }
  });

  function set<K extends keyof Identity>(key: K, value: Identity[K]) {
    const next = { ...identity, [key]: value };
    setIdentity(next);
    if (submitted) setErrors(validateIdentity(next));
  }

  function setListItem(
    key: "aliases" | "priorCities",
    index: number,
    value: string,
  ) {
    const list = [...identity[key]];
    list[index] = value;
    set(key, list);
  }

  function addListItem(key: "aliases" | "priorCities") {
    focusNewAlias.current = true;
    set(key, [...identity[key], ""]);
  }

  function removeListItem(key: "aliases" | "priorCities", index: number) {
    set(
      key,
      identity[key].filter((_, i) => i !== index),
    );
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);

    const found = validateIdentity(identity);
    setErrors(found);
    if (hasErrors(found) || !consented) {
      const firstBad = document.querySelector<HTMLElement>("[aria-invalid=true]");
      firstBad?.focus();
      return;
    }

    const clean: Identity = {
      ...identity,
      fullName: identity.fullName.trim(),
      city: identity.city.trim(),
      email: identity.email.trim(),
      phone: identity.phone?.trim() ?? "",
      aliases: identity.aliases.map((a) => a.trim()).filter(Boolean),
      priorCities: identity.priorCities.map((c) => c.trim()).filter(Boolean),
    };

    dispatch({ type: "SET_IDENTITY", identity: clean });
    dispatch({ type: "GRANT_CONSENT" });
    router.push("/scan/running");
  }

  function toggleConsent(next: boolean) {
    setConsented(next);
    if (!next) dispatch({ type: "REVOKE_CONSENT" });
  }

  const valid = !hasErrors(validateIdentity(identity)) && consented;

  return (
    <main className={s.shell}>
      <TopBar step={1} />

      <h1 className={s.h1}>Find what&rsquo;s out there about you</h1>
      <p className={s.lede}>
        Everything here stays in this browser tab. It is never saved to a
        database, and closing the tab erases it.
      </p>

      {session.scanError ? (
        <p className={s.alertBanner} role="alert">
          {session.scanError}
        </p>
      ) : null}

      <form className={`${s.card} ${f.form}`} onSubmit={onSubmit} noValidate>
        {/* --- Group 1: About you --- */}
        <fieldset className={s.fieldGroup}>
          <legend className={s.groupLabel}>About you</legend>

          <div className={s.field}>
            <label className={s.label} htmlFor="fullName">
              <span className={s.reqDot} aria-hidden="true" />
              Full name
            </label>
            <input
              id="fullName"
              className={`${s.input} ${errors.fullName ? s.inputError : ""}`}
              value={identity.fullName}
              onChange={(e) => set("fullName", e.target.value)}
              aria-required="true"
              aria-invalid={Boolean(errors.fullName)}
              aria-describedby={
                errors.fullName ? "fullName-error" : "fullName-help"
              }
              autoComplete="name"
            />
            {errors.fullName ? (
              <span className={s.fieldError} id="fullName-error">
                {errors.fullName}
              </span>
            ) : (
              <span className={s.fieldHelp} id="fullName-help">
                The name brokers are most likely to list you under.
              </span>
            )}
          </div>

          <div className={s.field}>
            <span className={s.label} id="aliases-label">
              Other names you&rsquo;ve used
            </span>
            {identity.aliases.map((alias, i) => (
              <div className={s.repeatRow} key={i}>
                <input
                  className={s.input}
                  value={alias}
                  ref={
                    i === identity.aliases.length - 1 ? lastAliasRef : undefined
                  }
                  onChange={(e) => setListItem("aliases", i, e.target.value)}
                  aria-label={`Other name ${i + 1}`}
                />
                <button
                  type="button"
                  className={s.removeBtn}
                  onClick={() => removeListItem("aliases", i)}
                  aria-label={`Remove other name ${i + 1}`}
                >
                  &times;
                </button>
              </div>
            ))}
            <button
              type="button"
              className={s.addBtn}
              onClick={() => addListItem("aliases")}
            >
              + Add a name
            </button>
            <span className={s.fieldHelp}>
              Maiden names and former names matter — brokers often keep a
              separate listing under each one.
            </span>
          </div>

          <div className={s.field}>
            <label className={s.label} htmlFor="ageRange">
              <span className={s.reqDot} aria-hidden="true" />
              Age range
            </label>
            <select
              id="ageRange"
              className={`${s.select} ${errors.ageRange ? s.inputError : ""}`}
              value={identity.ageRange}
              onChange={(e) => set("ageRange", e.target.value)}
              aria-required="true"
              aria-invalid={Boolean(errors.ageRange)}
              aria-describedby={
                errors.ageRange ? "ageRange-error" : "ageRange-help"
              }
            >
              <option value="">Select&hellip;</option>
              {AGE_RANGES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            {errors.ageRange ? (
              <span className={s.fieldError} id="ageRange-error">
                {errors.ageRange}
              </span>
            ) : (
              <span className={s.fieldHelp} id="ageRange-help">
                This is how we tell you apart from someone who shares your name.
                We never ask for your date of birth.
              </span>
            )}
          </div>
        </fieldset>

        {/* --- Group 2: Where you live --- */}
        <fieldset className={s.fieldGroup}>
          <legend className={s.groupLabel}>Where you live</legend>

          <div className={s.field}>
            <div className={s.row}>
              <div className={s.rowGrow}>
                <label className={s.label} htmlFor="city">
                  <span className={s.reqDot} aria-hidden="true" />
                  City
                </label>
                <input
                  id="city"
                  className={`${s.input} ${errors.city ? s.inputError : ""}`}
                  value={identity.city}
                  onChange={(e) => set("city", e.target.value)}
                  aria-required="true"
                  aria-invalid={Boolean(errors.city)}
                  aria-describedby={errors.city ? "city-error" : undefined}
                  autoComplete="address-level2"
                />
                {errors.city ? (
                  <span className={s.fieldError} id="city-error">
                    {errors.city}
                  </span>
                ) : null}
              </div>

              <div className={s.rowFixed}>
                <label className={s.label} htmlFor="state">
                  <span className={s.reqDot} aria-hidden="true" />
                  State
                </label>
                <select
                  id="state"
                  className={`${s.select} ${errors.state ? s.inputError : ""}`}
                  value={identity.state}
                  onChange={(e) => set("state", e.target.value)}
                  aria-required="true"
                  aria-invalid={Boolean(errors.state)}
                  aria-describedby={errors.state ? "state-error" : undefined}
                  autoComplete="address-level1"
                >
                  <option value="">&mdash;</option>
                  {US_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {errors.state ? (
              <span className={s.fieldError} id="state-error">
                {errors.state}
              </span>
            ) : (
              <span className={s.fieldHelp}>
                Where you live now. Brokers index by location, so this is what
                narrows the search to you.
              </span>
            )}
          </div>

          <div className={s.field}>
            <span className={s.label}>Cities you&rsquo;ve lived in before</span>
            {identity.priorCities.map((city, i) => (
              <div className={s.repeatRow} key={i}>
                <input
                  className={s.input}
                  value={city}
                  onChange={(e) => setListItem("priorCities", i, e.target.value)}
                  aria-label={`Previous city ${i + 1}`}
                  placeholder="Austin, TX"
                />
                <button
                  type="button"
                  className={s.removeBtn}
                  onClick={() => removeListItem("priorCities", i)}
                  aria-label={`Remove previous city ${i + 1}`}
                >
                  &times;
                </button>
              </div>
            ))}
            <button
              type="button"
              className={s.addBtn}
              onClick={() => addListItem("priorCities")}
            >
              + Add a city
            </button>
            <span className={s.fieldHelp}>
              Old addresses are what most broker listings are actually built
              from — they hang around long after you move.
            </span>
          </div>
        </fieldset>

        {/* --- Group 3: How to reach you --- */}
        <fieldset className={s.fieldGroup}>
          <legend className={s.groupLabel}>How to reach you</legend>

          <div className={s.field}>
            <label className={s.label} htmlFor="email">
              <span className={s.reqDot} aria-hidden="true" />
              Email
            </label>
            <input
              id="email"
              type="email"
              inputMode="email"
              className={`${s.input} ${errors.email ? s.inputError : ""}`}
              value={identity.email}
              onChange={(e) => set("email", e.target.value)}
              aria-required="true"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "email-error" : "email-help"}
              autoComplete="email"
            />
            {errors.email ? (
              <span className={s.fieldError} id="email-error">
                {errors.email}
              </span>
            ) : (
              <span className={s.fieldHelp} id="email-help">
                Goes on your removal requests so brokers can confirm back to
                you. Vanish never emails you and never sends anything itself.
              </span>
            )}
          </div>

          <div className={s.field}>
            <label className={s.label} htmlFor="phone">
              Phone
            </label>
            <input
              id="phone"
              type="tel"
              inputMode="tel"
              className={s.input}
              value={identity.phone ?? ""}
              onChange={(e) => set("phone", e.target.value)}
              aria-describedby="phone-help"
              autoComplete="tel"
            />
            <span className={s.fieldHelp} id="phone-help">
              Optional. Only worth adding if you want to find listings that
              publish your number.
            </span>
          </div>
        </fieldset>

        {/* --- Group 4: Consent — the legal hinge, given its own weight --- */}
        <fieldset className={s.fieldGroup}>
          <legend className={s.groupLabel}>Your authorization</legend>
          <div className={s.consent}>
            <label className={s.consentRow}>
              <input
                type="checkbox"
                className={s.checkbox}
                checked={consented}
                onChange={(e) => toggleConsent(e.target.checked)}
                aria-required="true"
                aria-invalid={submitted && !consented}
                aria-describedby="consent-help"
              />
              <span className={s.consentText}>{CONSENT_TEXT}</span>
            </label>
            <p className={s.fieldHelp} id="consent-help">
              Under the CCPA/CPRA you may act for yourself or name an authorized
              agent. This is the authorization that lets Vanish prepare requests
              in your name &mdash; you still send every one of them yourself.
            </p>
            {submitted && !consented ? (
              <p className={s.fieldError} role="alert">
                We need your authorization before preparing any requests.
              </p>
            ) : null}
          </div>
        </fieldset>

        <button
          type="submit"
          className={`${s.btn} ${s.btnPrimary} ${s.btnFull}`}
          disabled={!valid}
        >
          Start scan
        </button>
      </form>

      <Footer />
    </main>
  );
}
