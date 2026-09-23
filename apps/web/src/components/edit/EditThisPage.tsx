'use client';

import { useEffect, useState, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Pencil, X, RotateCcw, Check, Loader2 } from 'lucide-react';
import { copyPageFor, CHROME_PAGE } from '@/lib/copy/routes';
import { loadPageCopy, savePageCopy, resetCopy, type CopyField } from '@/app/actions/copy';

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
          const edited = f.value !== f.shipped;
          // A heading is a line; an introduction is a paragraph. Guessing from the shipped length
          // beats asking every registry entry to declare which it is.
          const rows = Math.min(8, Math.max(2, Math.ceil(value.length / 60)));
          return (
            <div key={f.key} className="mb-5">
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <label htmlFor={f.key} className="text-sm font-medium text-foreground">
                  {f.label}
                </label>
                {edited && (
                  <button
                    onClick={() => putBack(f.key)}
                    disabled={pending}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    title="Put back the wording this site came with"
                  >
                    <RotateCcw size={11} /> Put back
                  </button>
                )}
              </div>
              <p className="mb-1.5 text-xs text-muted-foreground">{f.hint}</p>
              <textarea
                id={f.key}
                rows={rows}
                value={value}
                onChange={(e) => setField(f.key, e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
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
