import { describe, it, expect } from 'vitest';
import { REGISTRIES } from './index';
import { starterFields, acceptStarter, type StarterField } from './starter';
import type { CopyRegistry } from './fields';

// Starter wording is written for a business from its owner's description, and saved as drafts.
// These are the rules that keep it a starter: it fills gaps and never overwrites, it never writes
// a claim, and what comes back is checked before it is kept.

const page: CopyRegistry = {
  page: 'demo',
  label: 'Demo',
  entries: {
    'demo.hero.heading': { value: 'Coaching that asks\nthe right questions.', label: 'Hero heading', hint: 'The top' },
    'demo.hero.intro': { value: '', label: 'Hero introduction', hint: 'Two or three sentences' },
    'demo.hero.tags': { value: '', label: 'Tags', hint: 'One per line', type: 'lines' },
    'demo.why.items': { value: '', label: 'Credentials', hint: 'Claims', type: 'items', claim: true, fields: [{ key: 'label', label: 'Credential' }] },
    'demo.hero.background': { value: '', label: 'Background', hint: 'Picture', type: 'image' },
    'demo.visible': { value: '', label: 'Show it', hint: '', type: 'switch', store: 'column', path: 'show_demo' },
    'demo.footer.href': { value: '', label: 'Where it goes', hint: 'An address' },
    'demo.services': {
      value: '', label: 'Services', hint: 'One per service', type: 'items',
      fields: [
        { key: 'title', label: 'Name', required: true },
        { key: 'description', label: 'Opening paragraph', type: 'textarea' },
        { key: 'image', label: 'Picture', type: 'image' },
        { key: 'icon', label: 'Icon', type: 'icon' },
      ],
    },
    'demo.gallery': {
      value: '', label: 'Gallery', hint: 'Pictures', type: 'items',
      fields: [{ key: 'caption', label: 'Caption' }, { key: 'image', label: 'Picture', type: 'image', required: true }],
    },
  },
};

const keys = (fields: StarterField[]) => fields.map((f) => f.key);

describe('a starter is only ever a draft', () => {
  it('writes for the boxes with words in them, and nothing else', () => {
    expect(keys(starterFields(page, new Set(), new Set()))).toEqual([
      'demo.hero.heading', 'demo.hero.intro', 'demo.hero.tags', 'demo.services',
    ]);
  });

  it('never writes a claim, a picture, a switch or an address', () => {
    const offered = keys(starterFields(page, new Set(), new Set()));
    for (const k of ['demo.why.items', 'demo.hero.background', 'demo.visible', 'demo.footer.href']) {
      expect(offered).not.toContain(k);
    }
  });

  it('leaves alone anything the site has written or drafted itself', () => {
    const offered = keys(starterFields(page, new Set(['demo.hero.heading']), new Set(['demo.hero.intro'])));
    expect(offered).not.toContain('demo.hero.heading');
    expect(offered).not.toContain('demo.hero.intro');
  });

  it('offers a row only the boxes that are words, and no list whose rows need a picture', () => {
    const services = starterFields(page, new Set(), new Set()).find((f) => f.key === 'demo.services');
    expect(services?.fields?.map((f) => f.key)).toEqual(['title', 'description']);
    expect(keys(starterFields(page, new Set(), new Set()))).not.toContain('demo.gallery');
  });

  it('asks for about as many words as the shipped wording has', () => {
    const heading = starterFields(page, new Set(), new Set()).find((f) => f.key === 'demo.hero.heading');
    expect(heading?.words).toBe(6);
  });

  it('marks every counted or personal claim the new site leaves empty', () => {
    // The same keys a new site ships empty because they are claims. A starter must not fill them
    // either, and the way it knows is the flag.
    const mustBeClaims = [
      'about.credentials.list', 'about.badges.list', 'about.timeline.list', 'about.story.p1',
      'home.founder.years', 'home.founder.credentials', 'home.founder.quote', 'home.stats.items',
      'coaching.why.items', 'events.stats.trained.number', 'events.card.groupSize', 'exams.faq.items',
    ];
    const entries = Object.fromEntries(REGISTRIES.flatMap((r) => Object.entries(r.entries)));
    expect(mustBeClaims.filter((k) => !entries[k]?.claim)).toEqual([]);
  });
});

describe('what comes back is checked before it is kept', () => {
  const text: StarterField = { key: 'k', label: 'Heading', hint: '', kind: 'text', words: 6 };
  const lines: StarterField = { key: 'k', label: 'Tags', hint: '', kind: 'lines', words: 6 };
  const rows: StarterField = {
    key: 'k', label: 'Services', hint: '', kind: 'items', words: 40,
    fields: [{ key: 'title', label: 'Name', required: true }, { key: 'description', label: 'About', required: false }],
  };

  it('keeps plain wording, without long dashes', () => {
    expect(acceptStarter(text, 'Research that hears — and keeps — the real story')).toBe('Research that hears, and keeps, the real story');
  });

  it('refuses a claim rather than repairing it', () => {
    expect(acceptStarter(text, 'Over 15 years of experience')).toBeNull();
    expect(acceptStarter(text, 'Trusted by 200+ brands')).toBeNull();
    expect(acceptStarter(rows, [{ title: 'Focus groups', description: 'Run for 20 years' }])).toBeNull();
  });

  it('refuses the wrong shape and anything empty', () => {
    expect(acceptStarter(text, { not: 'a string' })).toBeNull();
    expect(acceptStarter(text, '   ')).toBeNull();
    expect(acceptStarter(rows, 'a sentence')).toBeNull();
  });

  it('takes lines as a list or as text', () => {
    expect(acceptStarter(lines, ['Focus groups', ' In-depth interviews ', ''])).toBe('Focus groups\nIn-depth interviews');
    expect(acceptStarter(lines, 'Focus groups\nInterviews')).toBe('Focus groups\nInterviews');
  });

  it('keeps only the row boxes it asked for, and drops rows missing a required one', () => {
    const value = acceptStarter(rows, [
      { title: 'Focus groups', description: 'Small groups, one conversation.', price: 'Free', image: 'x.png' },
      { description: 'No name, so it would never appear' },
    ]);
    expect(JSON.parse(value!)).toEqual([{ title: 'Focus groups', description: 'Small groups, one conversation.' }]);
  });
});
