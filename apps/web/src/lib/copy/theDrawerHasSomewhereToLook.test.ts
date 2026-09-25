import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { groupFields, groupOf, matches, filterGroups, UNGROUPED } from '@altogether/ui/editor/grouping';
import { REGISTRIES } from './index';
import type { CopyEntry } from './fields';

// The drawer listed every field of a page in one flat column: 38 on About, 34 on This Site, 204
// across the site. A column that long has no landmarks. You scroll past what you came for, and a
// switch fourteen fields down is for practical purposes not there, which is how somebody looking
// to hide one page reached for the only switch on screen and took a whole menu with it.

const field = (key: string, extra: Partial<{ label: string; hint: string; group: string }> = {}) => ({
  key, label: extra.label ?? key, hint: extra.hint ?? '', value: '', shipped: '',
  ...(extra.group ? { group: extra.group } : {}),
});

describe('the drawer has somewhere to look', () => {
  describe('where a field belongs', () => {
    it('reads it from the middle of the key, so nothing has to be kept in step', () => {
      expect(groupOf(field('home.hero.heading'))).toBe('Hero');
      expect(groupOf(field('home.founder.years'))).toBe('Founder');
    });

    it('says it in words a person would use, where the key does not', () => {
      expect(groupOf(field('contact.meta.description'))).toBe('Search and sharing');
      expect(groupOf(field('home.cta.heading'))).toBe('Call to action');
    });

    it('lets a field say its own group where the key cannot', () => {
      // site.company_name has no middle, and nav.resources.visible's middle is the thing itself.
      expect(groupOf(field('site.company_name', { group: 'What this site is called' })))
        .toBe('What this site is called');
    });

    it('puts a field with no middle and nothing declared with the page', () => {
      expect(groupOf(field('contact.visible'))).toBe(UNGROUPED);
    });
  });

  describe('the groups themselves', () => {
    it('keeps registry order, which is the order things appear on the page', () => {
      const groups = groupFields([field('p.hero.a'), field('p.cta.b'), field('p.hero.c')]);
      expect(groups.map((g) => g.name)).toEqual(['Hero', 'Call to action']);
      expect(groups[0].fields.map((f) => f.key)).toEqual(['p.hero.a', 'p.hero.c']);
    });

    it('does not group a page that would end up as one group', () => {
      // A single heading over everything is a landmark marking nothing.
      expect(groupFields([field('p.hero.a'), field('p.hero.b')])).toEqual([]);
    });
  });

  describe('finding one field among many', () => {
    const fields = [
      field('site.brand.images.logo', { label: 'Logo', hint: 'Top left of every page.' }),
      field('site.contact_email', { label: 'Email address', hint: 'Shown in the footer.' }),
    ];

    it('matches the words on screen and the key, in any case', () => {
      expect(matches(fields[0], 'LOGO')).toBe(true);
      expect(matches(fields[0], 'top left')).toBe(true);
      expect(matches(fields[0], 'brand.images')).toBe(true);
      expect(matches(fields[0], 'telephone')).toBe(false);
    });

    it('shows everything when nothing has been typed', () => {
      expect(fields.every((f) => matches(f, '   '))).toBe(true);
    });

    it('drops a group with nothing left in it', () => {
      const groups = groupFields([field('p.hero.a', { label: 'Heading' }), field('p.cta.b', { label: 'Button' })]);
      expect(filterGroups(groups, 'button').map((g) => g.name)).toEqual(['Call to action']);
    });
  });

  describe('every tab, against the real registries', () => {
    for (const registry of REGISTRIES) {
      const entries = Object.entries(registry.entries) as [string, CopyEntry][];
      const fields = entries.map(([key, e]) => field(key, { label: e.label, hint: e.hint, group: e.group }));
      const groups = groupFields(fields);

      it(`${registry.page}: loses no field to grouping`, () => {
        const inGroups = groups.flatMap((g) => g.fields.map((f) => f.key));
        // Either grouped in full, or deliberately left as one list.
        expect(groups.length === 0 || inGroups.length === fields.length).toBe(true);
      });

      if (entries.length > 12) {
        it(`${registry.page}: is long enough to need groups, and gets more than one`, () => {
          expect(groups.length).toBeGreaterThan(1);
        });

        it(`${registry.page}: has no group so big it is a flat list again`, () => {
          for (const g of groups) {
            expect(g.fields.length, `${registry.page} / ${g.name} holds ${g.fields.length}`)
              .toBeLessThanOrEqual(Math.ceil(entries.length * 0.6));
          }
        });
      }
    }
  });

  it('is actually wired into the drawer, searched and folded', () => {
    const src = readFileSync(resolve(__dirname, '../../../../../packages/ui/src/editor/EditDrawer.tsx'), 'utf-8');
    expect(src).toContain('groupFields');
    expect(src).toContain('filterGroups');
    // The fold state is the person's, so it must survive a save rather than being recomputed.
    expect(src).toContain('foldedFor');
  });
});
