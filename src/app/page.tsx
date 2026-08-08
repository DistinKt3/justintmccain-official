import Link from "next/link";
import { Footer, Wordmark, ui as s } from "@/components/ui";
import { activeBrokers } from "@/lib/brokers";
import p from "./landing.module.css";

export default function LandingPage() {
  const brokers = activeBrokers();
  const scannable = brokers.filter((b) => b.scanStrategy === "html-parse");
  const freeToView = brokers.filter((b) => b.freeToView);

  const steps = [
    {
      title: "Look",
      body: `We point you at ${brokers.length} sites, starting with the ${freeToView.length} that show your record for free. ${
        scannable.length === 1
          ? "One of them we can check automatically."
          : `${scannable.length} of them we can check automatically.`
      } The rest block automated tools, so you search those yourself. It takes a couple of minutes each.`,
    },
    {
      title: "Confirm",
      body: "You paste back the listings that are actually you. Plenty of them belong to a stranger who happens to share your name, and nobody should be filing removals on their behalf.",
    },
    {
      title: "Send",
      body: "We write each removal request, citing the law that entitles you to it, and show you the exact text. You send it from your own email. Vanish never sends anything for you.",
    },
  ];

  return (
    <main className={s.shell}>
      <header className={s.topBar}>
        <Wordmark />
      </header>

      <section className={p.hero}>
        <h1 className={s.h1}>
          See what the internet knows about you. Then take it down.
        </h1>
        <p className={s.lede}>
          Vanish walks you through {brokers.length} data brokers that publish
          your name, address and phone number. Free ones first, so you can see
          for yourself. Then it writes a proper removal request for every listing
          you find. About 15 minutes, and nothing about you is stored.
        </p>

        <div className={p.ctaRow}>
          <Link href="/scan" className={`${s.btn} ${s.btnPrimary}`}>
            Find my data
          </Link>
          <Link href="/about" className={`${s.btn} ${s.btnSecondary}`}>
            What this is &amp; isn&rsquo;t
          </Link>
        </div>
      </section>

      <section className={p.steps} aria-label="How it works">
        <ol className={p.stepList}>
          {steps.map((step, i) => (
            <li key={step.title} className={p.stepItem}>
              <span className={p.stepMark} aria-hidden="true" />
              <h2 className={p.stepTitle}>
                <span className={p.stepNum}>{i + 1}</span> {step.title}
              </h2>
              <p className={s.help}>{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* The honest bit, on the front page rather than buried in /about.
          A privacy tool that oversells its own reach is doing the same thing
          to you that the brokers do, just in a friendlier voice. */}
      <section className={p.plainly} aria-labelledby="plainly-heading">
        <h2 id="plainly-heading" className={p.plainlyTitle}>
          Plainly, before you start
        </h2>

        <div className={p.plainlyGrid}>
          <div>
            <p className={p.plainlyLabel}>This is</p>
            <ul className={p.plainlyList}>
              <li>
                A guided walk through {brokers.length} brokers, ordered so the
                ones you can actually see yourself on come first.
              </li>
              <li>
                A writer of properly-formed CCPA/CPRA removal requests, shown to
                you in full before you send them.
              </li>
              <li>
                Zero-retention by architecture. No database, no account, no
                analytics. Closing the tab erases everything.
              </li>
            </ul>
          </div>

          <div>
            <p className={p.plainlyLabel}>This isn&rsquo;t</p>
            <ul className={p.plainlyList}>
              <li>
                <strong>A scanner.</strong> {scannable.length} of{" "}
                {brokers.length} can be checked automatically. The rest block
                automated tools and we don&rsquo;t try to get around that.
              </li>
              <li>
                <strong>A sender.</strong> Every request leaves from your inbox,
                which is why no third party ends up with a record of it.
              </li>
              <li>
                <strong>Complete or permanent.</strong> Brokers re-acquire
                records. This is maintenance, not a one-time fix.
              </li>
            </ul>
          </div>
        </div>

      </section>

      <section className={p.trustSection}>
        {/* PRD §11.1's trust row, minimally reworded. The original read "We
            only search for you, with your consent", meaning "only ever your own
            identity, never a third party's". On a page that now spends three
            sections explaining we mostly don't do the searching, it read as the
            one claim being walked back. Same three promises, no ambiguity. */}
        <p className={s.trust}>
          We only ever act on your own identity, with your consent. We never
          sell data. Clear everything in one click.
        </p>
        <p className={p.trustDetail}>
          There is no account and no database. Everything you type stays in this
          browser tab and is gone when you close it, so the only lasting record
          is the report you download yourself.
        </p>
      </section>

      <Footer />
    </main>
  );
}
