# Broker verification

Adding or enabling a broker is a **data** task, not a code task. `src/data/brokers.json`
is the whole registry; the opt-out engine dispatches purely on `optOutMethod`.

## Start here: the authoritative source

Before opening any broker's website, check the **California Privacy Protection
Agency Data Broker Registry**:

> https://cppa.ca.gov/data_broker_registry/complete-reg-data-brokers.csv

Under the Delete Act (SB 362), a data broker doing business in California must
register annually and disclose in writing how consumers opt out. It's a legal
filing, published as machine-readable CSV covering ~550 brokers, with name, email,
website and opt-out instructions per record.

Prefer it over a broker's own page. It's a declaration rather than marketing copy,
it can't be quietly reworded, and it's reachable without fighting bot detection.
When the registry and a broker's own page disagree, **the registry wins**. That
has already happened twice here (see `BROKER-WORKSHEET.md`).

A broker that isn't in the registry at all is a signal in itself: no filing plus no
reachable page means there's no authoritative opt-out address to hand a user.

## The rule, and how it is scoped

A wrong opt-out address doesn't fail loudly. The user sends their removal request,
it goes nowhere, and they walk away believing they're protected. That is worse
than not listing the broker at all, because it turns "I haven't done this yet"
into a false "I'm done." The rule exists to stop that, so it applies where silence
is actually possible:

- **`optOutMethod: "email"` requires `source: "ca-registry"`.** A wrong address
  fails silently. The message vanishes and nobody finds out.
- **`optOutMethod: "link"` may use `source: "published"`.** A wrong URL fails
  visibly. The user gets a 404 and the note tells them to use the site's footer
  link instead. Visible failure is recoverable.

That scoping is what lets the biggest *free* people-search sites ship even though
California has no filing for them. Leaving them out would have protected a rule at
the user's expense.

Record the date you checked in `verifiedAt`.

## Current state (as of 2026-08-06)

23 brokers enabled, ordered by value to the user rather than alphabetically, so
the sites where you can see your own record for free come first. 16 carry
`source: "ca-registry"` and the rest carry `source: "published"`.

Full detail and provenance in `BROKER-WORKSHEET.md`; the scan measurements that
decide `scanStrategy` are in `SCAN-VIABILITY.md`.

## How to verify one

1. Look it up in the CPPA CSV first. If it's registered, the filing gives you the
   opt-out URL, email and phone directly, so you may be done.
2. Only if it isn't registered, open the broker's site in a normal browser (not a
   script, see below) and find their opt-out / "do not sell my info" /
   suppression page. It's usually in the footer, often as "Do Not Sell or Share My
   Personal Information" (the CCPA-mandated link).
3. Record, exactly:
   - `optOutUrl`: the page a user actually starts from.
   - `emailTo`: the privacy contact, if they publish one.
   - `manualStep`: what the user still has to do after submitting
     (`confirmation-email`, `phone-verification`, `account-verification`, or `null`).
   - `requiredFields`: what their form demands (listing URL? email? ID upload?).
4. Set `verifiedAt` to today and `enabled: true`.
5. Add a `note` describing anything surprising. It is shown to the user.

## On automated checking

Most of this industry blocks automated requests, and several of these sites 403
anything that isn't a browser. **Do not try to get around that.** No header
spoofing, no proxy rotation, no CAPTCHA solving. It's explicitly out of scope
(PRD §4.2), it's a Terms-of-Service problem rather than a legal one (PRD §2), and
it is not a fight this product needs to pick.

The supported answer is `scanStrategy: "assisted"`: Vanish hands the user the
search link, they look in their own browser, and they paste the listing URL back.
That's a normal human visit from their own IP, and it's the self-search the whole
product is premised on. Assisted brokers are first-class, producing the same
removal requests as scanned ones.

Use `scanStrategy: "html-parse"` only for brokers that genuinely serve their
public search results to a plain request.

## Scaling the registry

PRD §4.1 targets 40–60 brokers. That's additive data work: append records, verify
each one, flip `enabled`. No code changes required.
