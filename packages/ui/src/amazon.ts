// ============= A link to a book on Amazon, with this site's Associates tag =============
//
// Shared because two apps build the same link: the Site's reading list page, and Admin's "Test
// link" button. Written twice, they would drift, and a drifted link is either one that earns
// nothing or one that names the wrong book.
//
// Three cases, in order:
//   1. an override URL the admin pasted, with the tag set on it (replacing any tag it came with);
//   2. the product page for an ASIN;
//   3. a search for the title and author, which always finds something and is the fallback until
//      somebody adds the ASIN.

export const AMAZON_HOST = 'https://www.amazon.co.uk';

/** The words an Amazon Associate has to show. Fixed wording, not copy: it is a condition of the
 *  programme, and an editable box is a way to edit it out by accident. */
export const AMAZON_DISCLOSURE = 'As an Amazon Associate I earn from qualifying purchases.';

/** What every outbound Amazon link carries. `sponsored` is how Google is told it is paid. */
export const AMAZON_LINK_ATTRS = { target: '_blank', rel: 'sponsored noopener' } as const;

export interface AmazonBook {
  title: string;
  author?: string | null;
  asin?: string | null;
  amazon_url?: string | null;
}

export type AmazonLinkKind = 'override' | 'asin' | 'search';

const clean = (s?: string | null) => (s ?? '').trim();

/** Which of the three a book will use. Admin flags 'search' so the ASINs can be filled in. */
export function amazonLinkKind(book: AmazonBook): AmazonLinkKind {
  if (clean(book.amazon_url)) return 'override';
  if (clean(book.asin)) return 'asin';
  return 'search';
}

/** Sets the tag on a URL, replacing one already there. Without a tag the URL is left as it is
 *  rather than given an empty `tag=`. */
function withTag(url: string, tag: string): string {
  const u = new URL(url);
  if (tag) u.searchParams.set('tag', tag);
  else u.searchParams.delete('tag');
  return u.toString();
}

/** The link for a book. `tag` is the site's Associates tag; empty builds an untagged link. */
export function amazonLink(book: AmazonBook, tag?: string | null): string {
  const t = clean(tag);
  const override = clean(book.amazon_url);
  if (override) {
    try {
      return withTag(override, t);
    } catch {
      // Not a URL after all. Fall through to the ASIN or the search rather than link to nothing.
    }
  }
  const asin = clean(book.asin).toUpperCase();
  if (asin) return `${AMAZON_HOST}/dp/${encodeURIComponent(asin)}${t ? `?tag=${encodeURIComponent(t)}` : ''}`;
  const words = [clean(book.title), clean(book.author)].filter(Boolean).join(' ');
  return `${AMAZON_HOST}/s?k=${encodeURIComponent(words)}${t ? `&tag=${encodeURIComponent(t)}` : ''}`;
}

/** An ASIN, from either an ASIN or a whole Amazon URL pasted into the ASIN box. Null when there is
 *  none to be found, so the form can say so rather than save something that is not one.
 *
 *  Amazon puts it in several places: /dp/X, /gp/product/X, /product/X, /exec/obidos/ASIN/X. A
 *  Kindle edition's ASIN starts B0; a printed book's is its ISBN-10, which can end in X. */
export function extractAsin(input: string): string | null {
  const s = clean(input);
  if (!s) return null;
  if (/^[A-Za-z0-9]{10}$/.test(s)) return s.toUpperCase();
  const m = s.match(/\/(?:dp|gp\/product|product|ASIN|gp\/aw\/d)\/([A-Za-z0-9]{10})(?:[/?#]|$)/i);
  return m ? m[1].toUpperCase() : null;
}
