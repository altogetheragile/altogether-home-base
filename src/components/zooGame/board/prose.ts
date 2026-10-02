import DOMPurify from 'dompurify';

// The reference pages are written in a little HTML - paragraphs, lists, and links from one page to
// another - and that HTML is EDITABLE from the live page by anybody with the copy editor open.
//
// So it is sanitised on the way out, every time, against a list of what these pages are allowed to
// contain rather than a list of what is known to be dangerous. A trainer polishing a sentence at
// 9pm cannot accidentally paste a script tag in; nor can anybody else who gets at `zoo_copy`.
//
// Narrower than the site's rich-text editor on purpose: that one carries styled marketing pages and
// has to allow `style` and `class`. These are plain prose with cross-links, and nothing here has
// any business carrying a style attribute.
//
// The list is the tags the shipped pages actually use, counted rather than guessed: the first
// version of it left out `table`, and the test below caught the Inspect and Adapt matrix losing its
// headings on the way to the screen.
const ALLOWED_TAGS = ['p', 'ul', 'ol', 'li', 'strong', 'em', 'b', 'i', 'a', 'br', 'code',
  'blockquote', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'div'];

/** One section's body, safe to put on the page. */
export const asProse = (html: string): string => DOMPurify.sanitize(html ?? '', {
  ALLOWED_TAGS,
  ALLOWED_ATTR: ['href'],
  // A link out of a reference page goes to another reference page. Everything else - mailto, data,
  // javascript, somebody else's site - is not what these are for.
  ALLOWED_URI_REGEXP: /^#[a-z0-9-]+$/i,
});
