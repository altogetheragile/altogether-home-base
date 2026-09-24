import { describe, it, expect } from 'vitest';
import { REGISTRIES } from './index';

// A shipped value of "" means: this site says nothing here until somebody writes it.
//
// That is deliberate for the narrative, and it is load-bearing in the other direction too. An
// existing site renders the shipped value wherever it has no saved row, so blanking a key that a
// live site was relying on silently removes that content the next time it deploys. The cost is
// paid once, by adding the row, and this list is the record of which keys that applies to.

const BLANK_BY_DESIGN = [
  // Somebody's life story. A second site must not start with this one's.
  'about.hero.intro',
  'about.story.p1',
  'about.story.p2',
  'about.story.p3',
  'about.story.p4',
  'about.mission.p2',
  'about.timeline.list',
  'coaching.hero.intro',
  'coaching.approach.p3',
  'coaching.service.1.detail',
  'coaching.service.2.detail',
  'coaching.why.6.desc',
  'home.founder.body',
  'home.founder.quote',
  // Somebody's qualifications. Worse than prose: these are checkable claims about a named person.
  'about.credentials.list',
  'about.badges.list',
  'home.founder.credentials',
  'home.founder.years',
  // Counted claims. A figure with nothing behind it is not placeholder text, it is an assertion:
  // a new site has trained nobody and has no average rating.
  'about.hero.tags',
  'home.hero.eyebrow',
  // Was eight numbered keys, fixed at four statistics. One list now, which a site can add to.
  'home.stats.items',
  'events.stats.trained.number',
  'coaching.why.3.label',
  'coaching.why.3.desc',
  // Lists rather than a fixed number of numbered keys. Empty means the section is not there,
  // which is the right thing for a site that has not said who it is for yet.
  'home.personas.items',
  'about.philosophy.items',
  // The wave pattern is drawn in this site's colours. A second site gets a plain hero until it
  // chooses its own picture.
  'home.hero.background',
];

/** Claims a site has to earn before it makes them. Checked against everything that DOES ship. */
const UNEARNED = /\d[\d,]*\s*\+|★|\bco-author\b|\b\d+\s*years?\b|contributed to the frameworks/i;

describe('a new site starts empty', () => {
  // Settings-backed fields have no shipped value at all: what they show comes from
  // site_settings, and the registry only describes the box the editor draws.
  const shipped = new Map(
    REGISTRIES.flatMap((r) =>
      Object.entries(r.entries)
        .filter(([, e]) => !e.store || e.store === 'copy')
        .map(([k, e]) => [k, e.value] as const),
    ),
  );

  it('ships nothing personal', () => {
    const wrong = BLANK_BY_DESIGN.filter((k) => (shipped.get(k) ?? '').trim() !== '');
    expect(wrong, `these are meant to ship empty: ${wrong.join(', ')}`).toEqual([]);
  });

  it('has no blank key outside that list', () => {
    // Adding one is a decision with a consequence for every live site, so it is made here.
    const surprises = [...shipped].filter(([k, v]) => !v.trim() && !BLANK_BY_DESIGN.includes(k)).map(([k]) => k);
    expect(surprises, `blank but not listed: ${surprises.join(', ')}`).toEqual([]);
  });

  it('names nobody in what it does ship', () => {
    const named = [...shipped].filter(([, v]) => /\bAlun\b|Altogether Agile|Westminster|Boehringer|UMIST/.test(v));
    expect(named.map(([k]) => k), 'a new site would introduce itself as somebody else').toEqual([]);
  });

  it('claims nothing it has not earned', () => {
    // The first pass at this caught names and missed numbers, so a brand new site still said it
    // had trained 1,500 people and held a 4.9 rating. Those are not placeholders.
    const boasting = [...shipped].filter(([k, v]) => v.trim() && UNEARNED.test(v) && !k.startsWith('exams.'));
    expect(boasting.map(([k]) => `${k}: ${shipped.get(k)}`), 'a new site would be claiming this on day one').toEqual([]);
  });

  it('still tells the editor what to write in each blank', () => {
    // A blank field with no hint is just a box. The hint is the only thing asking for the words.
    const unhelpful = BLANK_BY_DESIGN.filter((k) => {
      const entry = REGISTRIES.flatMap((r) => Object.entries(r.entries)).find(([key]) => key === k)?.[1];
      return !entry || entry.hint.trim().length < 10;
    });
    expect(unhelpful, `blank with no prompt: ${unhelpful.join(', ')}`).toEqual([]);
  });
});
