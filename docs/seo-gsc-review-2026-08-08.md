# Search Console review — 2026-08-08

Ran `node scripts/gsc-report.mjs`. **Data is current** — through 2026-08-07 (yesterday).

## Headline

Indexing is *mostly* fine. The real problem isn't indexing — it's **ranking**:
the site earns ~50 impressions/day but sits at **average position ~45 (page 4–5)**,
so it gets **≈0 clicks** (1 click in the last 28 days, 1.4k impressions). A handful
of specific pages are genuinely not indexed; the rest are indexed but ranking too
low to be seen.

Also note: the sitemap line shows "39 submitted, **0 indexed**" — that number is a
long-standing GSC quirk (the sitemap "indexed" count is deprecated and usually
reads 0). The real status is per-URL, below.

## Index status (key pages)

| Page | Status |
|---|---|
| `/`, `/blog`, `/events`, `/coaching`, `/exams`, `/about` | ✅ Indexed |
| `/exams/agilepm-foundation-paper-1` | ✅ Indexed |
| `/exams/agilepm-foundation---paper-2` | ✅ Indexed (note the odd `---` slug) |
| `/exams/agilepm-practitioner-paper-1` | ⚠️ Crawled – currently not indexed (last crawl 2026-06-20) |
| `/exams/professional-scrum-master` | ⚠️ Crawled – currently not indexed (last crawl 2026-06-20) |
| `/courses` (hub) | ❌ URL unknown to Google |
| `/courses/<uuid>` (10 pages) | Mixed: 5 indexed, 3 "discovered/crawled – not indexed", 1 unknown |

## Why pages aren't indexed

- **"Crawled – currently not indexed"** (2 exam pages, some courses): Google *did*
  crawl them and chose **not** to index — its verdict that the page isn't (yet)
  worth a slot. On a lower-authority site this usually means **thin or near-duplicate
  content** and/or **low site authority**, not a technical block. The exam detail
  pages are server-rendered by the Next app with JSON-LD, so it's **not** a
  render/thin-shell problem — it's a content-value/authority signal. Tellingly, the
  two AgilePM Foundation papers *are* indexed while Practitioner + PSM aren't, and
  the not-indexed two haven't been re-crawled since **20 June** (7 weeks).
- **"Discovered – currently not indexed"** (some courses): Google knows the URL from
  the sitemap but hasn't prioritised crawling it — crawl-budget / low priority.
- **`/courses` "unknown to Google"**: the sitemap contains the `/courses/<uuid>`
  detail pages **but not the bare `/courses` hub URL**, and it isn't discovered by
  crawl either. Fixable.

## Why the exam pages aren't "highly positioned"

They rank **page 4–7**, not page 1:
- `/exams` hub: 317 impressions, **1 click**, avg **position 36.5**.
- Exam queries ("agile foundation exam", "agile practitioner exam", …): position
  **~28–68**, all **0 clicks**.

Position ~45 across almost everything is the signature of a **small / low-authority
site**: Google indexes you and occasionally shows you deep in the results, but you
haven't earned the authority (links, engagement, content depth) to rank on page 1
for competitive terms like "agile foundation exam". Two indexed exam pages can't
rank high, and two aren't indexed at all — so there's no page pulling traffic yet.

## What to do (prioritised)

1. **Add `/courses` to the sitemap** (and make sure it's linked in the nav) — fixes
   the "unknown to Google" hub. Quick win in `scripts/prerender.mjs` / the sitemap
   generator. (`/exams` is in the sitemap and indexed; `/courses` is not.)
2. **Request indexing** for the two not-indexed exam pages (`professional-scrum-master`,
   `agilepm-practitioner-paper-1`) via GSC → URL Inspection → *Request indexing*.
   Confirm each is **internally linked from `/exams`** (an internal link is the
   strongest re-crawl signal we control).
3. **Differentiate the exam pages' content.** The indexed-vs-not split hints Google
   sees the non-indexed ones as near-duplicates of the indexed papers. Give each exam
   a substantial, unique intro / description / FAQ (not the same shared block) so each
   page earns its own slot.
4. **Build authority over time** — internal linking, real backlinks, content depth.
   The flat position ~45 is an authority ceiling; indexing tweaks won't lift it much
   on their own. This is the slow, real lever.
5. **Re-submit the sitemap** (last downloaded 2026-07-30) after the `/courses` fix,
   and re-check in ~2 weeks.

## Bottom line

- ✅ Data is live and current (through 2026-08-07).
- The site **is** indexed for its main pages; a few exam/course pages are held at
  "crawled/discovered – not indexed" (content-value/authority, not a technical bug).
- Exam pages are **not** highly positioned — they sit ~page 4–5 with ~0 clicks. That's
  a **ranking/authority** problem, and the fix is content differentiation + internal
  links + earned authority over time, plus the two quick wins (sitemap `/courses`,
  request-indexing the two exam pages).
