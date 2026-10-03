import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { GROUPS, groupsFor, labelOf, iconOf } from './buildGroups';
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

// Every button the game can ever put on the strip: each group, over each thing that offers it,
// with the word and the picture it would actually wear. Some groups are called one thing over a
// habitat and another over a lion, and the drawing follows the word, so neither can be checked on
// its own.
const seeded = initialZooState(3).backlog;
const landscape = seeded.find((it) => it.category === 'flora'
  && LANDSCAPE_TYPES.includes(it.template ?? ''));
const everything: BacklogItem[] = [...seeded, ...(landscape ? [] : [
  { ...seeded.find((it) => it.category === 'flora')!, template: LANDSCAPE_TYPES[0] },
])];
const everyButton = () => everything.flatMap((item) => groupsFor(item)
  .map((g) => ({ item, group: g, label: labelOf(g, item), icon: iconOf(g, item) })));

describe('one drawing per name', () => {
  it('gives the same name the same drawing wherever it appears', () => {
    // Not just groups that share a `label`: the first decision is Structure over a habitat, Species
    // over an animal and Planting over a plant, so the word a button wears is not the word in the
    // registry. A house drawn over "Species" is the picture saying one thing and the word another.
    const byName = new Map<string, Set<string>>();
    for (const b of [...GROUPS.map((g) => ({ label: g.label, icon: g.icon })), ...everyButton()]) {
      if (!byName.has(b.label)) byName.set(b.label, new Set());
      byName.get(b.label)!.add(b.icon);
    }
    expect(byName.size, 'no names to check').toBeGreaterThan(10);
    for (const [label, icons] of byName) {
      expect([...icons], `"${label}" is drawn ${icons.size} different ways`).toHaveLength(1);
    }
  });

  // Drawings in the folder that are not a build group's. There is one: the mark for acceptance
  // criteria, which belongs to the item being built rather than to any control, and stands on the
  // chip and on the panel the chip opens.
  //
  // Named here rather than letting the orphan check wave anything unused through. A drawing nobody
  // put anywhere is still a fault; this says which ones are placed by hand and where to look.
  const NOT_A_GROUP: Record<string, string> = {
    'acceptance-criteria': 'the item chip and the criteria panel - AcceptanceCriteriaIcon.tsx',
  };

  it('draws every button, and draws nothing nobody asked for', () => {
    const used = new Set<string>();
    for (const g of GROUPS) {
      expect(Object.keys(TOOLBAR_ICONS), `${g.id} points at a drawing that is not in the set`)
        .toContain(g.icon);
      used.add(g.icon);
    }
    for (const b of everyButton()) {
      expect(Object.keys(TOOLBAR_ICONS), `${b.group.id} over ${b.item.category} points at a drawing that is not in the set`)
        .toContain(b.icon);
      used.add(b.icon);
    }
    for (const name of Object.keys(TOOLBAR_ICONS)) {
      if (NOT_A_GROUP[name]) continue;
      expect(used.has(name), `${name}.svg is in docs/zoo-toolbar but on no button`).toBe(true);
    }
    // ...and the hand-placed ones really are placed, so this list cannot become a way of keeping a
    // drawing nobody uses.
    for (const [name, where] of Object.entries(NOT_A_GROUP)) {
      expect(Object.keys(TOOLBAR_ICONS), `${name} is listed as hand-placed but is not in the set`)
        .toContain(name);
      expect(used.has(name), `${name} is a group's drawing after all, so it needs no exception`)
        .toBe(false);
      expect(where, `${name} does not say where it is placed`).toBeTruthy();
    }
  });

  it('names the first decision after the thing being built', () => {
    // The pair this was all for. Checked by name rather than by group id, because what makes it
    // right is that the word and the picture agree.
    const first = (category: string) => everyButton()
      .find((b) => b.item.category === category && b.group.id === 'structure');
    expect(first('enclosure')).toMatchObject({ label: 'Structure', icon: 'structure' });
    expect(first('exhibit')).toMatchObject({ label: 'Species', icon: 'species' });
    expect(first('flora')).toMatchObject({ label: 'Planting', icon: 'planting' });
    expect(first('amenity')).toMatchObject({ label: 'Structure', icon: 'structure' });
  });
});

