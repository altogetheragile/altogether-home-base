import { useState } from 'react';
import type { Workflow, StageDef, WorkerDef, Specialism } from './types';
import { DEFAULT_WORKFLOW, stageColor, nextWorkerName } from './config';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Plus, Trash2, ArrowUp, ArrowDown, SlidersHorizontal, RotateCcw } from 'lucide-react';

interface WorkflowEditorProps {
  workflow: Workflow;
  onSave: (workflow: Workflow) => void;
}

/** Two-character badge for a worker: first letters of the first and last words
 *  for a multi-word name (so "Teammate 7" -> "T7", "Mary Jane" -> "MJ"), or the
 *  first two letters of a single word ("Alex" -> "AL"). Keeps badges distinct. */
const toInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/** A hyphen-free unique stage id — column ids are `${stageId}-active`, and
 *  stageOf() splits on the first hyphen, so a stage id must not contain one. */
function nextStageId(existing: StageDef[]): Specialism {
  const ids = new Set(existing.map((s) => s.id));
  let n = existing.length + 1;
  while (ids.has(`stage${n}`)) n++;
  return `stage${n}`;
}
function nextWorkerId(existing: WorkerDef[]): string {
  const ids = new Set(existing.map((w) => w.id));
  let n = existing.length + 1;
  while (ids.has(`w${n}`)) n++;
  return `w${n}`;
}

const cloneWorkflow = (wf: Workflow): Workflow => ({
  stages: wf.stages.map((s) => ({ ...s })),
  workers: wf.workers.map((w) => ({ ...w })),
});

