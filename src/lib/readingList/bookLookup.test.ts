import { describe, it, expect } from 'vitest';
import { parseAmazonUrl, isIsbn10, pickByTitle, titleFromSlug, titleToSearch, lookupNote } from '../../../supabase/functions/_shared/bookLookup';

// What the "fill in from an Amazon link" lookup takes from a link, and what it will believe. It
// never reads Amazon: the link itself carries the ASIN and, usually, the title.

describe('reading an Amazon link', () => {
  it('takes the ASIN and the title words from a product link', () => {
    expect(parseAmazonUrl('https://www.amazon.co.uk/Scrum-Mastery-Good-Great-Servant-Leadership/dp/0957587402/ref=sr_1_1?keywords=scrum'))
      .toEqual({ asin: '0957587402', slug: 'scrum mastery good great servant leadership' });
  });

  it('takes the ASIN from a link with no title in it', () => {
    expect(parseAmazonUrl('https://www.amazon.co.uk/dp/B00ESDUYKA')).toEqual({ asin: 'B00ESDUYKA', slug: '' });
    expect(parseAmazonUrl('https://amazon.com/gp/product/0957587402?psc=1')).toEqual({ asin: '0957587402', slug: '' });
  });

  it('reads any Amazon country', () => {
    expect(parseAmazonUrl('https://www.amazon.de/Team-Topologies/dp/1942788819')?.asin).toBe('1942788819');
  });

  it('refuses a link that is not Amazon, or not a link', () => {
    expect(parseAmazonUrl('https://www.notamazon.co.uk/dp/0957587402')).toBeNull();
    expect(parseAmazonUrl('https://openlibrary.org/books/OL1M')).toBeNull();
    expect(parseAmazonUrl('Scrum Mastery')).toBeNull();
  });
});

describe('telling a printed book from a Kindle one', () => {
  it('knows an ISBN-10 by its check digit', () => {
    // Scrum Mastery's real ISBN-10, and a valid one ending in X.
    expect(isIsbn10('0957587406')).toBe(true);
    expect(isIsbn10('043942089X')).toBe(true);
    // One digit wrong.
    expect(isIsbn10('0957587402')).toBe(false);
  });

  it('does not take a Kindle ASIN for an ISBN', () => {
    expect(isIsbn10('B00ESDUYKA')).toBe(false);
    expect(isIsbn10(null)).toBe(false);
  });
});

describe('believing a search on the title words', () => {
  const slug = 'scrum mastery from good to great servant leadership';

  it('takes the record whose whole title the link begins with, the longest first', () => {
    const pick = pickByTitle(slug, [
      { title: 'Scrum', author_name: ['Jeff Sutherland'], cover_i: 1 },
      { title: 'Scrum Mastery', author_name: ['Geoff Watts'], cover_i: 2 },
      { title: 'Scrum Mastery Quote Cards', author_name: ['Geoff Watts'], cover_i: 3 },
    ]);
    expect(pick?.cover_i).toBe(2);
  });

  it('will not go on one short word', () => {
    expect(pickByTitle('scrum a pocket guide', [{ title: 'Scrum', cover_i: 1 }])).toBeNull();
  });

  it('refuses a record the link does not begin with', () => {
    expect(pickByTitle(slug, [{ title: 'Mastering Professional Scrum', cover_i: 1 }])).toBeNull();
  });

  it('prefers one with a cover when two titles are the same', () => {
    const pick = pickByTitle(slug, [{ title: 'Scrum Mastery' }, { title: 'Scrum mastery', cover_i: 9 }]);
    expect(pick?.cover_i).toBe(9);
  });
});

describe('a title made from the link when nothing is found', () => {
  it('is in Title Case with small words left small', () => {
    expect(titleFromSlug('the art of facilitation and the answer')).toBe('The Art of Facilitation and the Answer');
  });
});

// A Kindle link is often just /dp/B0..., with no title in it and no ISBN. The admin can then type
// the title and press Fill in again: that title is searched for instead.
describe('a link with no title in it', () => {
  const link = 'https://www.amazon.co.uk/dp/B0D46Q2G22/ref=tmm_kin_swatch_0?_encoding=UTF8&twDim=1&th=1';

  it('has nothing to search for until a title is typed, and says so', () => {
    const parts = parseAmazonUrl(link)!;
    expect(parts).toEqual({ asin: 'B0D46Q2G22', slug: '' });
    expect(isIsbn10(parts.asin)).toBe(false);
    expect(titleToSearch(parts.slug, '')).toEqual({ words: '', typed: false });
    expect(lookupNote(null, parts.slug, false)).toMatch(/no title in it.*Type the title and press Fill in again/);
  });

  it('searches for the typed title, and finds the book whose title it is', () => {
    const wanted = titleToSearch('', 'Evolvability in Business: Enterprise Transformation in an Age of Complexity');
    expect(wanted.typed).toBe(true);
    const docs = [
      { title: 'Data-Centric Business and Applications', author_name: ['Natalia Kryvinska'] },
      { title: 'Evolvability in Business', author_name: ['Zhen Goh', 'Sunil Mundra'] },
    ];
    expect(pickByTitle(wanted.words, docs)?.author_name).toEqual(['Zhen Goh', 'Sunil Mundra']);
    expect(lookupNote('title', '', true)).toBe('Found by the title you typed. Check it is the right book.');
  });

  it('prefers the title in the link over one typed', () => {
    expect(titleToSearch('team topologies', 'Something Else')).toEqual({ words: 'team topologies', typed: false });
  });

  it('says plainly when the typed title is not found', () => {
    expect(lookupNote(null, '', true)).toBe('Open Library has no book with that title. Fill in the author yourself.');
  });
});
