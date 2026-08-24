import { useState } from 'react';
import { DOD_LIBRARY } from './config';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Plus, X, ClipboardCheck, Sparkles } from 'lucide-react';
import { FOCUS, PADDING, SURFACE } from './ui/tokens';

interface DodEditorProps {
  dod: string[];
  onSave: (dod: string[]) => void;
}

/** Refine the product-wide Definition of Done: edit the criteria, and add coached
 *  suggestions from a library grouped by the kind of quality bar each sets. Changes
 *  apply to every item from now on. */
export function DodEditor({ dod, onSave }: DodEditorProps) {
  const [items, setItems] = useState<string[]>(dod.length ? dod : ['']);
  const [showCoach, setShowCoach] = useState(false);

  const commit = (next: string[]) => { setItems(next); onSave(next.map((s) => s.trim()).filter(Boolean)); };
  const edit = (i: number, v: string) => commit(items.map((x, j) => (j === i ? v : x)));
  const remove = (i: number) => commit(items.filter((_, j) => j !== i));
  const add = () => setItems((a) => [...a, '']);
  const has = (c: string) => items.some((x) => x.trim().toLowerCase() === c.toLowerCase());
  const addSuggestion = (c: string) => { if (!has(c)) commit([...items.filter((x) => x.trim()), c]); };

  return (
    <div className={cn(SURFACE.card, PADDING.roomy, 'space-y-3')}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-sm font-semibold"><ClipboardCheck className="h-4 w-4" /> Definition of Done</div>
        <Button variant={showCoach ? 'default' : 'outline'} size="sm" className="h-7 px-2 text-xs" onClick={() => setShowCoach((s) => !s)}>
          <Sparkles className="mr-1 h-3.5 w-3.5" /> Suggest criteria
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground">
        The product-wide quality bar every item clears to be Done - the same for all items, unlike each PBI&rsquo;s own
        acceptance criteria. Inspect and refine it here; it applies to every item from now on.
      </p>

      <div className="space-y-1.5">
        {items.map((c, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
            <input value={c} onChange={(e) => edit(i, e.target.value)} placeholder="A general Done criterion"
              className={cn(SURFACE.inset, 'min-w-0 flex-1 px-2.5 py-1.5 text-sm outline-none focus:border-primary')} />
            {items.length > 1 && (
              <button type="button" onClick={() => remove(i)} className={cn(FOCUS, "shrink-0 text-muted-foreground hover:text-foreground")} aria-label="Remove criterion"><X className="h-4 w-4" /></button>
            )}
          </div>
        ))}
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={add}><Plus className="mr-1 h-3.5 w-3.5" /> Add criterion</Button>
      </div>

      {showCoach && (
        <div className="space-y-2 rounded-md border border-dashed border-primary/40 bg-primary/5 p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Suggestions - click to add</div>
          {DOD_LIBRARY.map((cat) => (
            <div key={cat.group} className="space-y-1">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70">{cat.group}</div>
              <div className="flex flex-wrap gap-1.5">
                {cat.items.map((c) => {
                  const added = has(c);
                  return (
                    <button key={c} type="button" disabled={added} onClick={() => addSuggestion(c)}
                      className={cn(FOCUS, 'rounded-full border px-2.5 py-1 text-[11px] transition-colors',
                        added ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-950/30 dark:text-emerald-300'
                          : 'border-border bg-background hover:border-primary hover:bg-primary/5')}>
                      {added ? '✓ ' : '+ '}{c}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
