// ============= What an Amazon link says about a book, without asking Amazon =============
//
// Pure: no Deno, no network. The edge function does the fetching; this decides what to fetch and
// what to believe. Kept free of imports so the App's test runner can test it as it stands.
//
// Amazon's pages are never read. A link carries two things worth having on its own:
//   - the ASIN, which for a printed book is its ISBN-10 and can be looked up exactly;
//   - usually the title, as words in the path: /Scrum-Mastery-Good-Great-Servant-Leadership/dp/...

export interface AmazonLinkParts {
  asin: string | null;
  /** The title words from the path, lower case, or '' when the link has none. */
  slug: string;
}

const AMAZON_HOST = /(^|\.)amazon\.[a-z.]+$/i;
/** Amazon's own short links. Only their redirect is read, never a page. */
export const SHORT_HOSTS = /^(amzn\.to|a\.co|amzn\.eu|amzn\.asia)$/i;

/** Lower case, accents and punctuation off, "&" as "and", runs of space squeezed. */
export const norm = (s: string): string => (s ?? '')
  .normalize('NFKD').replace(/[\u0300-\u036F]/g, '')
  .toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim();

export function parseAmazonUrl(input: string): AmazonLinkParts | null {
  let u: URL;
  try {
    u = new URL(input.trim());
  } catch {
    return null;
  }
  if (!AMAZON_HOST.test(u.hostname)) return null;
  const path = decodeURIComponent(u.pathname);
  const asin = path.match(/\/(?:dp|gp\/product|product|ASIN|gp\/aw\/d)\/([A-Za-z0-9]{10})(?:[/?#]|$)/i)?.[1]?.toUpperCase() ?? null;
  // The segment before /dp/ is the title, when Amazon put one there. "/dp/X" alone has none.
  const before = path.split(/\/(?:dp|gp\/product|product)\//i)[0].split('/').filter(Boolean).pop() ?? '';
  const raw = /^(dp|gp|s|stores|-)$/i.test(before) ? '' : norm(before.replace(/[-_+]/g, ' '));
  return { asin, slug: stripFormat(raw) };
}

/** Amazon adds the format to the title words: "...-Technology-ebook", "...-Kindle-Edition". They are
 *  not part of the title, and a search that includes them finds nothing. */
const FORMAT_WORDS = new Set(['ebook', 'kindle', 'edition', 'paperback', 'hardcover', 'hardback', 'audiobook', 'audible', 'audio', 'cd']);
export function stripFormat(slug: string): string {
  const words = slug.split(' ').filter(Boolean);
  while (words.length && FORMAT_WORDS.has(words[words.length - 1])) words.pop();
  return words.join(' ');
}

/** The searches to try for a link's title words, most specific first: all of them, then fewer.
 *  Title and subtitle run together often find nothing where the title alone finds the book. */
export function titleQueries(slug: string): string[] {
  const words = slug.split(' ').filter(Boolean);
  const tries = [words.length, 5, 3, 2].filter((n, i, all) => n <= words.length && n >= 2 && all.indexOf(n) === i);
  return tries.map((n) => words.slice(0, n).join(' '));
}

/** An ISBN-10 with a valid check digit. A Kindle ASIN (B0...) is not one. */
export function isIsbn10(asin: string | null): asin is string {
  if (!asin || !/^\d{9}[\dX]$/.test(asin)) return false;
  const sum = asin.split('').reduce((n, ch, i) => n + (ch === 'X' ? 10 : Number(ch)) * (10 - i), 0);
  return sum % 11 === 0;
}

export interface OpenLibraryDoc { title?: string; author_name?: string[]; cover_i?: number }

/** From a search on the link's title words, the record whose title the link starts with.
 *
 *  The link's words are usually title and subtitle run together; a record's title is often just
 *  the title. So a record counts when the link begins with all of its title, the longest such
 *  title wins, and ties go to one with a cover. A title of a single short word is not enough to
 *  go on: "Scrum" would match half the shelf. */
export function pickByTitle(slug: string, docs: OpenLibraryDoc[]): OpenLibraryDoc | null {
  const ok = docs.filter((d) => {
    const t = norm(d.title ?? '');
    return t.length >= 6 && t.includes(' ') && (slug === t || slug.startsWith(`${t} `));
  });
  ok.sort((a, b) => norm(b.title ?? '').length - norm(a.title ?? '').length || Number(!!b.cover_i) - Number(!!a.cover_i));
  return ok[0] ?? null;
}

/** "Title Case" for a title read from a link, used only when no record was found. Small words
 *  stay lower case except at the start. */
const SMALL = /^(a|an|and|at|by|for|in|of|on|or|the|to|with)$/;
export const titleFromSlug = (slug: string): string =>
  slug.split(' ').filter(Boolean)
    .map((w, i) => (i > 0 && SMALL.test(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ');
