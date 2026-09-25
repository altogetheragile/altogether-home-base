import { useEffect, useRef, useState, useTransition } from 'react';
import { Pencil, X, RotateCcw, Undo2, Check, Loader2, Eye, EyeOff, Search, ChevronDown } from 'lucide-react';
import { FieldControl } from './FieldControl';
import type { CopyField, SaveResult } from './store';
import { groupFields, filterGroups } from './grouping';

/** Everything the drawer cannot know for itself.
 *
 *  Which app is rendering it, where the router thinks we are, how to reach the database, and how
 *  to make the page show what was just saved. The Site answers with server actions and Next's
 *  router; the App answers with the Supabase client and its own. Neither has to know about the
 *  other, and both get the same editor. */
export type EditorHost = {
  pathname: string;
  /** Make the page behind the drawer show the change. */
  refresh: () => void;
  /** Which registry this URL edits, or null where there is nothing page-specific to edit. */
  pageForPath: (pathname: string) => string | null;
  /** The tabs offered everywhere, in order. */
  alwaysOffered: { page: string; label: string }[];
  load: (page: string) => Promise<CopyField[]>;
  save: (page: string, changes: Record<string, string>) => Promise<SaveResult>;
  reset: (page: string, key: string) => Promise<SaveResult>;
  undo: (page: string, key: string) => Promise<SaveResult>;
  upload: (file: File) => Promise<string>;

  // ---- Holding a change back. Optional, so a host that cannot draft simply does not offer it,
  // rather than offering a button that fails. ----

  /** Save without publishing. The site carries on showing what it showed. */
  saveDraft?: (page: string, changes: Record<string, string>) => Promise<SaveResult>;
  /** Put everything waiting on this page live, in one go. */
  publishDrafts?: (page: string) => Promise<SaveResult>;
  /** Throw away what is waiting: one field, or the whole page. Changes nothing on the site. */
  discardDrafts?: (page: string, key?: string) => Promise<SaveResult>;
  /** Whether the page behind the drawer is currently showing drafts, and how to change that.
   *
   *  Only the app that renders the words can answer this, which is why it is the host's. The App
   *  edits the menu and the footer but does not render them, so it leaves this out and the drawer
   *  offers no preview there rather than a preview of nothing. */
  preview?: { on: boolean; set: (on: boolean) => void };
  /** Open on arrival, at this tab. Set from the URL, so something elsewhere can send somebody
   *  straight to the right box rather than to the right page and a hunt. */
  openAt?: string | null;
  /** Where the setup checklist lives, if this app can reach it. A plain address rather than a
   *  callback: it is a page, and both apps should leave to it properly. */
  setupHref?: string;
};

// ============= Editing the site from the site =============
//
// The words were only editable from an admin page: find the page in a list, guess which entry is
// the heading you are looking at, save, then go and look. This puts the editing where the words
// are, which is the thing people already know how to do from WordPress.
//
// It is a drawer rather than click-the-text-and-type, and that is a deliberate first step. Roughly
// seventy of the hundred copy reads are plain text between tags and could be edited in place; the
// rest are alt text, meta descriptions, and lists kept as one entry per line. An editor that
// handled only the first seventy would look complete and quietly not be, and the missing ones are
// exactly the ones nobody would think to look for. Every entry the page has is in this drawer.
//
// Nothing here renders for anyone but an admin: the layout does not mount it, and both server
// actions check again on arrival.

type Tab = { page: string; label: string };

/** Same reasoning as countItems: an order is only meaningful as an order, so say what it was
 *  rather than printing the array. */
function describeOrder(value: string): string {
  try {
    const rows = JSON.parse(value || '[]');
    if (!Array.isArray(rows) || rows.length === 0) return 'the order the page was built in';
    const hidden = rows.filter((r) => r && r.visible === false).length;
    const first = rows.find((r) => r && r.visible !== false)?.section;
    return `${rows.length} sections${first ? `, starting with ${first}` : ''}${hidden ? `, ${hidden} hidden` : ''}`;
  } catch {
    return 'the order the page was built in';
  }
}

