import { describe, it, expect } from 'vitest';
import { REGISTRIES } from './index';
import type { CopyEntry } from './fields';

// A live site lost its entire Resources menu because of how this drawer was ordered and labelled.
// Somebody set out to hide one page, and the only switch visible without scrolling was the one
// that hides the whole group. It was flipped, five pages left the menu at once, and the page that
// was meant to go stayed on. Nothing failed and nothing said why.
//
// So the drawer has to be readable on its own terms: a switch says which page it hides, and the
// one that hides a group is not the first thing you meet.

const nav = REGISTRIES.find((r) => r.page === 'navigation')!;
const keys = Object.keys(nav.entries);
const switches = Object.entries(nav.entries).filter(([, e]) => (e as CopyEntry).type === 'switch');

describe('a switch says what it hides', () => {
  it('has switches to hide each page inside the Resources menu', () => {
    // The complaint that started this: "there is an option to turn off the resources menu but not
    // the AI Tools or Flow Game pages". They existed, fourteen fields down, called "Show it".
    for (const page of ['knowledge', 'blog', 'exams', 'ai_tools', 'flow_game']) {
      expect(keys, `nothing hides ${page}`).toContain(`nav.${page}.visible`);
    }
  });

  it('never labels a switch in a way that could mean any of them', () => {
    // Five switches called "Show it", spread ten fields apart, tell somebody scanning the drawer
    // nothing about which page each one belongs to.
    for (const [key, e] of switches) {
      const label = (e as CopyEntry).label;
      expect(label.trim().toLowerCase(), `${key} is labelled "${label}"`).not.toBe('show it');
      expect(label.trim().split(/\s+/).length, `${key} is labelled "${label}"`).toBeGreaterThan(2);
    }
  });

  it('does not put the switch that hides five pages first', () => {
    // First in the list is where somebody looking for one page stops looking.
    expect(keys[0]).not.toBe('nav.resources.visible');
  });

  it('keeps the group switch with the group, not among the top-level links', () => {
    // Directly after the menu's own label, so what it governs is obvious from where it sits.
    expect(keys.indexOf('nav.resources.visible')).toBe(keys.indexOf('nav.resources') + 1);
    for (const page of ['knowledge', 'blog', 'exams', 'ai_tools', 'flow_game']) {
      expect(keys.indexOf(`nav.${page}.visible`)).toBeGreaterThan(keys.indexOf('nav.resources.visible'));
    }
  });

  it('says in the group switch what turning it off actually costs', () => {
    const hint = (nav.entries['nav.resources.visible'] as CopyEntry).hint;
    expect(hint).toMatch(/not one page|all five|everything/i);
    // And where to go instead, since wanting to hide one page is why somebody is reading it.
    expect(hint).toMatch(/single page|one page/i);
  });

  it('puts each item switch directly under the label it belongs to', () => {
    for (const page of ['knowledge', 'blog', 'exams', 'ai_tools', 'flow_game']) {
      expect(keys.indexOf(`nav.${page}.visible`), `nav.${page}.visible has drifted from its label`)
        .toBe(keys.indexOf(`nav.${page}`) + 1);
    }
  });
});
