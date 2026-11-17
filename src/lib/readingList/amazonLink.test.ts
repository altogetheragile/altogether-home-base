import { describe, it, expect } from 'vitest';
import { amazonLink, amazonLinkKind, extractAsin, AMAZON_LINK_ATTRS } from '@altogether/ui/amazon';

const TAG = 'altogethera09-21';
const book = { title: 'Scrum Mastery', author: 'Geoff Watts' };

describe('an Amazon link', () => {
  it('uses the override URL first, with the tag added', () => {
    const href = amazonLink({ ...book, asin: 'B00ESDUYKA', amazon_url: 'https://www.amazon.co.uk/Scrum-Mastery/dp/0957587402' }, TAG);
    expect(href).toBe(`https://www.amazon.co.uk/Scrum-Mastery/dp/0957587402?tag=${TAG}`);
  });

  it('replaces a tag the override URL came with, rather than adding a second', () => {
    const href = amazonLink({ ...book, amazon_url: 'https://www.amazon.co.uk/dp/0957587402?ref=x&tag=someoneelse-21' }, TAG);
    const u = new URL(href);
    expect(u.searchParams.getAll('tag')).toEqual([TAG]);
    expect(u.searchParams.get('ref')).toBe('x');
  });

  it('uses the ASIN when there is no override', () => {
    expect(amazonLink({ ...book, asin: 'b00esduyka' }, TAG)).toBe(`https://www.amazon.co.uk/dp/B00ESDUYKA?tag=${TAG}`);
  });

  it('falls back to a search for the title and author, encoded', () => {
    const href = amazonLink({ title: 'Scrum: A Pocket Guide', author: 'Gunther Verheyen & Co' }, TAG);
    expect(href).toBe(`https://www.amazon.co.uk/s?k=Scrum%3A%20A%20Pocket%20Guide%20Gunther%20Verheyen%20%26%20Co&tag=${TAG}`);
    expect(new URL(href).searchParams.get('k')).toBe('Scrum: A Pocket Guide Gunther Verheyen & Co');
  });

  it('says which of the three a book uses, so Admin can flag the searches', () => {
    expect(amazonLinkKind({ ...book, amazon_url: 'https://www.amazon.co.uk/dp/0957587402' })).toBe('override');
    expect(amazonLinkKind({ ...book, asin: 'B00ESDUYKA' })).toBe('asin');
    expect(amazonLinkKind({ ...book, asin: '  ', amazon_url: '' })).toBe('search');
  });

  it('builds an untagged link rather than an empty tag when no tag is set', () => {
    expect(amazonLink({ ...book, asin: 'B00ESDUYKA' }, '')).toBe('https://www.amazon.co.uk/dp/B00ESDUYKA');
    expect(amazonLink(book, null)).not.toMatch(/tag=/);
    expect(new URL(amazonLink({ ...book, amazon_url: 'https://www.amazon.co.uk/dp/X?tag=old-21' }, '')).searchParams.has('tag')).toBe(false);
  });

  it('falls through to the ASIN when the override is not a URL at all', () => {
    expect(amazonLink({ ...book, asin: 'B00ESDUYKA', amazon_url: 'not a url' }, TAG)).toBe(`https://www.amazon.co.uk/dp/B00ESDUYKA?tag=${TAG}`);
  });

  it('is marked as paid and opens in a new tab', () => {
    expect(AMAZON_LINK_ATTRS).toEqual({ target: '_blank', rel: 'sponsored noopener' });
  });
});

describe('an ASIN pasted into the ASIN box', () => {
  it.each([
    ['B00ESDUYKA', 'B00ESDUYKA'],
    ['  b00esduyka ', 'B00ESDUYKA'],
    ['https://www.amazon.co.uk/Scrum-Mastery-Good-Great-Servant-Leadership/dp/0957587402/ref=sr_1_1?keywords=scrum', '0957587402'],
    ['https://www.amazon.co.uk/gp/product/B00ESDUYKA?psc=1', 'B00ESDUYKA'],
    ['https://amazon.com/dp/080442171X', '080442171X'],
    ['https://www.amazon.co.uk/exec/obidos/ASIN/B00ESDUYKA/', 'B00ESDUYKA'],
  ])('reads %s', (input, asin) => {
    expect(extractAsin(input)).toBe(asin);
  });

  it('says there is none rather than guessing', () => {
    expect(extractAsin('https://www.amazon.co.uk/s?k=scrum')).toBeNull();
    expect(extractAsin('Scrum Mastery')).toBeNull();
    expect(extractAsin('')).toBeNull();
  });
});
