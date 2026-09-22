import { marked } from 'marked';

/** Markdown to HTML for exam prose (the guide and the Practitioner scenario).
 *
 *  Shared so the editor's preview and the page cannot drift: they were separate before, which is
 *  how the Admin editor ended up rendering with react-markdown while the page rendered with marked
 *  and a GFM table appeared in one and not the other.
 *
 *  The stripping is not a sanitiser and is not the security boundary. The guide is admin-written
 *  and the `exams` table is admin-write-only under RLS. It is here because HTML in markdown is
 *  legal, and a paste from elsewhere should not be able to run. */
export function renderMarkdown(md: string | null | undefined): string {
  if (!md) return '';
  const html = String(marked.parse(md, { async: false }));
  return html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
}
