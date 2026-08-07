# Broker verification

Adding or enabling a broker is a **data** task, not a code task. `src/data/brokers.json`
is the whole registry; the opt-out engine dispatches purely on `optOutMethod`.

## The rule

**Never set `enabled: true` on a broker whose `optOutUrl` / `emailTo` you have not
read off that broker's own live page.**

A wrong opt-out address doesn't fail loudly. The user sends their removal request,
it goes nowhere, and they walk away believing they're protected. That is worse than
not listing the broker at all — it converts "I haven't done this yet" into a false
"I'm done." Everything else in this product is built to avoid exactly that class of
quiet failure.

Record the date you checked in `verifiedAt`.

## Current state (as of 2026-08-06)

| Broker | Enabled | Why |
|---|---|---|
| Spokeo | ✅ | Opt-out flow and `privacy@spokeo.com` read off `spokeo.com/optout`. Form needs the exact profile URL + email, then a confirmation link. |
| BeenVerified | ✅ | `privacy@beenverified.com` and the opt-out form path read off their published privacy policy. §19.6 expressly accepts authorized-agent requests. |
| Whitepages | ❌ | Returns HTTP 403 to automated requests — could not be verified. |
| Radaris | ❌ | Returns HTTP 403 to automated requests — could not be verified. |
| TruePeopleSearch | ❌ | Returns HTTP 403 to automated requests — could not be verified. |

The three disabled records are staged with a plausible `optOutUrl` so the shape is
right, but they are **guesses** and are marked as such in the JSON. They do not
appear anywhere in the product while `enabled: false`.

## How to verify one

1. Open the broker's site in a normal browser (not a script — see below).
2. Find their opt-out / "do not sell my info" / suppression page. It is usually
   linked from the footer or the privacy policy, often as "Do Not Sell or Share My
   Personal Information" (the CCPA-mandated link).
3. Record, exactly:
   - `optOutUrl` — the page a user actually starts from.
   - `emailTo` — the privacy contact, if they publish one.
   - `manualStep` — what the user still has to do after submitting
     (`confirmation-email`, `phone-verification`, `account-verification`, or `null`).
   - `requiredFields` — what their form demands (listing URL? email? ID upload?).
4. Set `verifiedAt` to today and `enabled: true`.
5. Add a `note` describing anything surprising. It is shown to the user.

## On automated checking

Most of this industry blocks automated requests, and several of these sites 403
anything that isn't a browser. **Do not try to get around that.** No header
spoofing, no proxy rotation, no CAPTCHA solving — it's explicitly out of scope
(PRD §4.2), it's a Terms-of-Service problem rather than a legal one (PRD §2), and
it is not a fight this product needs to pick.

The supported answer is `scanStrategy: "assisted"`: Vanish hands the user the
search link, they look in their own browser, and they paste the listing URL back.
That's a normal human visit from their own IP, and it's the self-search the whole
product is premised on. Assisted brokers are first-class — they produce the same
removal requests as scanned ones.

Use `scanStrategy: "html-parse"` only for brokers that genuinely serve their
public search results to a plain request.

## Scaling the registry

PRD §4.1 targets 40–60 brokers. That's additive data work: append records, verify
each one, flip `enabled`. No code changes required.
