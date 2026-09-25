import { describe, it, expect } from 'vitest';
import { REGISTRIES } from './index';
import type { CopyEntry } from './fields';

// The same site_settings column used to be switchable from three different screens: an admin
// settings page, the page's own editor drawer, and the menu drawer. Eleven columns had two
// switches and two had three. They disagreed about what they even did: one screen called them
// modules that decide what the site allows, the other said the page "answers Not Found".
//
// A second switch for one column is not a convenience. It is two controls that can be left saying
// different things, and a change made in one place that appears not to have worked in the other.

const switches = REGISTRIES.flatMap((r) =>
  Object.entries(r.entries)
    .map(([key, e]) => ({ page: r.page, key, entry: e as CopyEntry }))
    .filter(({ entry }) => entry.type === 'switch'),
);

describe('one switch per thing', () => {
  it('has switches to find at all', () => {
    // Guards the test itself: a registry that stopped loading would otherwise pass silently.
    expect(switches.length).toBeGreaterThan(8);
  });

  /** The two that are still offered twice, named so they cannot be joined by a third.
   *
   *  Both have a page of their own and a place in the Resources menu, so a switch grew in each:
   *  one on the page's drawer, one on the menu's. Deciding which to keep is a choice about where
   *  page visibility belongs in general, not a tidy-up, because the three other Resources items
   *  have no page registry to be switched from. Left as it was found, and listed, rather than
   *  settled silently in a change about something else. */
  const KNOWN_TWICE = new Set(['show_blog', 'show_exams']);

  it('never offers the same column in two places', () => {
    const seen = new Map<string, string>();
    const twice: string[] = [];
    for (const { page, key, entry } of switches) {
      const column = entry.store === 'column' ? entry.path : `${entry.store}:${entry.path}`;
      if (!column) continue;
      if (seen.has(column)) {
        if (!KNOWN_TWICE.has(column)) twice.push(`${column} is on ${seen.get(column)} and on ${page}/${key}`);
      } else seen.set(column, `${page}/${key}`);
    }
    expect(twice, twice.join('; ')).toEqual([]);
  });

  it('has not quietly resolved the known pair without removing them from the list', () => {
    // An exception list that outlives its exception stops being a record and becomes noise.
    const columns = new Set(
      switches.map(({ entry }) => (entry.store === 'column' ? entry.path : null)).filter(Boolean),
    );
    for (const known of KNOWN_TWICE) {
      expect(columns.has(known), `${known} is no longer a switch at all; drop it from KNOWN_TWICE`).toBe(true);
    }
  });

  it('writes every switch to somewhere real', () => {
    // A switch with no path saves nothing and reports success.
    for (const { page, key, entry } of switches) {
      expect(entry.store, `${page}/${key} has no store`).toBeTruthy();
      expect(entry.path?.trim(), `${page}/${key} has no path`).toBeTruthy();
    }
  });
});
