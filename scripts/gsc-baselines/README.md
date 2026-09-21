# GSC baselines

Dated snapshots of `node scripts/gsc-report.mjs` output, kept so SEO changes can
be measured before/after. Re-run the report and save as `<YYYY-MM-DD>.txt` to add
a new snapshot, then diff against an earlier one.

- **2026-06-25.txt** — first saved baseline. Captured just after the exam + SEO
  work shipped (Jun 19-22) but before Google had re-crawled/indexed it, so it is
  effectively the *pre-change* anchor. Exam pages all "Crawled - currently not
  indexed"; sitemap 40 URLs / 0 indexed; 7 clicks / 422 impressions over 28 days.
- **2026-09-21.txt** — taken the day the URL work shipped (#710-#714) and a few
  hours after the sitemap was resubmitted, so Google has not yet recrawled the
  new course slugs. The course URLs inspected here are the **old uuids**, which
  now 308 to slugs; treat their verdicts as the equity being handed over, not as
  the state of the new addresses. See `docs/seo-request-indexing-2026-09-21.md`.
