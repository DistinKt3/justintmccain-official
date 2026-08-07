import type { Metadata } from "next";
import Link from "next/link";
import { Footer, TopBar, ui as s } from "@/components/ui";
import { activeBrokers } from "@/lib/brokers";
import registry from "@/data/registry.json";
import a from "./about.module.css";

export const metadata: Metadata = {
  title: "What Vanish is and isn't",
  description:
    "An honest account of what this tool does, what it deliberately doesn't do, and where the data comes from.",
};

export default function AboutPage() {
  const brokers = activeBrokers();
  const scannable = brokers.filter((b) => b.scanStrategy === "html-parse");
  const freeToView = brokers.filter((b) => b.freeToView);

  return (
    <main className={s.shell}>
      <TopBar />

      <h1 className={s.h1}>What this is, and what it isn&rsquo;t</h1>
      <p className={s.lede}>
        Privacy tools tend to oversell. Here is the plain version, including the
        parts that aren&rsquo;t flattering.
      </p>

      <section className={a.block}>
        <h2 className={a.h2}>What it is</h2>
        <ul className={a.list}>
          <li>
            A guided walk through <strong>{brokers.length} data brokers</strong>{" "}
            that publish personal records, ordered so the ones where you can
            actually see yourself for free come first.
          </li>
          <li>
            A writer of <strong>removal requests</strong>. For each listing you
            confirm, Vanish drafts a properly-formed CCPA/CPRA request citing the
            right statutory basis, and shows you the exact text before you send
            it.
          </li>
          <li>
            A <strong>record keeper</strong>. The PDF you download is a dated log
            of every site checked, every request written, and what it said.
          </li>
          <li>
            <strong>Genuinely zero-retention.</strong> No database, no account, no
            analytics, no logging of anything you type. Closing the tab erases
            it. That isn&rsquo;t a policy promise, it&rsquo;s the architecture.
            There is nowhere for it to go.
          </li>
        </ul>
      </section>

      <section className={a.block}>
        <h2 className={a.h2}>What it isn&rsquo;t</h2>
        <ul className={a.list}>
          <li>
            <strong>It is not really a scanner.</strong> Of the{" "}
            {brokers.length} brokers here, Vanish can automatically check{" "}
            <strong>{scannable.length}</strong>. The rest block automated
            requests, and we don&rsquo;t try to get around that. You open those
            yourself and paste back what you find. That&rsquo;s a guided
            self-search, and calling it anything else would be a lie.
          </li>
          <li>
            <strong>It does not send anything for you.</strong> Every request
            leaves from your own email or your own browser. There is no sending
            service in the middle, which is exactly why no third party ends up
            with a record of who asked whom for removal.
          </li>
          <li>
            <strong>It cannot confirm a removal happened.</strong> Brokers reply
            to you, not to us. We have no inbox access and keep no record of
            you. The statuses on your dashboard are ones you set yourself.
          </li>
          <li>
            <strong>It is not comprehensive.</strong> {brokers.length} brokers is
            a meaningful start, not the whole industry. The{" "}
            <Link href="/brokers">full registry of {registry.counts.total}</Link>{" "}
            is here for exactly that reason.
          </li>
          <li>
            <strong>It is not permanent.</strong> Brokers re-acquire records from
            public sources. Removal is maintenance, not a one-time fix. Worth
            redoing every few months.
          </li>
          <li>
            <strong>It is not legal advice</strong>, and it&rsquo;s a side
            project rather than a company. If your situation involves a safety
            risk, a lawyer or an advocacy organisation will serve you better than
            any tool.
          </li>
        </ul>
      </section>

      <section className={a.block}>
        <h2 className={a.h2}>Why some sites show you and some don&rsquo;t</h2>
        <p className={a.body}>
          {freeToView.length} of the {brokers.length} let you see your own record
          for free. The others confirm a record exists and then charge to open it
          That&rsquo;s unpleasant, but your data is there either way, and the
          opt-out works whether or not you pay to look. That&rsquo;s why the paywalled
          ones are still on the list, just further down it.
        </p>
      </section>

      <section className={a.block}>
        <h2 className={a.h2}>Where the data comes from</h2>
        <p className={a.body}>
          California&rsquo;s Delete Act (SB 362) requires data brokers doing
          business in the state to register annually with the{" "}
          <a
            href={registry.source.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            California Privacy Protection Agency
          </a>{" "}
          and disclose how consumers opt out. That&rsquo;s a public dataset, and
          it&rsquo;s where most of the opt-out addresses here come from. A legal
          filing beats a marketing page.
        </p>
        <p className={a.body}>
          <strong>
            You don&rsquo;t need to be a Californian for the list to be useful.
          </strong>{" "}
          What California guarantees its own residents is DROP, a service that
          submits deletion requests to every registered broker on their behalf,
          automatically. That part is genuinely theirs and doesn&rsquo;t
          travel. But the addresses those brokers filed are just addresses, and a
          &ldquo;do not sell my info&rdquo; form generally accepts a request from
          anyone. The automation doesn&rsquo;t cross the state line. The
          information does, and that&rsquo;s worth something on its own.
        </p>
        <p className={a.body}>
          A handful of the biggest free people-search sites aren&rsquo;t in
          California&rsquo;s registry at all. They&rsquo;re included anyway,
          because they expose too much to leave out, using their published
          opt-out pages, and each one tells you where to look if the link has
          moved.
        </p>
      </section>

      <section className={a.block}>
        <h2 className={a.h2}>Why it exists</h2>
        <p className={a.body}>
          It&rsquo;s a working demonstration attached to a personal site, built
          to be useful rather than to be a business. Free, no account, nothing
          retained, nothing upsold. If it saves you an afternoon of copy-pasting
          your own address into removal forms, it did its job.
        </p>
      </section>

      <div className={a.cta}>
        <Link href="/scan" className={`${s.btn} ${s.btnPrimary}`}>
          Start the walkthrough
        </Link>
        <Link href="/brokers" className={`${s.btn} ${s.btnSecondary}`}>
          See all {registry.counts.total} brokers
        </Link>
      </div>

      <Footer />
    </main>
  );
}
