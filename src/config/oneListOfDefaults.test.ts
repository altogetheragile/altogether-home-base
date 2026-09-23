import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { MODULE_DEFAULTS, moduleIsOn } from '@altogether/ui/modules';
import { MODULES, flagOf } from './modules';

// These defaults lived in three places and disagreed. Navigation said Events and Blog were on
// while the Site's module gate said they were off, so a site with no settings row showed two links
// in its own header that both answered 404. Nobody noticed, because altogetheragile.com has a
// settings row and the defaults never ran.
//
// Found by standing up a second site and clicking the links.

const read = (p: string) => readFileSync(new URL(p, `file://${process.cwd()}/`).pathname, 'utf8');

describe('one list of module defaults', () => {
  it('is the only place a default is written', () => {
    const nav = read('apps/web/src/components/Navigation.tsx');
    const gate = read('apps/web/src/lib/module-gate.ts');
    const footer = read('apps/web/src/components/Footer.tsx');
    expect(nav, 'Navigation declares its own defaults again').not.toMatch(/def:\s*(true|false)/);
    expect(gate, 'the module gate declares its own defaults again').not.toMatch(/const DEFAULTS/);
    // The footer was the fourth copy, and the one that kept a Practice Exams link on a site that
    // had switched practice exams off.
    expect(footer, 'the footer declares its own defaults again').not.toMatch(/flag\('show_\w+',\s*(true|false)\)/);
  });

  it('covers every module the App can switch', () => {
    const missing = MODULES.map((m) => flagOf(m).replace(/^show_/, ''))
      .filter((f) => !(f in MODULE_DEFAULTS));
    expect(missing, `no default for: ${missing.join(', ')}`).toEqual([]);
  });

  it('starts a new site as a freelancer site, not as this one', () => {
    // The decision, written down so changing it is deliberate. A new site is a marketing site;
    // practice exams, canvas tools, games and a knowledge base are this practice's.
    const on = Object.entries(MODULE_DEFAULTS).filter(([, v]) => v).map(([k]) => k).sort();
    expect(on).toEqual(['about', 'blog', 'coaching', 'contact', 'events', 'testimonials']);
  });

  it('prefers what a site has saved over the default', () => {
    expect(moduleIsOn('exams', { show_exams: true })).toBe(true);
    expect(moduleIsOn('events', { show_events: false })).toBe(false);
    expect(moduleIsOn('events', {})).toBe(true);
    expect(moduleIsOn('events', null)).toBe(true);
    expect(moduleIsOn('nonsense', {})).toBe(false);
  });
});
