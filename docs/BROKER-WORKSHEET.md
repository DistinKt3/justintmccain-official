# Broker verification worksheet — the 3 remaining seed brokers

Three of the five seed brokers block automated requests, so their opt-out details
had to be left unverified and disabled. This is the short manual pass that turns
them on.

**Time needed:** ~10 minutes total. **You need:** a normal browser. That's it.

Do *not* use a script or a scraper — these sites 403 anything that isn't a browser,
and working around that is explicitly out of scope. Just visit them.

---

## What you're looking for, on each site

1. The **opt-out / removal page** (usually footer-linked; often labelled
   "Do Not Sell or Share My Personal Information" — that link is CCPA-mandated,
   so it's nearly always there).
2. Whether it's a **form** or an **email address**.
3. What it **demands from the user**: just a listing URL? Email? Phone
   verification? An ID upload?
4. What the user still has to do **after** submitting — most of these send a
   confirmation email that must be clicked or the removal never takes effect.

---

## 1. Whitepages

Start at https://www.whitepages.com and find the opt-out from the footer.
Guessed (unverified) path in the registry: `/suppression-requests`

- [ ] Real opt-out URL: `________________________________`
- [ ] Form, or email address? `________________________________`
- [ ] Requires: listing URL? ___ email? ___ phone? ___ ID? ___
- [ ] After submitting, user must: `________________________________`

> Note: Whitepages has historically required **phone verification** to complete a
> suppression. If that's still true, that's a `manualStep` worth warning users
> about up front — it's the kind of surprise that makes someone abandon halfway.

## 2. Radaris

Start at https://radaris.com and find the opt-out from the footer.
Guessed (unverified) path in the registry: `/control/privacy`

- [ ] Real opt-out URL: `________________________________`
- [ ] Form, or email address? `________________________________`
- [ ] Requires: listing URL? ___ email? ___ phone? ___ ID? ___
- [ ] After submitting, user must: `________________________________`

> Note: Radaris has historically required creating an **account** or claiming the
> profile before removal. If so, flag it — asking a privacy-motivated user to make
> an account on a data broker is a real friction point they should see coming.

## 3. TruePeopleSearch

Start at https://www.truepeoplesearch.com and find the opt-out from the footer.
Guessed (unverified) path in the registry: `/removal`

- [ ] Real opt-out URL: `________________________________`
- [ ] Form, or email address? `________________________________`
- [ ] Requires: listing URL? ___ email? ___ phone? ___ ID? ___
- [ ] After submitting, user must: `________________________________`

---

## Then

Send me the filled-in answers and I'll update `src/data/brokers.json`, set
`verifiedAt`, flip `enabled: true`, and write the user-facing `note` for each —
then the scan covers 5 brokers instead of 2.

If any of them turns out to demand something unreasonable (ID upload, notarised
letter), that's worth knowing too: the honest move may be to list it with a clear
warning rather than enable it silently.
