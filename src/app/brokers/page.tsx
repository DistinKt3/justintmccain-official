import type { Metadata } from "next";
import { Footer, TopBar, ui as s } from "@/components/ui";
import registry from "@/data/registry.json";
import BrokerTable from "./BrokerTable";
import b from "./brokers.module.css";

export const metadata: Metadata = {
  title: "Every registered data broker — Vanish",
  description:
    "All 549 data brokers registered with California, with the opt-out route each one filed. Free to use from anywhere.",
};

export default function BrokersPage() {
  const { source, counts, brokers } = registry;

  return (
    <main className={`${s.shell} ${s.shellWide}`}>
      <TopBar />

      <h1 className={s.h1}>Every registered data broker</h1>
      <p className={s.lede}>
        {counts.total} companies that told the State of California they trade in
        personal data &mdash; and the opt-out route each one filed. Vanish
        doesn&rsquo;t automate any of this. It&rsquo;s here so you can work
        through it yourself.
      </p>

      <section className={b.provenance}>
        <h2 className={b.provTitle}>Where this comes from</h2>
        <p className={b.provBody}>
          California&rsquo;s{" "}
          <strong>{source.statute}</strong> requires any data broker doing
          business in the state to register annually with the{" "}
          <a href={source.url} target="_blank" rel="noopener noreferrer">
            California Privacy Protection Agency
          </a>{" "}
          and disclose, in writing, how a consumer opts out. That filing is
          published as an open dataset. This page is that dataset, reorganised
          and nothing more &mdash; retrieved {source.retrieved}.
        </p>
        <p className={b.provBody}>
          <strong>You do not have to live in California to use it.</strong> The
          registration duty is California&rsquo;s; the disclosed opt-out
          addresses are just addresses. A broker with a &ldquo;do not sell my
          info&rdquo; form will generally take your request from anywhere, and
          several other states now have their own opt-out rights. What
          California&rsquo;s law guarantees its residents is the automated
          deletion service (DROP) &mdash; that part doesn&rsquo;t travel. The
          list does.
        </p>
        <p className={b.provNote}>
          Source of truth is the CPPA, not us. If a record here looks wrong,{" "}
          <a href={source.dataUrl} target="_blank" rel="noopener noreferrer">
            check the original CSV
          </a>
          . Brokers re-register annually, so entries drift.
        </p>
      </section>

      <BrokerTable
        brokers={brokers}
        peopleCount={counts.peopleSearch}
        dataCount={counts.dataBroker}
      />

      <Footer />
    </main>
  );
}
