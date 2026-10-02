import { createElement, Fragment, type ReactNode } from 'react';
import Link from 'next/link';

// The reference prose, turned into elements rather than injected as HTML.
//
// The App sanitises this with DOMPurify and renders it through dangerouslySetInnerHTML, which is
// the right trade there: it is behind the game, read by a learner who went looking for it, and
// DOMPurify is already a dependency.
//
// This is the public page. The content is the same - 28 pages of Guide-derived text whose words
// are editable from the live game, with overrides in `zoo_copy` - but the audience is everybody,
// and the Site has no sanitiser of its own. Rather than add one, nothing is injected at all: the
// markup is parsed into React elements against a list of what these pages may contain, and
// anything else becomes its own text. React escapes the rest.
//
// `zoo_copy` is admin-write-only under RLS, so this is a second line rather than the only one -
// the same position `lib/markdown.ts` takes about the exam guide, and says it takes.

/** What a reference page is allowed to be made of. Counted off the shipped pages, not guessed. */
const ALLOWED = new Set(['p', 'ul', 'ol', 'li', 'strong', 'em', 'b', 'i', 'br', 'code',
  'blockquote', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'div', 'a']);

/** A cross-link is a link to another page of this board and nothing else: no mailto, no data:, no
 *  somebody else's site. On the Site these are real URLs rather than the design file's hashes, so
 *  all 28 are pages Google can find. */
const HREF = /^#([a-z0-9-]+)$/i;

interface Node { tag: string; attrs: Record<string, string>; kids: (Node | string)[] }

const VOID = new Set(['br']);

/** The little parser. Deliberately small: it understands tags, attributes and text, and treats
 *  anything it does not understand as text to be shown. */
function parse(html: string): (Node | string)[] {
  const root: Node = { tag: '#root', attrs: {}, kids: [] };
  const stack = [root];
  const re = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:\s+[a-zA-Z-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*\/?>/g;
  let at = 0;
  for (let m = re.exec(html); m; m = re.exec(html)) {
    if (m.index > at) stack[stack.length - 1].kids.push(html.slice(at, m.index));
    at = m.index + m[0].length;
    const [, closing, rawTag, rawAttrs] = m;
    const tag = rawTag.toLowerCase();
    if (!ALLOWED.has(tag)) {
      // Not a hole: the tag is shown as the text it is, so a stray <foo> is visible rather than
      // silently swallowed, and a <script> is a word on the page rather than a script.
      stack[stack.length - 1].kids.push(m[0]);
      continue;
    }
    if (closing) {
      const i = stack.findIndex((n) => n.tag === tag);
      if (i > 0) stack.length = i;
      continue;
    }
    const attrs: Record<string, string> = {};
    for (const a of rawAttrs.matchAll(/([a-zA-Z-]+)\s*=\s*"([^"]*)"|([a-zA-Z-]+)\s*=\s*'([^']*)'/g)) {
      const name = (a[1] ?? a[3]).toLowerCase();
      // `href` and nothing else. No class - an editable field that can set a class can set
      // `fixed inset-0` - and no style, and no event handler by construction.
      if (name === 'href') attrs.href = a[2] ?? a[4];
    }
    const node: Node = { tag, attrs, kids: [] };
    stack[stack.length - 1].kids.push(node);
    if (!VOID.has(tag)) stack.push(node);
  }
  if (at < html.length) stack[stack.length - 1].kids.push(html.slice(at));
  return root.kids;
}

const unescape = (s: string) => s
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');

function build(nodes: (Node | string)[], base: string, key = ''): ReactNode[] {
  return nodes.map((n, i) => {
    if (typeof n === 'string') return <Fragment key={`${key}t${i}`}>{unescape(n)}</Fragment>;
    const kids = build(n.kids, base, `${key}${i}.`);
    if (n.tag === 'a') {
      const to = HREF.exec(n.attrs.href ?? '');
      // A link that does not point at another page of this board is not a link. Its words stay.
      if (!to) return <Fragment key={`${key}${i}`}>{kids}</Fragment>;
      return <Link key={`${key}${i}`} href={`${base}/${to[1]}`}>{kids}</Link>;
    }
    if (VOID.has(n.tag)) return createElement(n.tag, { key: `${key}${i}` });
    return createElement(n.tag, { key: `${key}${i}` }, kids);
  });
}

/** One section's body, as elements. */
export function Prose({ html, base }: { html: string; base: string }) {
  return <div className="board-prose">{build(parse(html ?? ''), base)}</div>;
}
