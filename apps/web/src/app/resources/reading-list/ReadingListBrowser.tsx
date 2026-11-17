'use client';

import { useMemo, useState } from 'react';
import { Eye, EyeOff, Heart, Search } from 'lucide-react';
import { colors as c, fonts, radii } from '@/lib/brand';
import { AMAZON_LINK_ATTRS } from '@altogether/ui/amazon';
import { setBookFlags } from '@/app/actions/readingList';
import { arrangeForView, type ListedBook, type ListedShelf } from './filterShelves';

// Narrows the books the server already rendered. Nothing here fetches: the full list arrived with
// the page, a visitor's never contained a hidden book, and the links were built before they got here.
//
// The topic is in the address (?category=slug) so a filtered view can be shared. It is written
// with history.replaceState rather than the router, because the router would ask the server to
// render the page again for a change the browser can make on its own.
//
// On an admin's page each tile also has a heart (a favourite, grouped at the top for everyone) and
// an eye (shown or hidden). They change here at once and are saved behind it; a save that fails
// puts the tile back and says so.

const CARD_BORDER = '#E5E7EB';
/** Near-black on the orange: 6.8:1. White is 2.2:1 and deep teal 4.47:1, both under AA. */
const ON_ORANGE = '#1F2937';
/** The heart when on. Deep teal rather than red: it is a mark of the site's own choice, not a like. */
const HEART = c.deepTeal;

export interface BrowserWords {
  all: string;
  reset: string;
  filterLabel: string;
  searchLabel: string;
  count: string;
  empty: string;
  button: string;
  favourites: string;
}

type Flags = { featured?: boolean; hidden?: boolean };

