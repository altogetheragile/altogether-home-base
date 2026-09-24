'use client';

import { useEffect, useState, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Pencil, X, RotateCcw, Undo2, Check, Loader2 } from 'lucide-react';
import { copyPageFor, CHROME_PAGE, SITE_PAGE } from '@/lib/copy/routes';
import { ItemRows } from '@/components/edit/ItemRows';
import { PictureBox } from '@/components/edit/PictureBox';
import { IconPicker } from '@/components/edit/IconPicker';
import { ColourBox } from '@/components/edit/ColourBox';
import { SectionOrder } from '@/components/edit/SectionOrder';
import { SECTIONS_FOR_PAGE } from '@/lib/sections';
import { loadPageCopy, savePageCopy, resetCopy, undoCopy, type CopyField } from '@/app/actions/copy';

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

export function EditThisPage() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<string | null>(null);
  const [fields, setFields] = useState<CopyField[] | null>(null);
  // Drafts are kept per registry, not per drawer. Switching from This Page to Menu and Footer
  // and back used to throw away whatever had been typed, without saying so. Closing the drawer
  // keeps them too: the component stays mounted, so reopening finds the words still there.
  const [drafts, setDrafts] = useState<Record<string, Record<string, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startSaving] = useTransition();

  const pageHere = copyPageFor(pathname);
  // The menu and footer are on every page, so they are always offered. On a page with nothing else
  // to edit, they are the only thing offered, which is why the button still appears there.
  const tabs: Tab[] = [
    ...(pageHere ? [{ page: pageHere, label: 'This Page' }] : []),
    { page: CHROME_PAGE, label: 'Menu and Footer' },
    { page: SITE_PAGE, label: 'This Site' },
  ];
  const active = tab ?? tabs[0].page;

  useEffect(() => {
    if (!open) return;
    let alive = true;
    setFields(null);
    loadPageCopy(active).then((f) => alive && setFields(f));
    return () => {
      alive = false;
    };
  }, [open, active]);

  // Changing page with the drawer open would leave it editing the page you just left. Unsaved
  // drafts are deliberately not cleared here either: navigating away and back should not cost
  // somebody a paragraph they had written.
  useEffect(() => {
    setOpen(false);
    setTab(null);
  }, [pathname]);

  const draft = drafts[active] ?? {};
  const setField = (key: string, value: string) =>
    setDrafts((d) => ({ ...d, [active]: { ...(d[active] ?? {}), [key]: value } }));
  const clearDraft = () => setDrafts((d) => ({ ...d, [active]: {} }));
  const changed = Object.keys(draft).length > 0;

  const save = () => {
    setError(null);
    startSaving(async () => {
      const result = await savePageCopy(active, draft);
      if (!result.ok) return setError(result.error);
      clearDraft();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      // The page is server-rendered: without this the admin sees the words they just replaced.
      router.refresh();
      setFields(await loadPageCopy(active));
    });
  };

  const undo = (key: string) => {
    setError(null);
    startSaving(async () => {
      const result = await undoCopy(active, key);
      if (!result.ok) return setError(result.error);
      // Drop any unsaved draft for this field: it would sit on top of the value just restored and
      // read as though the undo had not worked.
      setDrafts((d) => {
        const { [key]: _dropped, ...rest } = d[active] ?? {};
        return { ...d, [active]: rest };
      });
      router.refresh();
      setFields(await loadPageCopy(active));
    });
  };

  const putBack = (key: string) => {
    startSaving(async () => {
      const result = await resetCopy(active, key);
      if (!result.ok) return setError(result.error);
      setDrafts((d) => {
        const { [key]: _dropped, ...rest } = d[active] ?? {};
        return { ...d, [active]: rest };
      });
      router.refresh();
      setFields(await loadPageCopy(active));
    });
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
        Changes save straight to the live site, and every one of them can be undone.
      </p>

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
        {fields?.map((f) => {
          const value = draft[f.key] ?? f.value;
          // Only offer to put something back when there is something to put back.
          //
          // This read `f.value !== f.shipped`, from when every shipped value was this site's own
          // wording. Now that a new site ships blank, the shipped value for the timeline, the
          // badges and the credentials is the empty string, so on a site that has filled them in
          // a button saying "Put back the wording this site came with" quietly meant "delete all
          // of this", in one click, with nothing to undo it.
          const canRestore = f.shipped.trim() !== '' && f.value !== f.shipped;
          // A heading is a line; an introduction is a paragraph. Guessing from the shipped length
          // beats asking every registry entry to declare which it is.
          const rows = Math.min(8, Math.max(2, Math.ceil(value.length / 60)));
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
              {f.type === 'sections' ? (
                <SectionOrder
                  value={value}
                  choices={SECTIONS_FOR_PAGE[active] ?? []}
                  onChange={(next) => setField(f.key, next)}
                />
              ) : f.type === 'items' && f.fields ? (
                <ItemRows value={value} fields={f.fields} onChange={(next) => setField(f.key, next)} />
              ) : f.type === 'image' ? (
                <PictureBox value={value} onChange={(next) => setField(f.key, next)} />
              ) : f.type === 'icon' ? (
                <IconPicker value={value} onChange={(next) => setField(f.key, next)} />
              ) : f.type === 'colour' ? (
                <ColourBox value={value} onChange={(next) => setField(f.key, next)} />
              ) : f.type === 'switch' ? (
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={value === 'on'}
                    onChange={(e) => setField(f.key, e.target.checked ? 'on' : '')}
                    className="h-4 w-4 rounded border-border"
                  />
                  {/* A status, not a label for the box. "Hidden" beside an unticked box reads
                      as "hidden: no" to about half the people who see it. */}
                  <span className={value === 'on' ? '' : 'font-medium text-amber-700'}>
                    {value === 'on' ? 'Visible to everyone' : 'Hidden from visitors'}
                  </span>
                </label>
              ) : (
                <textarea
                  id={f.key}
                  rows={rows}
                  value={value}
                  onChange={(e) => setField(f.key, e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              )}
            </div>
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
      </footer>
    </aside>
  );
}
