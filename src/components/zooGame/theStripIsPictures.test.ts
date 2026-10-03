import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { GROUPS, groupsFor } from './buildGroups';
import { TOOLBAR_ICONS } from './toolbarIcons';
import { initialZooState } from './config';
import { LANDSCAPE_TYPES } from './design';
import type { BacklogItem } from './types';

// The build strip is twelve drawings standing in for seventeen groups of controls, and that only
// works because of two things that are true today and could quietly stop being true.
//
// Twelve covers seventeen because four groups are called Look, two are Size and two are How many -
// the same act on a different kind of thing. The icons follow the names, not the groups.
//
// That is safe only while no single object can offer two groups with the same name. It cannot
// today: a habitat has a footprint, a plant has a grown size, nothing is both. If it ever could,
// the player would see one picture twice on one strip with nothing to tell the buttons apart - and
// the only sign of it in the code would be two identical `icon:` lines, which read as correct.

const ROOT = resolve(__dirname, '../../..');

describe('one drawing per name', () => {
  it('gives groups that share a name the same drawing', () => {
    const byName = new Map<string, Set<string>>();
    for (const g of GROUPS) {
      if (!byName.has(g.label)) byName.set(g.label, new Set());
      byName.get(g.label)!.add(g.icon);
    }
    for (const [label, icons] of byName) {
      expect([...icons], `"${label}" is drawn ${icons.size} different ways`).toHaveLength(1);
    }
  });

  it('draws every group, and draws nothing nobody asked for', () => {
    for (const g of GROUPS) {
      expect(Object.keys(TOOLBAR_ICONS), `${g.id} points at a drawing that is not in the set`)
        .toContain(g.icon);
    }
    const used = new Set(GROUPS.map((g) => g.icon));
    for (const name of Object.keys(TOOLBAR_ICONS)) {
      expect(used.has(name as never), `${name}.svg is in docs/zoo-toolbar but on no button`).toBe(true);
    }
  });
});

describe('no object shows the same picture twice', () => {
  // Every item the game seeds, plus a piece of landscape - which is the one kind whose controls
  // change with what it is, because a river is not grown and has no copies.
  const seeded = initialZooState(3).backlog;
  const landscape = seeded.find((it) => it.category === 'flora'
    && LANDSCAPE_TYPES.includes(it.template ?? ''));
  const everything: BacklogItem[] = [...seeded, ...(landscape ? [] : [
    { ...seeded.find((it) => it.category === 'flora')!, template: LANDSCAPE_TYPES[0] },
  ])];

  it('offers each of them a strip of distinct buttons', () => {
    expect(everything.length, 'nothing to check').toBeGreaterThan(3);
    for (const item of everything) {
      const icons = groupsFor(item).map((g) => g.icon);
      const twice = icons.filter((n, i) => icons.indexOf(n) !== i);
      expect(twice, `${item.name} (${item.category}) shows ${twice.join(', ')} twice`).toEqual([]);
    }
  });

  it('covers all four kinds of thing', () => {
    // Otherwise the check above passes by never looking at an animal. The four kinds that get
    // built: a habitat, an animal, a building and something planted.
    for (const c of ['enclosure', 'exhibit', 'amenity', 'flora']) {
      expect(everything.some((it) => it.category === c), `no ${c} to check`).toBe(true);
    }
    // And the strip really is being asked for buttons, rather than coming back empty for all of it.
    expect(everything.filter((it) => groupsFor(it).length > 1).length,
      'barely anything offered a strip').toBeGreaterThan(3);
  });
});

describe('the drawings themselves', () => {
  it('are the files in docs/zoo-toolbar, unedited', () => {
    // The generated module is checked in, so it can be edited by hand and nothing would notice
    // until the next import quietly reverted it. CI runs the importer with --check too; this says
    // the same thing to anyone running the tests.
    const files = readdirSync(resolve(ROOT, 'docs/zoo-toolbar/icons'))
      .filter((f) => f.endsWith('.svg'));
    expect(files).toHaveLength(Object.keys(TOOLBAR_ICONS).length);
    for (const f of files) {
      const id = f.replace('.svg', '').replace(/_/g, '-');
      const svg = readFileSync(resolve(ROOT, 'docs/zoo-toolbar/icons', f), 'utf8');
      const inner = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').trim();
      expect(TOOLBAR_ICONS[id as never], `${f} has no drawing in toolbarIcons.ts`).toBeTruthy();
      expect((TOOLBAR_ICONS[id as never] as { inner: string }).inner)
        .toBe(inner.replace(/#004D4D/gi, 'currentColor'));
    }
  });

  it('take their colour from the button', () => {
    // A hex baked into a drawing would stay that colour on a dark park and on a lit button.
    for (const [name, icon] of Object.entries(TOOLBAR_ICONS)) {
      expect(icon.inner, `${name} has a colour of its own`).not.toMatch(/#[0-9a-f]{3,8}\b/i);
      expect(icon.inner, `${name} is drawn in nothing`).toMatch(/currentColor/);
      expect(icon.box, `${name} is not drawn in a 24-square box`).toBe('0 0 24 24');
    }
  });
});

describe('the strip is one row', () => {
  // This is the fault the icons were for, and it has been fixed twice before by trading the park's
  // space for it: "it does not look good, it reduces the size of the studio work area."
  //
  // jsdom has no layout, so nothing here can measure a wrap. What it can hold is the mechanism: the
  // row lays its buttons out in a line and does not wrap, and when there is not enough width it
  // scrolls sideways inside its own box rather than growing a second line downwards into the park.
  // Measured in a browser at the time of writing: a habitat, which has the most controls of
  // anything in the game, came to one 44px row at every column width from 380px up.
  it('lays the controls out in a line that cannot wrap', async () => {
    const { render } = await import('@testing-library/react');
    const { MemoryRouter } = await import('react-router-dom');
    const { ParkOptions } = await import('./ParkOptions');
    const React = await import('react');
    const noop = () => {};
    const state = { ...initialZooState(3), phase: 'sprint', dayStage: 'building', sprintNumber: 1 };
    const habitat = state.backlog.find((it) => it.category === 'enclosure')!;
    const { container } = render(React.createElement(MemoryRouter, null,
      React.createElement(ParkOptions as never, {
        state, item: habitat, api: { onDesign: noop, onInside: noop, onTurn: noop, onUnplace: noop },
      })));
    const row = container.querySelector('[data-part="park-controls"]')!;
    const css = row.className;
    expect(css, 'the row wraps again, so the menus will drop a line into the park').not.toMatch(/\bflex-wrap\b/);
    expect(css, 'a row that cannot wrap and cannot scroll will push the park sideways instead')
      .toMatch(/\boverflow-x-auto\b/);
    // And the buttons themselves hold their size, so a long one cannot squeeze the rest.
    for (const b of container.querySelectorAll('[data-part^="group-"]')) {
      expect(b.className, 'a strip button can be squeezed').toMatch(/\bshrink-0\b/);
    }
  });
});