export function ReadingListBrowser({
  shelves,
  initialCategory,
  admin = false,
  words,
}: {
  shelves: ListedShelf[];
  initialCategory: string;
  /** Only true for a signed-in admin who has not asked for the visitor's view. */
  admin?: boolean;
  words: BrowserWords;
}) {
  const [category, setCategory] = useState(initialCategory);
  const [query, setQuery] = useState('');
  const [changed, setChanged] = useState<Record<string, Flags>>({});
  const [problem, setProblem] = useState('');

  // The server's shelves with this session's presses laid over them.
  const current = useMemo(
    () => shelves.map((s) => ({ ...s, books: s.books.map((b) => ({ ...b, ...changed[b.id] })) })),
    [shelves, changed],
  );
  const total = useMemo(() => current.reduce((n, s) => n + s.books.length, 0), [current]);
  const view = useMemo(() => arrangeForView(current, { category, query }), [current, category, query]);

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

  const press = async (b: ListedBook, flags: Flags) => {
    const before: Flags = { featured: b.featured, hidden: b.hidden };
    setProblem('');
    setChanged((m) => ({ ...m, [b.id]: { ...m[b.id], ...flags } }));
    const res = await setBookFlags(b.id, {
      ...(flags.featured !== undefined ? { is_featured: flags.featured } : {}),
      ...(flags.hidden !== undefined ? { is_visible: !flags.hidden } : {}),
    }).catch((e: Error) => ({ ok: false as const, error: e.message }));
    if (!res.ok) {
      setChanged((m) => ({ ...m, [b.id]: { ...m[b.id], ...before } }));
      setProblem(`"${b.title}" was not changed: ${res.error}`);
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

  const iconButton = 'inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1';

  const tile = (b: ListedBook) => (
    <li
      key={b.id}
      className="relative flex min-w-0 gap-4 p-4"
      style={{ background: c.white, border: `1px ${b.hidden ? 'dashed' : 'solid'} ${CARD_BORDER}`, borderRadius: radii.lg }}
    >
      {admin && (
        // z-10: a hidden tile's content is faded, and opacity puts it in a layer of its own that
        // would otherwise sit over these buttons, so a hidden book could not be shown again.
        <div className="absolute right-2 top-2 z-10 flex gap-0.5">
          <button
            type="button"
            className={iconButton}
            style={{ color: b.featured ? HEART : c.muted, outlineColor: c.deepTeal }}
            aria-pressed={!!b.featured}
            aria-label={`Favourite: ${b.title}`}
            title={b.featured ? 'A favourite, shown at the top. Press to remove.' : 'Make this a favourite, shown at the top'}
            onClick={() => press(b, { featured: !b.featured })}
          >
            <Heart size={17} fill={b.featured ? HEART : 'none'} aria-hidden />
          </button>
          <button
            type="button"
            className={iconButton}
            style={{ color: b.hidden ? c.danger : c.muted, outlineColor: c.deepTeal }}
            aria-pressed={!!b.hidden}
            aria-label={`Hidden from visitors: ${b.title}`}
            title={b.hidden ? 'Hidden from visitors. Press to show it.' : 'Shown to visitors. Press to hide it.'}
            onClick={() => press(b, { hidden: !b.hidden })}
          >
            {b.hidden ? <EyeOff size={17} aria-hidden /> : <Eye size={17} aria-hidden />}
          </button>
        </div>
      )}
      <div className="flex min-w-0 flex-1 gap-4" style={{ opacity: b.hidden ? 0.5 : 1 }}>
        {b.cover && (
          // A plain img, not next/image: the file is already a small cover in this project's
          // storage, and the width and height stop the card jumping as it loads. Lazy, because
          // most of the 130 are below the fold.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={b.cover}
            alt={`Cover of ${b.title}`}
            width={88}
            height={132}
            loading="lazy"
            decoding="async"
            className="h-[132px] w-[88px] shrink-0 rounded object-cover"
            style={{ border: `1px solid ${CARD_BORDER}`, background: c.skyTeal }}
          />
        )}
        <div className={`flex min-w-0 flex-1 flex-col ${admin ? 'pr-16' : ''}`}>
          {b.hidden && (
            <span className="mb-1.5 self-start rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: '#FEE2E2', color: '#991B1B' }}>
              Hidden from visitors
            </span>
          )}
          <h3 className="m-0 text-base font-semibold leading-snug" style={{ color: c.deepTeal }}>{b.title}</h3>
          {b.author && <p className="mt-1 text-sm" style={{ color: c.body }}>{b.author}</p>}
          {b.blurb && <p className="mt-2 text-sm" style={{ color: c.muted }}>{b.blurb}</p>}
          {/* Pushed to the bottom, so the buttons in a row line up whatever the titles do. */}
          <div className="mt-auto pt-3">
            <a
              href={b.href}
              {...AMAZON_LINK_ATTRS}
              className="inline-flex items-center justify-center rounded-md px-2.5 py-1 text-xs font-semibold no-underline transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{ background: c.orange, color: ON_ORANGE, outlineColor: c.deepTeal }}
            >
              {words.button}
              <span className="sr-only"> for {b.title} (opens in a new tab)</span>
            </a>
          </div>
        </div>
      </div>
    </li>
  );

  const grid = 'mt-4 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3';

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
          {words.count.replace('{shown}', String(view.shown)).replace('{total}', String(total))}
        </p>
        {problem && <p role="alert" className="text-sm font-medium" style={{ color: c.danger }}>{problem}</p>}
      </div>

      {view.shown === 0 ? (
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
        <>
          {view.favourites.length > 0 && (
            <section aria-labelledby="shelf-favourites" className="mt-10">
              <h2 id="shelf-favourites" className="m-0 flex items-center gap-2" style={{ fontFamily: fonts.serif, color: c.deepTeal, fontSize: 26, fontWeight: 400 }}>
                <Heart size={20} fill={HEART} color={HEART} aria-hidden />
                {words.favourites}
              </h2>
              <ul className={grid}>{view.favourites.map(tile)}</ul>
            </section>
          )}
          {view.shelves.map((s) => (
            <section key={s.category.id} aria-labelledby={`shelf-${s.category.slug}`} className="mt-10">
              <h2 id={`shelf-${s.category.slug}`} className="m-0" style={{ fontFamily: fonts.serif, color: c.deepTeal, fontSize: 26, fontWeight: 400 }}>
                {s.category.name}
              </h2>
              {s.category.description && <p className="mt-1 text-sm" style={{ color: c.body }}>{s.category.description}</p>}
              <ul className={grid}>{s.books.map(tile)}</ul>
            </section>
          ))}
        </>
      )}
    </div>
  );
}
