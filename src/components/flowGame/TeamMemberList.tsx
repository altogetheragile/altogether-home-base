import type { StageDef, WorkerDef, Specialism } from './types';
import { stageColor, toInitials, makeWorker } from './config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Plus, Trash2 } from 'lucide-react';

interface TeamMemberListProps {
  workers: WorkerDef[];
  stages: StageDef[];
  onChange: (workers: WorkerDef[]) => void;
}

/** The editable team section — add / rename / reassign / remove members — shared
 *  by the intro workflow editor and the in-game "Edit team" dialog. */
export function TeamMemberList({ workers, stages, onChange }: TeamMemberListProps) {
  const rename = (id: string, name: string) => onChange(workers.map((w) => (w.id === id ? { ...w, name } : w)));
  const setStage = (id: string, specialism: Specialism) =>
    onChange(workers.map((w) => (w.id === id ? { ...w, specialism } : w)));
  const remove = (id: string) => onChange(workers.length > 1 ? workers.filter((w) => w.id !== id) : workers);
  const add = () => onChange([...workers, makeWorker(workers, stages)]);

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Team</h3>
        <Button variant="ghost" size="sm" onClick={add}>
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
              onChange={(e) => rename(w.id, e.target.value)}
              placeholder={`Teammate ${i + 1}`}
              className="h-8"
              aria-label={`Teammate ${i + 1} name`}
            />
            <select
              value={w.specialism}
              onChange={(e) => setStage(w.id, e.target.value)}
              className="h-8 shrink-0 rounded-md border border-input bg-background px-2 text-sm"
              aria-label={`${w.name} specialism`}
            >
              {stages.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <button type="button" onClick={() => remove(w.id)} disabled={workers.length <= 1}
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
  );
}
