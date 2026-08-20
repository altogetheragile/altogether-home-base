import { useMemo, useState } from 'react';
import { PencilLine, X, RotateCcw, Check, Loader2, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { copyEntries, type CopyEntry } from './copy';
import { saveCopy } from './useZooCopy';

// ============= Editing the teaching copy from inside the game =============
//
// The person polishing a sentence is the person playing the game, and they are usually looking at
// the sentence when they want to change it. So this lives in the game rather than in an admin
// screen: open it on the screen you are on, and it lists that screen's teaching copy first.
//
// Only the teaching voice is here. Button labels, column names and step titles stay in code -
// they are bound to layout and logic, and an edit there breaks a screen rather than improving a
// sentence.

function EditRow({ entry, current, onSaved }: { entry: CopyEntry; current?: string; onSaved: (key: string, value: string) => void }) {
  const { user } = useAuth();
  const [draft, setDraft] = useState(current ?? entry.value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const edited = (current ?? entry.value) !== entry.value;
  const dirty = draft !== (current ?? entry.value);

  const save = async (value: string) => {
    setSaving(true); setError(null);
    const err = await saveCopy(entry.key, value === entry.value ? '' : value, user?.id);
    setSaving(false);
    if (err) { setError(err); return; }
    entry.apply(value);
    onSaved(entry.key, value === entry.value ? '' : value);
  };

  return (
    <div className={cn('rounded-md border px-2 py-1.5', edited ? 'border-primary/40 bg-primary/5' : 'border-border bg-card')}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold">{entry.label}</span>
        {edited && (
          <button type="button" onClick={() => { setDraft(entry.value); void save(entry.value); }}
            title="Back to the wording the game shipped with"
            className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground">
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
        )}
      </div>
      <p className="mb-1 text-[10px] text-muted-foreground/80">{entry.where}</p>
      {entry.long
        ? <textarea value={draft} onChange={(e) => setDraft(e.target.value)}
          rows={Math.min(16, Math.max(3, Math.ceil(draft.length / 80) + 1))}
          className="w-full resize-y rounded border border-border bg-background px-2 py-1.5 text-[13px] leading-relaxed outline-none focus:border-primary" />
        : <input value={draft} onChange={(e) => setDraft(e.target.value)}
          className="w-full rounded border border-border bg-background px-2 py-1.5 text-[13px] outline-none focus:border-primary" />}
      {error && <p className="mt-1 text-[10px] text-destructive">{error}</p>}
      {dirty && (
        <div className="mt-1 flex items-center justify-end gap-1.5">
          <button type="button" onClick={() => setDraft(current ?? entry.value)} className="text-[11px] text-muted-foreground hover:text-foreground">Cancel</button>
          <Button size="sm" className="h-6 px-2 text-[11px]" disabled={saving} onClick={() => void save(draft)}>
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Check className="mr-1 h-3 w-3" /> Save</>}
          </Button>
        </div>
      )}
    </div>
  );
}

export interface CopyEditorProps {
  overrides: Record<string, string>;
  onChanged: (key: string, value: string) => void;
}

/** The pencil in the game's header, and the panel it opens. Only shown to an admin. */
export function CopyEditor({ phase, overrides, onChanged }: CopyEditorProps & { phase: string }) {
  const { data: role } = useUserRole();
  const [open, setOpen] = useState(false);
  const [all, setAll] = useState(false);
  const [wide, setWide] = useState(false);
  const [q, setQ] = useState('');

  const entries = useMemo(() => copyEntries(), []);
  const shown = useMemo(() => {
    const onThisScreen = (e: CopyEntry) => e.phases.length === 0 || e.phases.includes(phase);
    const matches = (e: CopyEntry) => !q.trim()
      || (e.label + ' ' + e.value + ' ' + e.where).toLowerCase().includes(q.trim().toLowerCase());
    return entries.filter((e) => (all || onThisScreen(e)) && matches(e));
  }, [entries, phase, all, q]);

  if (role !== 'admin') return null;

  const groups = [...new Set(shown.map((e) => e.group))];
  const editedCount = entries.filter((e) => overrides[e.key]).length;

  return (
    <>
      <button type="button" onClick={() => setOpen((o) => !o)}
        title="Edit the teaching copy on this screen"
        className={cn('flex shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors',
          open ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background text-muted-foreground hover:text-foreground')}>
        <PencilLine className="h-3.5 w-3.5" />
        <span className="hidden lg:inline">Copy</span>
        {editedCount > 0 && <span className="rounded-full bg-primary/15 px-1 text-[9px] font-bold text-primary">{editedCount}</span>}
      </button>

      {open && (
        // A side panel rather than a modal: you keep looking at the screen you are editing.
        <div className={cn('fixed right-0 top-0 z-50 flex h-full flex-col border-l border-border bg-background shadow-2xl',
          // Editing prose in a 380px rail was miserable. Wide enough to see a paragraph as the
          // learner will, and wider still for a long polishing session.
          wide ? 'w-[min(1000px,96vw)]' : 'w-[min(640px,94vw)]')}>
          <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
            <div>
              <h2 className="text-sm font-semibold">Teaching copy</h2>
              <p className="text-[11px] text-muted-foreground">Edits go live for everyone. Reset returns the shipped wording.</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button type="button" onClick={() => setWide((w) => !w)} aria-label={wide ? 'Narrower' : 'Wider'} title={wide ? 'Narrower' : 'Wider'}
                className="rounded border border-border p-1 text-muted-foreground hover:text-foreground">
                {wide ? <ChevronsRight className="h-3.5 w-3.5" /> : <ChevronsLeft className="h-3.5 w-3.5" />}
              </button>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
          </div>

          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the wording..."
              className="min-w-0 flex-1 rounded border border-border bg-background px-2 py-1 text-xs outline-none focus:border-primary" />
            <button type="button" onClick={() => setAll((a) => !a)}
              className={cn('shrink-0 rounded-full border px-2 py-1 text-[10px] font-medium',
                all ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground')}>
              {all ? 'Everything' : 'This screen'}
            </button>
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-2">
            {shown.length === 0 && <p className="py-6 text-center text-[12px] text-muted-foreground">Nothing matching. Try &ldquo;Everything&rdquo;.</p>}
            {groups.map((g) => (
              <section key={g}>
                <h3 className="mb-1 text-[10px] font-bold uppercase tracking-[0.08em] text-primary">{g}</h3>
                <div className={cn('gap-1.5', wide ? 'columns-2 [&>*]:mb-1.5 [&>*]:break-inside-avoid' : 'space-y-1.5')}>
                  {shown.filter((e) => e.group === g).map((e) => (
                    <EditRow key={e.key} entry={e} current={overrides[e.key]} onSaved={onChanged} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
