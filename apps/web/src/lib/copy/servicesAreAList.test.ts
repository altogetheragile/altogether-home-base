import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { REGISTRIES, items } from './index';

// The coaching page used to hold exactly two services and exactly six credentials, in code, with
// every word keyed by position: `coaching.service.2.tagline` was the tagline of whichever service
// happened to be second. Adding a third was a code change, and so was removing one.
//
// These are the properties that stop it going back.

const coaching = REGISTRIES.find((r) => r.page === 'coaching')!;
const page = readFileSync('src/app/coaching/page.tsx', 'utf8');

describe('the coaching page', () => {
  it('has no key named after a position', () => {
    // The whole point. A key with a number in it is a fixed-size section wearing a disguise.
    const numbered = Object.keys(coaching.entries).filter((k) => /\.\d+\./.test(k));
    expect(numbered, `still keyed by position: ${numbered.join(', ')}`).toEqual([]);
  });

  it('reads its services and credentials as lists', () => {
    expect(coaching.entries['coaching.services']?.type).toBe('items');
    expect(coaching.entries['coaching.why.items']?.type).toBe('items');
  });

  it('does not count the services in code', () => {
    // `Array.from({ length: 6 })` is how the credentials were fixed at six, and a literal list of
    // styles is how the services were fixed at two.
    expect(page, 'a fixed length is a fixed number of items').not.toMatch(/length:\s*\d+\s*\}/);
  });

  it('gives a service every box the page draws for it', () => {
    // A field the page reads and the editor does not offer is a field nobody can fill in.
    const declared = new Set((coaching.entries['coaching.services'].fields ?? []).map((f) => f.key));
    for (const read of ['title', 'label', 'tagline', 'description', 'detail', 'includes', 'price', 'packageNote', 'cta', 'icon', 'colour', 'image']) {
      expect(declared.has(read), `the page renders service.${read} but the editor has no box for it`).toBe(true);
    }
  });

  it('needs only a name to render a service', () => {
    // Everything else is optional, and a service missing a picture or a price has to come out as
    // a shorter block rather than a broken one. Proved on the page by a third service with almost
    // nothing filled in; kept honest here.
    const fields = coaching.entries['coaching.services'].fields ?? [];
    const required = fields.filter((f) => f.required).map((f) => f.key);
    expect(required).toEqual(['title']);
  });

  it('appends no word of its own to a service label', () => {
    // The badge used to be rendered as `{label} Coaching`, which assumed every service on every
    // site is coaching. A site offering therapy or bookkeeping got "BOOKKEEPING COACHING".
    expect(page).not.toMatch(/\{service\.label\}\s+\w/);
  });
});

describe('a service list with gaps in it', () => {
  const parse = (json: string) => items<Record<string, string>>(json, ['title']);

  it('drops a service with no name rather than rendering a nameless block', () => {
    expect(parse('[{"title":"Real"},{"tagline":"orphan"}]')).toHaveLength(1);
  });

  it('survives a value somebody hand-edited into a mess', () => {
    // The page renders nothing rather than throwing: a broken list should cost the section, not
    // the site. The raw text is still in the editor to be repaired.
    expect(parse('[{"title": "unclosed')).toEqual([]);
    expect(parse('')).toEqual([]);
  });
});
