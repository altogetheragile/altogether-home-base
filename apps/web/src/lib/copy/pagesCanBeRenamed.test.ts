import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { REGISTRIES } from './index';

// A page's name was written out three times: the menu, the browser tab and the breadcrumb in the
// structured data. Only the menu was editable, so renaming Coaching to Services produced a site
// whose menu said Services and whose tab and breadcrumb said Coaching.
//
// Two out of three is worse than none. A search engine reading a breadcrumb that disagrees with
// the page is being told the site is unsure what it is called.

const SITE_PAGES = ['about', 'coaching', 'contact', 'testimonials', 'blog', 'events', 'exams'];
const source = (page: string) => readFileSync(`src/app/${page}/page.tsx`, 'utf8');

describe('every page the Site serves', () => {
  it('takes its browser tab title from copy, not from a string in the file', () => {
    const hardcoded = SITE_PAGES.filter((page) => {
      // Only the metadata block. Elsewhere on a page "title" is an ordinary word: the contact
      // page has cards titled Email and Location, and those are not the page's name.
      const meta = source(page).match(/export async function generateMetadata[\s\S]*?\n}/)?.[0] ?? '';
      return /title:\s*['"][A-Z]/.test(meta) || /absolute:\s*`[A-Z]/.test(meta);
    });
    expect(hardcoded, `title still written into the file: ${hardcoded.join(', ')}`).toEqual([]);
  });

  it('declares that title as an editable field', () => {
    const missing = SITE_PAGES.filter((page) => {
      const entries = REGISTRIES.find((r) => r.page === page)?.entries ?? {};
      return !(`${page}.meta.titlePrefix` in entries);
    });
    // About came with one already, under the same name, which is why that name was used.
    expect(missing, `no editable title: ${missing.join(', ')}`).toEqual([]);
  });

  it('builds its breadcrumb from what the site calls the page', () => {
    const hardcoded = SITE_PAGES.filter((page) => source(page).includes(`{ name: '`) && !source(page).includes('pageCrumbs('));
    expect(hardcoded, `breadcrumb still names the page itself: ${hardcoded.join(', ')}`).toEqual([]);
  });
});

describe('the shipped titles', () => {
  const titleOf = (page: string) =>
    REGISTRIES.find((r) => r.page === page)?.entries[`${page}.meta.titlePrefix`]?.value ?? '';

  it('says what the page is, not what this business sells', () => {
    // The events and exams titles were tuned for this site's search terms: "Agile Training
    // Courses in London & the UK". A new site should not start by advertising London agile
    // training, so those live in the database here and the registry ships the plain name.
    for (const page of SITE_PAGES) {
      const value = titleOf(page);
      expect(value.trim().length, `${page} ships no title at all`).toBeGreaterThan(0);
      expect(value, `${page} ships this site's search terms`).not.toMatch(/London|AgilePM|Scrum|Agile Training/i);
    }
  });

  it('never ships the business name, which is added separately', () => {
    for (const page of SITE_PAGES) {
      expect(titleOf(page), `${page} would read "X - Altogether Agile - Altogether Agile"`).not.toMatch(/Altogether/i);
    }
  });
});
