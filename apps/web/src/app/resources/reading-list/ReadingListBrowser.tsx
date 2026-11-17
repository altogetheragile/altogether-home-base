'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { colors as c, fonts, radii } from '@/lib/brand';
import { AMAZON_LINK_ATTRS } from '@altogether/ui/amazon';
import { filterShelves, type ListedShelf } from './filterShelves';

// Narrows the books the server already rendered. Nothing here fetches: the full list arrived with
// the page, hidden books were never in it, and the links were built before they got here.
//
// The topic is in the address (?category=slug) so a filtered view can be shared. It is written
// with history.replaceState rather than the router, because the router would ask the server to
// render the page again for a change the browser can make on its own.

const CARD_BORDER = '#E5E7EB';
/** Near-black on the orange: 6.8:1. White is 2.2:1 and deep teal 4.47:1, both under AA. */
const ON_ORANGE = '#1F2937';

export interface BrowserWords {
  all: string;
  reset: string;
  filterLabel: string;
  searchLabel: string;
  count: string;
  empty: string;
  button: string;
  featured: string;
}

export function ReadingListBrowser({
  shelves,
  initialCategory,
  words,
}: {
  shelves: ListedShelf[];
  initialCategory: string;
  words: BrowserWords;
}) {
  const [category, setCategory] = useState(initialCategory);
  const [query, setQuery] = useState('');

  const total = useMemo(() => shelves.reduce((n, s) => n + s.books.length, 0), [shelves]);
  const shown = useMemo(() => filterShelves(shelves, { category, query }), [shelves, category, query]);
  const shownCount = shown.reduce((n, s) => n + s.books.length, 0);

  const pick = (slug: string) => {
    setCategory(slug);
    try {
      const url = new URL(window.location.href);
      if (slug) url.searchParams.set('category', slug);
      else url.searchParams.delete('category');
      window.history.replaceState(window.history.state, '', url.toString());
    } catch {
      // The filter still works; only the shareable address does not follow it.
    }
  };

  const chip = (slug: string, label: string) => {
    const on = category === slug;
    return (
      <button
        key={slug || 'all'}
        type="button"
        aria-pressed={on}
        onClick={() => pick(slug)}
        className="rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{
          background: on ? c.deepTeal : c.white,
          color: on ? c.white : c.deepTeal,
          border: `1px solid ${on ? c.deepTeal : CARD_BORDER}`,
          outlineColor: c.deepTeal,
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4">
        <div role="group" aria-label={words.filterLabel} className="flex flex-wrap gap-2">
          {chip('', words.all)}
          {shelves.map((s) => chip(s.category.slug, s.category.name))}
        </div>

        <div className="max-w-md">
          <label htmlFor="reading-list-search" className="mb-1.5 block text-sm font-medium" style={{ color: c.body }}>
            {words.searchLabel}
          </label>
          <div className="relative">
            <Search aria-hidden size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: c.muted }} />
            <input
              id="reading-list-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
              className="w-full rounded-lg py-2 pl-9 pr-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1"
              style={{ border: `1px solid ${CARD_BORDER}`, color: c.body, outlineColor: c.deepTeal }}
            />
          </div>
        </div>

        <p aria-live="polite" className="text-sm" style={{ color: c.muted }}>
          {words.count.replace('{shown}', String(shownCount)).replace('{total}', String(total))}
        </p>
      </div>

      {shownCount === 0 ? (
        <div className="mt-8 rounded-xl p-8 text-center" style={{ border: `1px dashed ${CARD_BORDER}`, color: c.body }}>
          <p className="m-0">{words.empty}</p>
          {(category || query) && (
            <button
              type="button"
              onClick={() => { setQuery(''); pick(''); }}
              className="mt-3 text-sm font-semibold underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{ color: c.deepTeal, outlineColor: c.deepTeal }}
            >
              {words.reset}
            </button>
          )}
        </div>
      ) : (
        shown.map((s) => (
          <section key={s.category.id} aria-labelledby={`shelf-${s.category.slug}`} className="mt-10">
            <h2 id={`shelf-${s.category.slug}`} className="m-0" style={{ fontFamily: fonts.serif, color: c.deepTeal, fontSize: 26, fontWeight: 400 }}>
              {s.category.name}
            </h2>
            {s.category.description && <p className="mt-1 text-sm" style={{ color: c.body }}>{s.category.description}</p>}
            <ul className="mt-4 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {s.books.map((b) => (
                <li
                  key={b.id}
                  className="flex flex-col p-5"
                  style={{ background: c.white, border: `1px solid ${CARD_BORDER}`, borderRadius: radii.lg }}
                >
                  {b.featured && (
                    <span className="mb-2 self-start rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: c.paleTeal, color: c.deepTeal }}>
                      {words.featured}
                    </span>
                  )}
                  <h3 className="m-0 text-base font-semibold leading-snug" style={{ color: c.deepTeal }}>{b.title}</h3>
                  {b.author && <p className="mt-1 text-sm" style={{ color: c.body }}>{b.author}</p>}
                  {b.blurb && <p className="mt-2 text-sm" style={{ color: c.muted }}>{b.blurb}</p>}
                  {/* Pushed to the bottom, so the buttons in a row line up whatever the titles do. */}
                  <div className="mt-auto pt-4">
                    <a
                      href={b.href}
                      {...AMAZON_LINK_ATTRS}
                      className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold no-underline transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                      style={{ background: c.orange, color: ON_ORANGE, outlineColor: c.deepTeal }}
                    >
                      {words.button}
                      <span className="sr-only"> for {b.title} (opens in a new tab)</span>
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
