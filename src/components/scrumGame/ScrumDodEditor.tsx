import { useState } from 'react';
import type { Criterion } from './types';
import { makeCriterion, MIN_DOD, MAX_DOD, SUGGESTED_DOD } from './config';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckSquare, Plus, X } from 'lucide-react';

interface ScrumDodEditorProps {
  dod: Criterion[];
  onSave: (dod: Criterion[]) => void;
}

let nextDodSeq = 1000;
const newDodId = () => `dod-${nextDodSeq++}`;

/** Edit the Definition of Done - the team's shared quality bar for the Increment.
 *  A story only counts as Done, and can only be accepted at the Review, when it
 *  meets these. Kept short and meaningful, not a sprawling checklist. */
export function ScrumDodEditor({ dod, onSave }: ScrumDodEditorProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Criterion[]>(() => dod.map((c) => ({ ...c })));

  const handleOpenChange = (next: boolean) => {
    if (next) setDraft(dod.map((c) => ({ ...c })));
    setOpen(next);
  };

  const edit = (id: string, label: string) => setDraft((prev) => prev.map((c) => (c.id === id ? { ...c, label } : c)));
  const remove = (id: string) => setDraft((prev) => prev.filter((c) => c.id !== id));
  const add = (label: string) => setDraft((prev) => (prev.length >= MAX_DOD ? prev : [...prev, makeCriterion(newDodId(), label)]));

  const usedLabels = new Set(draft.map((c) => c.label.trim().toLowerCase()));
  const suggestions = SUGGESTED_DOD.filter((s) => !usedLabels.has(s.toLowerCase()));

  const handleSave = () => {
    const cleaned = draft.map((c) => makeCriterion(c.id, c.label)).filter((c) => c.label.length > 0);
    if (cleaned.length >= MIN_DOD) onSave(cleaned);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <CheckSquare className="mr-1.5 h-4 w-4" /> Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Definition of Done</DialogTitle>
          <DialogDescription>
            The team's quality bar for the Increment. A story can only be accepted at the
            Review when it meets these. Keep it to {MIN_DOD}-{MAX_DOD} that actually matter.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {draft.map((c, i) => (
            <div key={c.id} className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 shrink-0 text-primary" />
              <Input
                value={c.label}
                onChange={(e) => edit(c.id, e.target.value)}
                className="h-8 flex-1"
                aria-label={`Criterion ${i + 1}`}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-destructive"
                disabled={draft.length <= MIN_DOD}
                onClick={() => remove(c.id)}
                aria-label="Remove criterion"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            disabled={draft.length >= MAX_DOD}
            onClick={() => add('')}
          >
            <Plus className="mr-1.5 h-4 w-4" /> Add your own
          </Button>
        </div>

        {suggestions.length > 0 && draft.length < MAX_DOD && (
          <div className="space-y-1.5">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Quick add</div>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => add(s)}
                  className="rounded-full border border-border bg-card px-2.5 py-1 text-xs hover:border-primary hover:bg-primary/5"
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