/** A JSON blob quoted back at somebody says nothing. How many there were says what undo will do. */
function countItems(value: string): number {
  try {
    const out = JSON.parse(value || '[]');
    return Array.isArray(out) ? out.length : 0;
  } catch {
    return 0;
  }
}

export function EditDrawer({ host }: { host: EditorHost }) {
  const { pathname } = host;
  const [open, setOpen] = useState(Boolean(host.openAt));
  const [tab, setTab] = useState<string | null>(null);
  const [fields, setFields] = useState<CopyField[] | null>(null);
  // Drafts are kept per registry, not per drawer. Switching from This Page to Menu and Footer
  // and back used to throw away whatever had been typed, without saying so. Closing the drawer
  // keeps them too: the component stays mounted, so reopening finds the words still there.
  const [drafts, setDrafts] = useState<Record<string, Record<string, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  /** What somebody has typed to find a field. For thirty-eight boxes this beats any amount of
   *  well-organised scrolling, so it sits above the groups rather than inside them. */
  const [query, setQuery] = useState('');
  /** Groups the person has folded away. Closed rather than open, so reopening the drawer leaves
   *  everything where they put it; the initial state is decided once, when the fields arrive. */
  const [closed, setClosed] = useState<Set<string>>(new Set());
  /** Which tab's folds have been set up, so a person's own folding survives a save and a reload
   *  and is only redecided when they move to a different tab. */
  const foldedFor = useRef<string | null>(null);
  const [pending, startSaving] = useTransition();

  const pageHere = host.pageForPath(pathname);
  // Asked for a tab that is not on this page: open anyway, on the first one. Better than a link
  // that silently does nothing.
  const asked = host.openAt && (host.openAt === pageHere || host.alwaysOffered.some((t) => t.page === host.openAt))
    ? host.openAt
    : null;
  // The menu and footer are on every page, so they are always offered. On a page with nothing else
  // to edit, they are the only thing offered, which is why the button still appears there.
  const tabs: Tab[] = [
    ...(pageHere ? [{ page: pageHere, label: 'This Page' }] : []),
    ...host.alwaysOffered,
  ];
  const active = tab ?? asked ?? tabs[0].page;

  useEffect(() => {
    if (!open) return;
    let alive = true;
    setFields(null);
    host.load(active).then((f) => alive && setFields(f));
    return () => {
      alive = false;
    };
    // host is memoised by whichever app mounted this; without it here the effect reads a stale
    // load function after a route change.
  }, [open, active, host]);

  // Changing page with the drawer open would leave it editing the page you just left. Unsaved
  // drafts are deliberately not cleared here either: navigating away and back should not cost
  // somebody a paragraph they had written.
  //
  // Not on the first render, which is not a change of page. It ran on mount as well as on
  // navigation, so a link that asked for the drawer to be open got it opened and then shut again
  // in the same tick, and the link looked broken.
  const arrivedAt = useRef(pathname);
  useEffect(() => {
    if (arrivedAt.current === pathname) return;
    arrivedAt.current = pathname;
    setOpen(false);
    setTab(null);
  }, [pathname]);

  // A long page opens folded except for its first part, because a column of thirty-eight boxes
  // with headings in it is still a column of thirty-eight boxes. A short one opens as it always
  // did: folding four fields into two groups hides things for no gain.
  useEffect(() => {
    if (!fields || foldedFor.current === active) return;
    foldedFor.current = active;
    setQuery('');
    const all = groupFields(fields);
    setClosed(all.length > 2 && fields.length > 12 ? new Set(all.slice(1).map((g) => g.name)) : new Set());
  }, [fields, active]);

  const draft = drafts[active] ?? {};
  const setField = (key: string, value: string) =>
    setDrafts((d) => ({ ...d, [active]: { ...(d[active] ?? {}), [key]: value } }));
  const clearDraft = () => setDrafts((d) => ({ ...d, [active]: {} }));
  const changed = Object.keys(draft).length > 0;

  // Two different things are called a draft here, and conflating them would be a mess. `draft`
  // above is what has been typed into this drawer and not sent anywhere. `waiting` is what has
  // been sent and deliberately not published. Only the second survives closing the browser.
  const waiting = (fields ?? []).filter((f) => f.draft);
  const canDraft = Boolean(host.saveDraft);

  /** Every write goes through here, so one place clears the typing, reloads, and refreshes the
   *  page behind the drawer. They had drifted apart once already. */
  const afterWriting = async (result: SaveResult, clearTyping: boolean) => {
    if (!result.ok) return setError(result.error);
    if (clearTyping) clearDraft();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    // The page is server-rendered: without this the admin sees the words they just replaced.
    host.refresh();
    setFields(await host.load(active));
  };

  // Grouped by the middle of each key, which is where the registry already says a field belongs.
  // A page with too few fields to get lost in is left as one list: a single heading over
  // everything is a landmark that marks nothing.
  const groups = groupFields(fields ?? []);
  const shown = filterGroups(groups, query);
  const hits = shown.reduce((n, g) => n + g.fields.length, 0);
  const searchable = (fields?.length ?? 0) > 8;

  /** One field, wherever it is shown: inside a group, or flat when a page has too few to be
   *  worth grouping, or in a list of search results. Three callers, one appearance. */
  const renderField = (f: CopyField) => {
          const value = draft[f.key] ?? f.value;
          // Only offer to put something back when there is something to put back.
          //
          // This read `f.value !== f.shipped`, from when every shipped value was this site's own
          // wording. Now that a new site ships blank, the shipped value for the timeline, the
          // badges and the credentials is the empty string, so on a site that has filled them in
          // a button saying "Put back the wording this site came with" quietly meant "delete all
          // of this", in one click, with nothing to undo it.
          const canRestore = f.shipped.trim() !== '' && f.value !== f.shipped;
          return (
            <div key={f.key} className="mb-5">
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <label htmlFor={f.key} className="text-sm font-medium text-foreground">
                  {f.label}
                </label>
                {f.undo && (
                  <button
                    onClick={() => undo(f.key)}
                    disabled={pending}
                    className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    title={`Go back to: ${f.undo.value.slice(0, 120) || '(empty)'}`}
                  >
                    <Undo2 size={11} /> Undo
                  </button>
                )}
                {canRestore && (
                  <button
                    onClick={() => putBack(f.key)}
                    disabled={pending}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    title="Back to the wording this site was built with, in one step"
                  >
                    <RotateCcw size={11} /> Original
                  </button>
                )}
              </div>
              <p className="mb-1.5 text-xs text-muted-foreground">{f.hint}</p>
              {f.draft && (
                <p className="mb-1.5 flex items-start gap-1.5 rounded border border-amber-300 bg-amber-50 px-2 py-1 text-xs text-amber-900">
                  <span className="flex-1">
                    {/* The box below shows the published value, because that is what this field
                        currently is. Saying what the draft would make it, rather than swapping
                        the box's contents, keeps "what is live" answerable at a glance. */}
                    <span className="font-medium">Draft waiting:</span>{' '}
                    {f.type === 'sections'
                      ? describeOrder(f.draft.value)
                      : f.type === 'items'
                      ? `${countItems(f.draft.value)} item${countItems(f.draft.value) === 1 ? '' : 's'}`
                      : f.draft.value.trim()
                        ? `“${f.draft.value.replace(/\n/g, ' ').slice(0, 80)}”`
                        : 'empty'}
                  </span>
                  <button
                    onClick={() => discard(f.key)}
                    disabled={pending}
                    className="shrink-0 underline hover:no-underline disabled:opacity-50"
                  >
                    Discard
                  </button>
                </p>
              )}
              {f.undo && (
                <p className="mb-1.5 truncate text-xs text-muted-foreground/80">
                  <span className="font-medium">Was:</span>{' '}
                  {/* A JSON blob quoted back at somebody says nothing. How many there were says
                      what pressing Undo will actually do. */}
                  {f.type === 'sections'
                    ? describeOrder(f.undo.value)
                    : f.type === 'items'
                    ? `${countItems(f.undo.value)} item${countItems(f.undo.value) === 1 ? '' : 's'}`
                    : f.undo.value.trim()
                      ? `“${f.undo.value.replace(/\n/g, ' ').slice(0, 90)}”`
                      : 'empty'}
                </p>
              )}
              <FieldControl
                field={f}
                value={value}
                page={active}
                onChange={(next) => setField(f.key, next)}
                upload={host.upload}
              />
            </div>
          );
  };

  const save = () => {
    setError(null);
    startSaving(() => { void (async () => {
      await afterWriting(await host.save(active, draft), true);
    })(); });
  };

  const saveAsDraft = () => {
    if (!host.saveDraft) return;
    setError(null);
    startSaving(() => { void (async () => {
      await afterWriting(await host.saveDraft!(active, draft), true);
    })(); });
  };

  const publish = () => {
    if (!host.publishDrafts) return;
    setError(null);
    startSaving(() => { void (async () => {
      await afterWriting(await host.publishDrafts!(active), false);
    })(); });
  };

  const discard = (key?: string) => {
    if (!host.discardDrafts) return;
    setError(null);
    startSaving(() => { void (async () => {
      await afterWriting(await host.discardDrafts!(active, key), false);
    })(); });
  };

  const undo = (key: string) => {
    setError(null);
    startSaving(() => { void (async () => {
      const result = await host.undo(active, key);
      if (!result.ok) return setError(result.error);
      // Drop any unsaved draft for this field: it would sit on top of the value just restored and
      // read as though the undo had not worked.
      setDrafts((d) => {
        const { [key]: _dropped, ...rest } = d[active] ?? {};
        return { ...d, [active]: rest };
      });
      host.refresh();
      setFields(await host.load(active));
    })(); });
  };

  const putBack = (key: string) => {
    startSaving(() => { void (async () => {
      const result = await host.reset(active, key);
      if (!result.ok) return setError(result.error);
      setDrafts((d) => {
        const { [key]: _dropped, ...rest } = d[active] ?? {};
        return { ...d, [active]: rest };
      });
      host.refresh();
      setFields(await host.load(active));
    })(); });
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-[60] flex items-center gap-2 rounded-full bg-foreground px-4 py-3 text-sm font-medium text-background shadow-lg transition-transform hover:scale-105"
      >
        <Pencil size={16} /> Edit This Page
      </button>
    );
  }

  return (
    <aside className="fixed inset-y-0 right-0 z-[60] flex w-full max-w-md flex-col border-l border-border bg-background shadow-2xl">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">Editing {pathname}</h2>
        <button onClick={() => setOpen(false)} aria-label="Close the editor" className="rounded p-1 hover:bg-muted">
          <X size={18} />
        </button>
      </header>

      {/* Said once, permanently, rather than discovered after the first mistake. An undo that only
          announces itself once you have already used it is not a safety net anybody relies on. */}
      <p className="border-b border-border bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
        {canDraft
          ? 'Saving publishes straight away, and can be undone. Save as draft holds a change back until you publish it.'
          : 'Changes save straight to the live site, and every one of them can be undone.'}
      </p>

      {/* What is waiting, and the three things you can do about it, in the drawer rather than on
          some other screen. A draft you have to go and find is a draft you forget you left. */}
      {waiting.length > 0 && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5">
          <p className="text-xs font-medium text-amber-900">
            {waiting.length} {waiting.length === 1 ? 'change is' : 'changes are'} saved as a draft and not on the site yet.
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {host.preview && (
              <button
                onClick={() => host.preview!.set(!host.preview!.on)}
                disabled={pending}
                className="rounded border border-amber-300 bg-background px-2 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100 disabled:opacity-50"
              >
                {host.preview.on ? <><EyeOff size={12} className="mr-1 inline" />Stop previewing</> : <><Eye size={12} className="mr-1 inline" />Preview them</>}
              </button>
            )}
            <button
              onClick={publish}
              disabled={pending}
              className="rounded bg-amber-900 px-2 py-1 text-xs font-medium text-amber-50 hover:bg-amber-800 disabled:opacity-50"
            >
              Publish {waiting.length === 1 ? 'it' : 'them'}
            </button>
            <button
              onClick={() => discard()}
              disabled={pending}
              className="rounded border border-amber-300 bg-background px-2 py-1 text-xs text-amber-900 hover:bg-amber-100 disabled:opacity-50"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {/* Shown whenever the page behind is showing drafts, even with the band above scrolled past,
          because the dangerous state is believing you are looking at the live site when you are
          not. */}
      {host.preview?.on && (
        <p className="border-b border-border bg-foreground px-4 py-1.5 text-xs font-medium text-background">
          You are looking at drafts. Visitors still see the published site.
        </p>
      )}

      {tabs.length > 1 && (
        <div className="flex gap-1 border-b border-border px-3 py-2">
          {tabs.map((t) => (
            <button
              key={t.page}
              onClick={() => setTab(t.page)}
              className={`rounded-md px-3 py-1.5 text-sm ${
                active === t.page ? 'bg-muted font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
              {Object.keys(drafts[t.page] ?? {}).length > 0 && (
                <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-primary align-middle" aria-label="unsaved changes" />
              )}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {fields === null && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 size={14} className="animate-spin" /> Reading this page&rsquo;s words
          </p>
        )}
        {fields?.length === 0 && (
          <p className="text-sm text-muted-foreground">There is nothing editable on this page yet.</p>
        )}
        {searchable && fields && fields.length > 0 && (
          <div className="mb-4">
            <div className="relative">
              <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Find among ${fields.length} things you can change`}
                aria-label="Find a field"
                className="w-full rounded-md border border-border bg-background py-1.5 pl-7 pr-7 text-sm"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  aria-label="Clear"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            {query && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                {hits === 0 ? 'Nothing here matches that.' : `${hits} of ${fields.length}`}
              </p>
            )}
          </div>
        )}

        {/* One list when there is nothing to group, groups when there is. While somebody is
            searching every group stands open: folding away a result is hiding the thing they
            just asked for. */}
        {groups.length === 0
          ? fields?.map(renderField)
          : shown.map((g) => {
              const open = query.trim() !== '' || !closed.has(g.name);
              const unsaved = g.fields.some((f) => f.key in draft);
              return (
                <section key={g.name} className="mb-2 border-b border-border/60 last:border-b-0">
                  <button
                    onClick={() => setClosed((c) => {
                      const next = new Set(c);
                      if (next.has(g.name)) next.delete(g.name); else next.add(g.name);
                      return next;
                    })}
                    aria-expanded={open}
                    className="flex w-full items-center gap-2 py-2.5 text-left text-sm font-medium text-foreground"
                  >
                    <ChevronDown size={13} className={`shrink-0 text-muted-foreground transition-transform ${open ? '' : '-rotate-90'}`} />
                    <span className="flex-1">{g.name}</span>
                    {/* So a folded group cannot quietly hold something you typed and forgot. */}
                    {unsaved && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-label="unsaved changes" />}
                    <span className="shrink-0 text-xs font-normal text-muted-foreground">{g.fields.length}</span>
                  </button>
                  {open && <div className="pb-1 pl-5">{g.fields.map(renderField)}</div>}
                </section>
              );
            })}
      </div>

      <footer className="border-t border-border px-4 py-3">
        {error && <p className="mb-2 text-sm text-destructive">{error}</p>}
        <button
          onClick={save}
          disabled={!changed || pending}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-40"
        >
          {pending ? <Loader2 size={15} className="animate-spin" /> : saved ? <Check size={15} /> : null}
          {pending ? 'Saving' : saved ? 'Saved' : changed ? `Save ${Object.keys(draft).length} change${Object.keys(draft).length === 1 ? '' : 's'}` : 'Nothing changed yet'}
        </button>
        {/* Second, quieter, and never the default. Publishing is what this button did before
            drafting existed and is still what most edits want; making drafting the prominent
            choice would put a second step in front of fixing a typo. */}
        {canDraft && (
          <button
            onClick={saveAsDraft}
            disabled={!changed || pending}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-40"
          >
            Save as draft, do not publish yet
          </button>
        )}
        {/* The way in to the checklist. It has to be somewhere somebody stumbles on, and this
            drawer is the one thing already on every page and already only theirs. */}
        {host.setupHref && (
          <a
            href={host.setupHref}
            className="mt-3 block text-center text-xs text-muted-foreground underline hover:text-foreground"
          >
            What is left to set up on this site
          </a>
        )}
      </footer>
    </aside>
  );
}
