# Broker verification — completed 2026-08-06

**Status: done.** The registry went from 2 enabled brokers to 9, all verified
against an authoritative source. Nothing here is left for you to fill in.

---

## How this was verified

Not by reading the brokers' own opt-out pages — most of them (7 of 9) return
HTTP 403 to anything that isn't a browser, and working around that is out of
scope.

Instead: the **California Privacy Protection Agency Data Broker Registry**.

> https://cppa.ca.gov/data_broker_registry/complete-reg-data-brokers.csv
> 549 registered brokers · pulled 2026-08-06

Under California's Delete Act (SB 362), any data broker doing business in
California must register annually with the CPPA and disclose, in writing, how a
consumer opts out. That filing is a legal declaration published as machine-readable
CSV — it's more authoritative than a footer link that can be reworded or moved, and
it's reachable without fighting anyone's bot detection.

**This source corrected two records I had already marked "verified" from the
brokers' own pages:**

| Broker | I had | Registry says |
|---|---|---|
| BeenVerified | `privacy@beenverified.com` | **`ccpa@beenverified.com`** + phone 888-579-5910 |
| Spokeo | (no phone) | dedicated CCPA line **1-877-864-0183** |

Worth noting for anyone maintaining this later: prefer the registry when it and a
broker's own page disagree.

---

## The two brokers that got dropped

**Radaris** and **TruePeopleSearch** are **not in the California registry at all** —
zero matches across every field, under any name or URL. Every other major
people-search site is there.

They're plainly people-search data brokers, so a missing filing is conspicuous. But
for our purposes the practical consequence is what matters: with no state filing
*and* no reachable page, there is no authoritative opt-out address to hand a user.
Guessing one would produce exactly the silent failure this project is built to
avoid, so they're omitted.

If you want them covered later, someone has to open them in a real browser and
record the flow by hand. Neither was reachable any other way.

---

## What shipped (9 brokers, all enabled)

Account creation was your stated skip condition. **None of these require it** —
that was checked against each filing.

| Broker | Scan | Opt-out method | Route |
|---|---|---|---|
| Spokeo | auto | form | spokeo.com/optout · ☎ 1-877-864-0183 |
| BeenVerified | assisted | form | beenverified.com/app/optout/search · ☎ 888-579-5910 |
| Whitepages | assisted | form | whitepages.com/privacy/ccpa |
| TruthFinder | assisted | form | truthfinder.com/opt-out/v2/ · ☎ (800) 699-8081 |
| Instant Checkmate | assisted | form | instantcheckmate.com/opt-out · ☎ (800) 222-8985 |
| PeopleSearcher | auto | form | peoplesearcher.com/optOut/name/landing · ☎ (833) 634-0750 |
| Intelius | assisted | **email** | support@mailer.intelius.com · ☎ (888) 245-1655 |
| Nuwber | assisted | **email** | support@nuwber.com · ☎ (844) 912-1292 |
| PeopleFinders | assisted | form | footer link · peoplefinders.com/about/privacy |

Coverage is wider than 9 sites: BeenVerified's opt-out also covers PeopleLooker,
NeighborWho and NumberGuru, and Intelius also covers US Search.

Two things this changed in the product beyond the count:

- **The email path is now real.** Nuwber and Intelius are email-only, so the
  `mailto` generator is exercised by actual brokers rather than being dead code.
- **Phone numbers are surfaced** on the dashboard. Several brokers filed a CCPA
  phone line, and it's the route that still works when someone's mail client won't
  open and a form submission fails.

---

## Scaling past 9

The same CSV is the path to PRD §4.1's 40–60 broker target. It carries name, email,
website, and opt-out text for all 549 registered brokers — a filter for
people-search operators returned 30 candidates, of which these 9 are the cleanest.
Adding more is data entry against a source that's already been parsed, not research.

Re-pull the CSV periodically: brokers re-register annually and the opt-out text is
the first thing that changes.
