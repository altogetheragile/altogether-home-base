import type { ZooGameState, BacklogItem } from './types';
import { openZoo } from './engine';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Hammer, DoorOpen, Check } from 'lucide-react';

interface SprintBoardProps {
  state: ZooGameState;
  onBuild: (id: string) => void;
  onOpen: (id: string) => void;
  onReview: () => void;
}

/** The Sprint board: build each committed item to the Definition of Done, then open
 *  (release) it to visitors whenever you like. Releasing is not the Review. */
export function SprintBoard({ state, onBuild, onOpen, onReview }: SprintBoardProps) {
  const committed = state.backlog.filter((it) => it.sprintNumber === state.sprintNumber && (it.status === 'committed' || it.status === 'done' || it.status === 'open'));
  const open = openZoo(state);

  const StatusButton = ({ it }: { it: BacklogItem }) => {
    if (it.status === 'committed') return <Button size="sm" onClick={() => onBuild(it.id)}><Hammer className="mr-1.5 h-3.5 w-3.5" /> Build</Button>;
    if (it.status === 'done') return <Button size="sm" variant="outline" onClick={() => onOpen(it.id)}><DoorOpen className="mr-1.5 h-3.5 w-3.5" /> Open to visitors</Button>;
    return <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400"><Check className="h-4 w-4" /> Open</span>;
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 pb-28 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Sprint {state.sprintNumber}</h1>
        <span className="text-xs text-muted-foreground">{open.length} exhibit{open.length === 1 ? '' : 's'} and amenities open to visitors</span>
      </div>

      <p className="rounded-lg border border-border bg-muted/30 px-4 py-2.5 text-sm text-muted-foreground">
        Build each item to the Definition of Done, then open it to visitors. You can open Done work at any
        time - you do not have to wait for the Review.
      </p>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">This Sprint's work</h2>
        <div className="space-y-1.5">
          {committed.map((it) => (
            <div key={it.id} className={cn('flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2', it.status === 'open' && 'bg-emerald-50/50 dark:bg-emerald-950/20')}>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{it.name}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{it.zone}</span>
                  <span className="font-mono text-xs text-muted-foreground">{it.estimate} pts</span>
                </div>
                {it.status === 'committed' && <div className="text-[11px] text-muted-foreground">Not built yet - meet: {it.acceptance.join(', ')}</div>}
              </div>
              <StatusButton it={it} />
            </div>
          ))}
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-4 z-20 mx-auto flex w-fit items-center gap-3 rounded-full border border-border bg-background/95 px-5 py-2.5 shadow-lg backdrop-blur">
        <span className="text-xs font-medium text-muted-foreground">Definition of Done: {state.definitionOfDone.length} criteria</span>
        <Button size="sm" onClick={onReview}>End Sprint &rarr; Review</Button>
      </div>
    </div>
  );
}