describe('no object shows the same picture twice', () => {
  it('offers each of them a strip of distinct buttons', () => {
    expect(everything.length, 'nothing to check').toBeGreaterThan(3);
    for (const item of everything) {
      const icons = groupsFor(item).map((g) => iconOf(g, item));
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

describe('the strip draws what the registry says', () => {
  // Everything above checks the registry. None of it would notice the strip reading `g.icon` and
  // ignoring `iconOf`, which is the whole of what makes the first button a lion over a lion - so
  // this one looks at the markup that actually reached the button.
  const strip = async (category: string) => {
    const { render } = await import('@testing-library/react');
    const { MemoryRouter } = await import('react-router-dom');
    const { ParkOptions } = await import('./ParkOptions');
    const React = await import('react');
    const noop = () => {};
    const state = { ...initialZooState(3), phase: 'sprint', dayStage: 'building', sprintNumber: 1 };
    const item = state.backlog.find((it) => it.category === category)!;
    const { container } = render(React.createElement(MemoryRouter, null,
      React.createElement(ParkOptions as never, {
        state, item, api: { onDesign: noop, onInside: noop, onTurn: noop, onUnplace: noop },
      })));
    return container;
  };
  // The DOM writes `<path></path>` where the file writes `<path/>`. Same drawing, different
  // spelling, so both are flattened before they are compared.
  const shapes = (markup: string) => markup.replace(/\s*\/>/g, '>').replace(/<\/[a-z]+>/g, '');
  const drawnOn = (container: Element, id: string) =>
    shapes(container.querySelector(`[data-part="group-${id}"] svg`)?.innerHTML ?? '');

  it('puts the lion on the lion and the house on the habitat', async () => {
    for (const [category, icon] of [
      ['exhibit', 'species'], ['flora', 'planting'],
      ['enclosure', 'structure'], ['amenity', 'structure'],
    ] as const) {
      const container = await strip(category);
      const button = container.querySelector('[data-part="group-structure"]');
      expect(button, `a ${category} has no first decision on its strip`).toBeTruthy();
      expect(drawnOn(container, 'structure'), `a ${category} is not drawn as ${icon}`)
        .toBe(shapes(TOOLBAR_ICONS[icon].inner));
    }
  });

  it('names the button what it draws', async () => {
    const container = await strip('exhibit');
    expect(container.querySelector('[data-part="group-structure"]')?.getAttribute('aria-label'))
      .toBe('Species');
  });
});

describe('what a button says when you hover it', () => {
  // The tooltip used to add "- something here would finish this item" whenever the dot was lit,
  // which is the dot saying itself in words beside itself: "the hover over labels are weird for
  // some - extra duplicate text."
  //
  // The dot is the one on screen saying it now. For anyone who cannot see the dot it is said in a
  // hidden line the button points at, because `aria-label` on a button replaces everything inside
  // it, so the dot's own label was never announced to begin with.
  const strip = async () => {
    const { render } = await import('@testing-library/react');
    const { MemoryRouter } = await import('react-router-dom');
    const { ParkOptions } = await import('./ParkOptions');
    const React = await import('react');
    const noop = () => {};
    const state = { ...initialZooState(3), phase: 'sprint', dayStage: 'building', sprintNumber: 1 };
    const habitat = state.backlog.find((it) => it.category === 'enclosure')!;
    return render(React.createElement(MemoryRouter, null,
      React.createElement(ParkOptions as never, {
        state, item: habitat, api: { onDesign: noop, onInside: noop, onTurn: noop, onUnplace: noop },
      }))).container;
  };

  it('says its name and nothing else', async () => {
    const container = await strip();
    const buttons = [...container.querySelectorAll('[data-part^="group-"]')];
    expect(buttons.length, 'no buttons to hover').toBeGreaterThan(3);
    for (const b of buttons) {
      // The pen is the exception: a mode with nothing on screen for it once the menu is shut.
      if (b.getAttribute('data-drawing') === 'yes') continue;
      expect(b.getAttribute('title'), `${b.getAttribute('aria-label')} says more than its name`)
        .toBe(b.getAttribute('aria-label'));
    }
  });

  it('leaves the lit dot to say the lit part, and says it where a tooltip cannot reach', async () => {
    const container = await strip();
    const lit = [...container.querySelectorAll('[data-part^="group-"][data-lit="yes"]')];
    expect(lit.length, 'nothing on this strip is lit, so there is nothing to check').toBeGreaterThan(0);
    for (const b of lit) {
      expect(b.getAttribute('title'), 'the tooltip repeats the dot').not.toMatch(/would finish/i);
      const describedBy = b.getAttribute('aria-describedby');
      expect(describedBy, 'a lit button describes itself to nobody').toBeTruthy();
      const said = container.querySelector(`#${CSS.escape(describedBy!)}`)?.textContent ?? '';
      expect(said, 'the description does not say what being lit means').toMatch(/would finish this item/i);
    }
    // ...and an unlit one points at nothing, rather than at an empty description.
    for (const b of container.querySelectorAll('[data-part^="group-"][data-lit="no"]')) {
      expect(b.getAttribute('aria-describedby'), 'an unlit button still describes itself as lit')
        .toBeNull();
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
