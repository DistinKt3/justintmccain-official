# Can Vanish actually scan? — validation, 2026-08-06

The premise worth testing: of the 500+ brokers in California's registry, surely
*some* allow automated checks. This is what happened when that was measured.

**Answer: one. Spokeo.** Not five. The reasoning and the data are below, because
the conclusion shapes what the product honestly is.

---

## Method

Source: the CPPA Data Broker Registry CSV (549 filings, 528 unique hosts).

1. **Reachability** — one plain GET per host homepage.
2. **Consumer relevance** — does the homepage look like a place a person can look
   *themselves* up? Most registered brokers are B2B/adtech; you cannot "find your
   listing" on a firmographic data vendor.
3. **Differential test** — the one that actually matters. Request a real common
   name (`John Smith`) and an impossible one (`Zzqxwvt Blorfnagle`), then compare
   the responses. **If both come back the same, the site gives no usable signal** —
   whatever we report about it would be noise.

Step 3 is non-negotiable, and it is where an earlier, sloppier check of mine went
wrong. I had originally accepted "HTTP 200 + the searched name appears in the
page text" as proof of working search. That produced a **false positive on
Searchbug**, which simply echoes the query into a template above a sign-up wall.
Presence of the name proves the site received the query, not that it found anyone.

## Results

| Host | Reachable | Real vs impossible name | Verdict |
|---|---|---|---|
| **spokeo.com** | 200 | 200 (`9,107 matches`) vs **404** | ✅ **genuine signal** |
| searchbug.com | 200 | 9,898 vs 9,938 chars (0.4% delta) | ❌ echoes query, no signal |
| spydialer.com | 200 | byte-identical (delta 0) | ❌ no signal |
| socialcatfish.com | 200 | byte-identical (delta 0) | ❌ no signal |
| gladiknow.com | 200 | byte-identical (delta 0) | ❌ no signal |
| peoplesearcher.com | 200 | 0 chars rendered text — JS shell | ❌ no signal |
| peoplefinders.com | 200 → 403 | inconsistent, then blocked | ❌ unreliable |
| whitepages.com | 200 home / **403** search | blocked | ❌ |
| truthfinder, instantcheckmate, nuwber, intelius | 403 | blocked | ❌ |
| radaris, truepeoplesearch | 403 | blocked, and unregistered | ❌ |

Spokeo's signal is robust across cases: `John Smith`/TX → 9,107 matches,
`Maria Garcia`/CA → 32,264, `Robert Johnson`/NY → 3,868; both impossible names →
404. Clean presence/absence.

## Why the aggregate number is misleading

**443 of 528 registry hosts (84%) are reachable.** That statistic invites the
conclusion that automated scanning is broadly viable. It isn't, and the reason is
structural:

The reachable 84% are overwhelmingly **B2B data brokers** — adtech, identity
resolution, marketing lists, recruiting databases. They don't block automation
because they have no consumer-facing person lookup to protect. There is nothing
for a user to "find themselves on."

The **consumer people-search segment** — the only segment where Vanish's core
action makes sense — is precisely the segment that blocks hardest, because
scraped listings *are* their product. Reachability and relevance are inversely
correlated here.

## What this means for the product

Vanish v1 is **not** a scanner with a manual fallback. It is a **guided
self-search** with one site that happens to be automatable. That's a positioning
fact, not a bug, and the UI should keep telling the truth about it — which it does:
blocked brokers say so plainly and hand the user a link.

The valuable parts of the product were never the scan anyway. Writing a correct
CCPA/CPRA removal request, tracking what was sent, and producing a durable record
are the hard parts, and none of them depend on scanning.

**Do not "fix" this by defeating bot detection.** Out of scope per PRD §4.2, a
Terms-of-Service problem rather than a legal one (PRD §2), and not a fight this
product needs.

## The bug this validation caught

`peoplesearcher.com` was configured `scanStrategy: "html-parse"` and returns HTTP
200 with a JavaScript shell — **zero** server-rendered text. The parser found no
name and reported **"no match"**: telling the user they aren't listed on a site
whose results never rendered.

A false "you're clean" is the worst output this product can produce. It converts
"I haven't checked yet" into "I'm safe."

Two fixes landed:

1. `peoplesearcher` → `scanStrategy: "assisted"`.
2. A structural guard in `src/app/api/scan/route.ts`: any 200 with less than
   `MIN_RENDERED_TEXT` (1200 chars) of server-rendered text is reported as *"didn't
   return readable results — check it yourself"*, never as a no-match. This
   protects every future broker added to the registry, not just this one.

## Re-testing later

Broker anti-bot posture changes. Re-run the differential test before promoting any
broker to `html-parse`:

```
real name    → fetch, strip tags, record length + status
impossible   → fetch, strip tags, record length + status
```

Promote only if **status differs** or **content differs by >400 chars**. Anything
else is an echo, a shell, or a static page, and will generate false results.
