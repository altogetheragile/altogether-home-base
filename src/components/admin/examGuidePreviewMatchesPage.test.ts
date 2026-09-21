import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

// The preview has to show what the page will show.
//
// The guide is written in Admin and rendered by the Next app, which is a different codebase with a
// different markdown parser. That is exactly the shape of problem this repo keeps having: the home
// page had a twin nobody edited, and three sitemaps disagreed about the site's own URLs. A preview
// that quietly drifts from the page is worse than no preview, because it is believed.
//
// So: every element the preview styles must be styled on the page, and every element the page
// styles must be styled in the preview, apart from the GFM table elements react-markdown does not
// produce without remark-gfm. Add a rule to one side and this fails until the other catches up.

const PAGE = 'apps/web/src/app/exams/[slug]/ExamPlayer.tsx';
const PREVIEW = 'src/components/admin/ExamGuideEditor.tsx';

/** Elements named by the page's `.aa-exam-guide <el>` rules. */
function pageElements(): Set<string> {
  const src = readFileSync(PAGE, 'utf8');
  const els = new Set<string>();
  for (const m of src.matchAll(/\.aa-exam-guide\s+([a-z]+[a-z0-9]*)/g)) els.add(m[1]);
  return els;
}

/** Elements the preview maps to a className, and overrides for react-markdown. */
function previewElements(): Set<string> {
  const src = readFileSync(PREVIEW, 'utf8');
  const block = src.slice(src.indexOf('const PREVIEW = {'), src.indexOf('};', src.indexOf('const PREVIEW = {')));
  const els = new Set<string>();
  for (const m of block.matchAll(/^\s{2}([a-z]+[a-z0-9]*):/gm)) els.add(m[1]);
  return els;
}

// react-markdown does not emit these without remark-gfm, which is not a dependency. Listed rather
// than ignored, so adding remark-gfm is a deliberate act that empties this list.
const GFM_ONLY = new Set(['table', 'th', 'td']);

describe('the guide preview', () => {
  it('styles every element the exam page styles', () => {
    const missing = [...pageElements()].filter((el) => !previewElements().has(el) && !GFM_ONLY.has(el));
    expect(missing, `the page styles ${missing.join(', ')} and the preview does not`).toEqual([]);
  });

  it('styles nothing the exam page does not', () => {
    const extra = [...previewElements()].filter((el) => !pageElements().has(el));
    expect(extra, `the preview styles ${extra.join(', ')} and the page does not`).toEqual([]);
  });

  it('finds rules on both sides, so a passing result means something', () => {
    expect(pageElements().size).toBeGreaterThan(5);
    expect(previewElements().size).toBeGreaterThan(5);
  });
});
