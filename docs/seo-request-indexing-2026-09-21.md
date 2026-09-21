# Request Indexing After The Slug Change — 2026-09-21

The working list for GSC > URL Inspection > Request Indexing, written down because
the last one was not and had to be rebuilt from the git history.

**Context.** #712 moved every course from `/courses/<uuid>` to `/courses/<slug>`;
#713 and #714 fixed the sitemap that actually serves those addresses. The sitemap
was resubmitted on 2026-09-21 at 14:55 and downloaded by Google at 15:26. Every URL
below was checked and answers 200 in production.

**What the statuses mean.** The verdicts come from `scripts/gsc-baselines/2026-09-21.txt`,
which inspected the **old uuid** URLs, since that is all Google has seen so far. Those
uuids now 308 to the slug. So "indexed" below does not mean the slug is indexed; it
means there is index equity sitting on the old address that the redirect has to carry
across. Requesting the new address is the fast handover. GSC caps requests at roughly
10-12 a day.

## 1. Courses Whose Old Address Is Indexed

Five of them. Highest value: the equity exists and is waiting to move.

```
https://altogetheragile.com/courses/ai-essentials-for-agile-practitioners
https://altogetheragile.com/courses/agileba-foundation
https://altogetheragile.com/courses/agilepm-foundation
https://altogetheragile.com/courses/scrum-in-a-day
https://altogetheragile.com/courses/agileai-ai-enabled-agile-delivery
```

## 2. Courses Google Has Never Seen

Four "URL is unknown to Google", even as uuids. New address, no history either way.
The sitemap covers them; this is acceleration.

```
https://altogetheragile.com/courses/professional-scrum-product-owner
https://altogetheragile.com/courses/agile-fundamentals-workshop
https://altogetheragile.com/courses/kanban-fundamentals-managing-your-workflow
https://altogetheragile.com/courses/kanban-practitioner-flow-metrics-and-leadership
```

## 3. The One Course Google Looked At And Declined

`/courses/professional-scrum-master` was crawled on 2026-06-28 and not indexed, and
has not been recrawled since. A real URL may change that verdict, which is part of
what the slug work was for.

```
https://altogetheragile.com/courses/professional-scrum-master
```

That is ten, which is the daily cap. The exam pages below will need a second day.

## 4. Exam Pages, And Why To Expect Less

Three exam pages are not indexed, not the two the August review named:

| Page | Status |
|---|---|
| `/exams/professional-scrum-master` | Crawled, not indexed. Last crawl 2026-06-20, so no recrawl in three months. |
| `/exams/agilepm-practitioner-paper-1` | Crawled, not indexed. Recrawled 2026-09-21 and still declined. |
| `/exams/agilepm-practitioner-paper-2` | Discovered, not indexed. Never crawled. |

```
https://altogetheragile.com/exams/professional-scrum-master
https://altogetheragile.com/exams/agilepm-practitioner-paper-1
https://altogetheragile.com/exams/agilepm-practitioner-paper-2
```

The split is exact and it is not random: **both Foundation papers are indexed, and
every Practitioner and PSM paper is not.** `agilepm-practitioner-paper-1` was recrawled
the same day this was written and Google still declined it, which is as direct an
answer as the tool gives: it has seen the current page and does not think it earns a
slot. Requesting indexing will not change that. Only differentiating the content will,
which is item 3 of `docs/seo-gsc-review-2026-08-08.md` and still untouched.

## Movement Since The August Review

Better, from a very low base. 6 clicks and 2,076 impressions across the top 25 pages
in the 28 days to 2026-09-20, against 1 click and 1.4k impressions in August.

- `/exams` is **now indexed** (it was "crawled, not indexed" in June) and is the site's
  top page: 513 impressions, 4 clicks, average position 39.1.
- `/blog/pdca-cycle-explained` draws 902 impressions at position 57.8 and no clicks.
  It is the biggest single pool of impressions on the site and it converts nothing,
  because page 6 is not a place anyone clicks from.
- `/portfolio-items/agilepm-foundation-practice-exam-foundation/` still shows an
  impression at position 2.0. That is the trailing-slash soft 404 #711 fixed, and it
  confirms the leak was real and being served to searchers.
- Average position across the board is still ~40-50, which the August review called an
  authority ceiling. Nothing here changes that diagnosis.

## Still Open

- **Differentiate the Practitioner and PSM exam content.** The evidence above makes
  this the clearest single lever on indexing.
- **`/exams/agilepm-foundation---paper-2` keeps its triple-dash slug** and is **now
  indexed** (2026-09-11). Renaming it is no longer free: it would need the same
  permanent-redirect treatment the courses got. Worth doing, but as its own change.
- **The preview domain is crawlable** (`Allow: /`), noted in #714. Canonicals handle
  it; an `X-Robots-Tag: noindex` on that deployment would guarantee it.
- **`/courses` is still "unknown to Google"** and that is intended: it 301s to
  `/events`, per the note at `scripts/prerender.mjs:501`.