export function WorkflowEditor({ workflow, onSave }: WorkflowEditorProps) {
  const [open, setOpen] = useState(false);
  const [stages, setStages] = useState<StageDef[]>(() => workflow.stages.map((s) => ({ ...s })));
  const [workers, setWorkers] = useState<WorkerDef[]>(() => workflow.workers.map((w) => ({ ...w })));

  // Re-seed the draft from the current workflow each time the dialog opens, so a
  // cancelled edit is discarded and a re-open starts from what is actually in play.
  const handleOpenChange = (next: boolean) => {
    if (next) {
      setStages(workflow.stages.map((s) => ({ ...s })));
      setWorkers(workflow.workers.map((w) => ({ ...w })));
    }
    setOpen(next);
  };

  const renameStage = (id: string, name: string) =>
    setStages((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)));
  const removeStage = (id: string) => setStages((prev) => (prev.length > 1 ? prev.filter((s) => s.id !== id) : prev));
  const addStage = () => setStages((prev) => [...prev, { id: nextStageId(prev), name: `Stage ${prev.length + 1}` }]);
  const moveStage = (index: number, dir: -1 | 1) =>
    setStages((prev) => {
      const to = index + dir;
      if (to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[to]] = [next[to], next[index]];
      return next;
    });

  const renameWorker = (id: string, name: string) =>
    setWorkers((prev) => prev.map((w) => (w.id === id ? { ...w, name } : w)));
  const setWorkerStage = (id: string, specialism: Specialism) =>
    setWorkers((prev) => prev.map((w) => (w.id === id ? { ...w, specialism } : w)));
  const removeWorker = (id: string) => setWorkers((prev) => (prev.length > 1 ? prev.filter((w) => w.id !== id) : prev));
  const addWorker = () =>
    setWorkers((prev) => {
      const name = nextWorkerName(prev);
      return [
        ...prev,
        { id: nextWorkerId(prev), name, initials: toInitials(name), specialism: stages[0]?.id ?? 'stage1' },
      ];
    });

  const resetToDefault = () => {
    const def = cloneWorkflow(DEFAULT_WORKFLOW);
    setStages(def.stages);
    setWorkers(def.workers);
  };

  const handleSave = () => {
    // Normalise: non-empty names, fresh initials, and every worker pinned to a
    // stage that still exists (its stage may have been deleted mid-edit).
    const cleanStages: StageDef[] = stages.map((s, i) => ({ id: s.id, name: s.name.trim() || `Stage ${i + 1}` }));
    const stageIds = new Set(cleanStages.map((s) => s.id));
    const fallback = cleanStages[0]?.id ?? 'stage1';
    const cleanWorkers: WorkerDef[] = workers.map((w, i) => {
      const name = w.name.trim() || `Teammate ${i + 1}`;
      return {
        id: w.id,
        name,
        initials: toInitials(name),
        specialism: stageIds.has(w.specialism) ? w.specialism : fallback,
      };
    });
    onSave({ stages: cleanStages, workers: cleanWorkers });
    setOpen(false);
  };

  const isDefault =
    JSON.stringify(stages) === JSON.stringify(DEFAULT_WORKFLOW.stages) &&
    JSON.stringify(workers) === JSON.stringify(DEFAULT_WORKFLOW.workers);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <SlidersHorizontal className="mr-1.5 h-4 w-4" /> Customise the board
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customise the board</DialogTitle>
          <DialogDescription>
            Shape the workflow to match your team: name the stages your work flows through,
            and set who is on the team and where each person specialises.
          </DialogDescription>
        </DialogHeader>

        {/* Stages */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Stages <span className="font-normal text-muted-foreground">(in order)</span></h3>
            <Button variant="ghost" size="sm" onClick={addStage}>
              <Plus className="mr-1 h-4 w-4" /> Add stage
            </Button>
          </div>
          <div className="space-y-1.5">
            {stages.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2">
                <span className={cn('h-3 w-3 shrink-0 rounded-sm', stageColor(s.id, stages))} aria-hidden />
                <Input
                  value={s.name}
                  onChange={(e) => renameStage(s.id, e.target.value)}
                  placeholder={`Stage ${i + 1}`}
                  className="h-8"
                  aria-label={`Stage ${i + 1} name`}
                />
                <div className="flex shrink-0 items-center gap-0.5">
                  <button type="button" onClick={() => moveStage(i, -1)} disabled={i === 0}
                    className="rounded p-1 hover:bg-muted disabled:opacity-30" aria-label={`Move ${s.name} earlier`}>
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => moveStage(i, 1)} disabled={i === stages.length - 1}
                    className="rounded p-1 hover:bg-muted disabled:opacity-30" aria-label={`Move ${s.name} later`}>
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => removeStage(s.id)} disabled={stages.length <= 1}
                    className="rounded p-1 text-destructive hover:bg-destructive/10 disabled:opacity-30" aria-label={`Remove ${s.name}`}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Team */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Team</h3>
            <Button variant="ghost" size="sm" onClick={addWorker}>
              <Plus className="mr-1 h-4 w-4" /> Add teammate
            </Button>
          </div>
          <div className="space-y-1.5">
            {workers.map((w, i) => (
              <div key={w.id} className="flex items-center gap-2">
                <span
                  className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white', stageColor(w.specialism, stages))}
                  aria-hidden
                >
                  {toInitials(w.name)}
                </span>
                <Input
                  value={w.name}
                  onChange={(e) => renameWorker(w.id, e.target.value)}
                  placeholder={`Teammate ${i + 1}`}
                  className="h-8"
                  aria-label={`Teammate ${i + 1} name`}
                />
                <select
                  value={w.specialism}
                  onChange={(e) => setWorkerStage(w.id, e.target.value)}
                  className="h-8 shrink-0 rounded-md border border-input bg-background px-2 text-sm"
                  aria-label={`${w.name} specialism`}
                >
                  {stages.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <button type="button" onClick={() => removeWorker(w.id)} disabled={workers.length <= 1}
                  className="shrink-0 rounded p-1 text-destructive hover:bg-destructive/10 disabled:opacity-30" aria-label={`Remove ${w.name}`}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            A specialist works their own stage at full effectiveness, and any other stage at 60%.
          </p>
        </section>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="ghost" size="sm" onClick={resetToDefault} disabled={isDefault}>
            <RotateCcw className="mr-1.5 h-4 w-4" /> Reset to default
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save workflow</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
