import { useState } from 'react';
import type { Workflow, StageDef, WorkerDef, Specialism } from './types';
import { DEFAULT_WORKFLOW, stageColor, normalizeWorkers, defaultExitCriteria, nextCriterionId } from './config';
import { TeamMemberList } from './TeamMemberList';
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

/** A hyphen-free unique stage id — column ids are `${stageId}-active`, and
 *  stageOf() splits on the first hyphen, so a stage id must not contain one. */
function nextStageId(existing: StageDef[]): Specialism {
  const ids = new Set(existing.map((s) => s.id));
  let n = existing.length + 1;
  while (ids.has(`stage${n}`)) n++;
  return `stage${n}`;
}

const cloneStage = (s: StageDef): StageDef => ({ ...s, exitCriteria: s.exitCriteria.map((c) => ({ ...c })) });
const cloneWorkflow = (wf: Workflow): Workflow => ({
  stages: wf.stages.map(cloneStage),
  workers: wf.workers.map((w) => ({ ...w })),
});

export function WorkflowEditor({ workflow, onSave }: WorkflowEditorProps) {
  const [open, setOpen] = useState(false);
  const [stages, setStages] = useState<StageDef[]>(() => workflow.stages.map(cloneStage));
  const [workers, setWorkers] = useState<WorkerDef[]>(() => workflow.workers.map((w) => ({ ...w })));

  // Re-seed the draft from the current workflow each time the dialog opens, so a
  // cancelled edit is discarded and a re-open starts from what is actually in play.
  const handleOpenChange = (next: boolean) => {
    if (next) {
      setStages(workflow.stages.map(cloneStage));
      setWorkers(workflow.workers.map((w) => ({ ...w })));
    }
    setOpen(next);
  };

  const renameStage = (id: string, name: string) =>
    setStages((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)));
  const removeStage = (id: string) => setStages((prev) => (prev.length > 1 ? prev.filter((s) => s.id !== id) : prev));
  const addStage = () =>
    setStages((prev) => {
      const id = nextStageId(prev);
      return [...prev, { id, name: `Stage ${prev.length + 1}`, exitCriteria: defaultExitCriteria(id) }];
    });

  // Exit-criteria editing (the "write your own" exercise).
  const addCriterion = (stageId: string) =>
    setStages((prev) => prev.map((s) => (s.id === stageId
      ? { ...s, exitCriteria: [...s.exitCriteria, { id: nextCriterionId(stageId, s.exitCriteria), label: '' }] }
      : s)));
  const renameCriterion = (stageId: string, cid: string, label: string) =>
    setStages((prev) => prev.map((s) => (s.id === stageId
      ? { ...s, exitCriteria: s.exitCriteria.map((c) => (c.id === cid ? { ...c, label } : c)) }
      : s)));
  const removeCriterion = (stageId: string, cid: string) =>
    setStages((prev) => prev.map((s) => (s.id === stageId
      ? { ...s, exitCriteria: s.exitCriteria.filter((c) => c.id !== cid) }
      : s)));
  const moveStage = (index: number, dir: -1 | 1) =>
    setStages((prev) => {
      const to = index + dir;
      if (to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[to]] = [next[to], next[index]];
      return next;
    });

  const resetToDefault = () => {
    const def = cloneWorkflow(DEFAULT_WORKFLOW);
    setStages(def.stages);
    setWorkers(def.workers);
  };

  const handleSave = () => {
    // Normalise: non-empty names, fresh initials, and every worker pinned to a
    // stage that still exists (its stage may have been deleted mid-edit).
    const cleanStages: StageDef[] = stages.map((s, i) => ({
      id: s.id,
      name: s.name.trim() || `Stage ${i + 1}`,
      exitCriteria: s.exitCriteria.map((c) => ({ id: c.id, label: c.label.trim() })).filter((c) => c.label),
    }));
    const cleanWorkers = normalizeWorkers(workers, cleanStages);
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
          <div className="space-y-2">
            {stages.map((s, i) => (
              <div key={s.id} className="rounded-md border border-border p-2 space-y-1.5">
                <div className="flex items-center gap-2">
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

                {/* Exit criteria — the quality bar to leave this stage (write your own). */}
                <div className="space-y-1 pl-5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Exit criteria</span>
                    <button type="button" onClick={() => addCriterion(s.id)}
                      className="inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-xs text-muted-foreground hover:bg-muted">
                      <Plus className="h-3 w-3" /> criterion
                    </button>
                  </div>
                  {s.exitCriteria.length === 0 && (
                    <p className="text-[11px] text-muted-foreground/60">No exit criteria — work can leave this stage freely.</p>
                  )}
                  {s.exitCriteria.map((c, ci) => (
                    <div key={c.id} className="flex items-center gap-1.5">
                      <span className="text-muted-foreground/50 text-xs shrink-0">✓</span>
                      <Input
                        value={c.label}
                        onChange={(e) => renameCriterion(s.id, c.id, e.target.value)}
                        placeholder={`Criterion ${ci + 1}`}
                        className="h-7 text-sm"
                        aria-label={`${s.name} exit criterion ${ci + 1}`}
                      />
                      <button type="button" onClick={() => removeCriterion(s.id, c.id)}
                        className="shrink-0 rounded p-1 text-destructive hover:bg-destructive/10" aria-label={`Remove criterion ${ci + 1} from ${s.name}`}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Team */}
        <TeamMemberList workers={workers} stages={stages} onChange={setWorkers} />

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
