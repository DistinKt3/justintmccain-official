import Link from "next/link";
import { Footer, Wordmark, ui as s } from "@/components/ui";
import p from "./landing.module.css";

const STEPS = [
  {
    title: "Search",
    body: "You tell us who you are. We check the data brokers that publish people's addresses, phone numbers and relatives.",
  },
  {
    title: "Confirm",
    body: "You look at what we found and confirm which listings are actually you — not a stranger who shares your name.",
  },
  {
    title: "Send",
    body: "We write each removal request for you. You send them yourself, from your own email. Vanish never sends anything on your behalf.",
  },
];

export default function LandingPage() {
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
          Vanish searches the data brokers that publish your name, address and
          phone number, then hands you a ready-to-send removal request for each
          one. About 15 minutes. Nothing about you is stored.
        </p>

        <div className={p.ctaRow}>
          <Link href="/scan" className={`${s.btn} ${s.btnPrimary}`}>
            Find my data
          </Link>
        </div>
      </section>

      <section className={p.steps} aria-label="How it works">
        <ol className={p.stepList}>
          {STEPS.map((step, i) => (
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

      <section className={p.trustSection}>
        <p className={s.trust}>
          We only search for you, with your consent. We never sell data. Delete
          your Vanish data anytime.
        </p>
        <p className={p.trustDetail}>
          There is no account and no database. Everything you type stays in this
          browser tab and is gone when you close it — so the only lasting record
          is the report you download yourself.
        </p>
      </section>

      <Footer />
    </main>
  );
}
