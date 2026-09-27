import { describe, it, expect } from 'vitest';
import { STEPS, fieldsForStep, headlineKeys } from './steps';
import { REGISTRIES } from '@/lib/copy';

// A wizard step names its fields by key. A key that is wrong does not throw: the box simply is
// not drawn, and the step looks finished while asking for nothing. That is the failure worth
// testing for, because it is silent and it is the one a rename causes.

const entriesFor = (page: string) => REGISTRIES.find((r) => r.page === page)?.entries ?? {};

describe('every step', () => {
  it('asks only for fields that exist', () => {
    const missing: string[] = [];
    for (const step of STEPS) {
      if (!step.page) continue;
      const known = entriesFor(step.page);
      for (const key of step.keys) if (!(key in known)) missing.push(`${step.id}: ${key}`);
    }
    expect(missing, `named but not in the registry: ${missing.join(', ')}`).toEqual([]);
  });

  it('names a registry that exists, or none at all', () => {
    for (const step of STEPS) {
      if (!step.page) continue;
      expect(REGISTRIES.some((r) => r.page === step.page), `${step.id} names page "${step.page}"`).toBe(true);
    }
  });

  it('says what it is for in its own words', () => {
    for (const step of STEPS) {
      expect(step.blurb.trim().length, `${step.id} has nothing to say for itself`).toBeGreaterThan(40);
      expect(step.title.trim()).not.toBe(step.blurb.trim());
    }
  });

  it('asks for nothing twice', () => {
    // A field on two steps is saved twice and, worse, can be answered differently on each.
    const seen = new Map<string, string>();
    for (const step of STEPS) {
      for (const key of step.keys) {
        expect(seen.has(key), `${key} is on both ${seen.get(key)} and ${step.id}`).toBe(false);
        seen.set(key, step.id);
      }
    }
  });
});

describe('what the first three steps cover', () => {
  // The site registry is the one a new owner has no other obvious route to, so the wizard should
  // ask for essentially all of it.
  const asked = new Set(STEPS.flatMap((s) => (s.page === 'site' ? s.keys : [])));
  const all = Object.keys(entriesFor('site'));

  /** Fields on that tab which are deliberately not part of setting a site up, with the reason.
   *
   *  A rule rather than a list of keys, because one of them covers a group: naming seven colours
   *  one at a time would read as seven separate decisions when it is one. */
  const NOT_SETUP: { why: string; covers: (key: string) => boolean }[] = [
    {
      why: 'A list of other sites you look after. Nothing to do with making this one yours, and '
        + 'asking a new owner about it during their first ten minutes would be baffling.',
      covers: (k) => k === 'site.managed',
    },
    {
      why: 'The refinements of the palette: body and quiet text, the page colour, the light ink '
        + 'on a dark band, the hero band, the hovered accent and the warning colour. Every one is '
        + 'editable on the This Site tab, and none of them is a question to put to somebody in '
        + 'their first ten minutes. Setup asks for the five that decide what the site looks like.',
      covers: (k) => /^site\.brand\.colors\./.test(k) && !SETUP_COLOURS.has(k),
    },
  ];

  /** The five the wizard does ask for: the ones that decide the look. */
  const SETUP_COLOURS = new Set([
    'site.brand.colors.orange', 'site.brand.colors.deepTeal', 'site.brand.colors.midTeal',
    'site.brand.colors.skyTeal', 'site.brand.colors.paleTeal',
  ]);

  const excused = (key: string) => NOT_SETUP.some((r) => r.covers(key));

  it('asks for every field on the site registry', () => {
    const skipped = all.filter((k) => !asked.has(k) && !excused(k));
    expect(skipped, `on the This Site tab but never asked for: ${skipped.join(', ')}`).toEqual([]);
  });

  it('still asks for the five colours that decide the look', () => {
    for (const key of SETUP_COLOURS) expect(asked, `setup stopped asking for ${key}`).toContain(key);
  });

  it('has a reason written down for anything it skips', () => {
    // The exception list is the place that decision is made, so it cannot grow by accident.
    for (const rule of NOT_SETUP) {
      expect(all.some(rule.covers), `a rule excuses nothing on the tab: ${rule.why}`).toBe(true);
      expect(rule.why.length, 'an exception with no reason written down').toBeGreaterThan(40);
    }
    expect(NOT_SETUP.length, 'too much of the tab is being skipped for this test to mean anything').toBeLessThan(3);
  });

  it('is asking for a real number of things, so a passing result means something', () => {
    expect(asked.size).toBeGreaterThan(15);
  });
});

describe('picking the fields for a step', () => {
  const available = [
    { key: 'site.company_name', value: 'a' },
    { key: 'site.contact_email', value: 'b' },
  ];

  it('returns them in the order the step asks, not the order they arrived', () => {
    const step = { id: 'identity', title: '', blurb: '', page: 'site', keys: ['site.contact_email', 'site.company_name'] } as const;
    expect(fieldsForStep(step, available).map((f) => f.key)).toEqual(['site.contact_email', 'site.company_name']);
  });

  it('drops a key the registry no longer has rather than failing the step', () => {
    // A renamed key should cost one box, not the whole screen.
    const step = { id: 'identity', title: '', blurb: '', page: 'site', keys: ['site.company_name', 'site.gone'] } as const;
    expect(fieldsForStep(step, available).map((f) => f.key)).toEqual(['site.company_name']);
  });
});

describe('the headline pieces of a page', () => {
  it('picks the hero and the search description where a page has them', () => {
    const keys = Object.keys(entriesFor('coaching'));
    const picked = headlineKeys('coaching', keys);
    expect(picked).toContain('coaching.hero.heading');
    expect(picked.every((k) => keys.includes(k))).toBe(true);
  });

  it('never offers the visibility switch as a headline', () => {
    // It is asked for on its own step. Asking again here would let somebody switch a page off
    // from the step about writing its words.
    for (const registry of REGISTRIES) {
      const picked = headlineKeys(registry.page, Object.keys(registry.entries));
      expect(picked.some((k) => k.endsWith('.visible')), `${registry.page}`).toBe(false);
    }
  });

  it('falls back to something rather than nothing on a page with no hero', () => {
    expect(headlineKeys('made-up', ['made-up.a', 'made-up.b', 'made-up.c'])).toEqual(['made-up.a', 'made-up.b']);
  });

  it('gives every switched-on page something to show', () => {
    for (const registry of REGISTRIES) {
      if (registry.page === 'site' || registry.page === 'navigation') continue;
      const picked = headlineKeys(registry.page, Object.keys(registry.entries));
      expect(picked.length, `${registry.page} would show an empty step`).toBeGreaterThan(0);
    }
  });
});
