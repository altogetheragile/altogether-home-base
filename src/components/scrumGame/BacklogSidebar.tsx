import type { ScrumState } from './types';
import { availableStories } from './engine';
import { isReady, isSplittable, REFINE_MAX } from './config';
import { Plus, Scissors, AlertTriangle } from 'lucide-react';

interface BacklogSidebarProps {
  state: ScrumState;
  /** Pull a Ready item onto the Sprint board (renegotiate scope with the PO). */
  onAddToSprint: (storyId: string) => void;
  /** Split a too-big item - ongoing refinement, done during the Sprint. */
  onSplitStory: (storyId: string) => void;
  disabled?: boolean;
}

/** The Product Backlog, always on the right - pull Ready items onto the board, and
 *  refine (split) the too-big ones here, during the Sprint, so they become Ready
 *  for a future Sprint. Refinement is continuous; it does not belong in Planning. */
export function BacklogSidebar({ state, onAddToSprint, onSplitStory, disabled }: BacklogSidebarProps) {
  const items = availableStories(state);

  return (
    <section className="rounded-lg border border-border bg-muted/20 p-3">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold">Product Backlog</h2>
        <span className="font-mono text-[11px] text-muted-foreground">{items.length}</span>
      </div>
      <p className="mb-2 text-[11px] text-muted-foreground">Pull a Ready item onto the board. Refine big ones (over {REFINE_MAX}) by splitting - ongoing work, but mid-Sprint it takes a little of the team's time from the next day.</p>
      <div className="space-y-1.5">
        {items.length === 0 && <p className="text-xs text-muted-foreground/60">The Backlog is empty.</p>}
        {items.map((s) =>
          isReady(s.points) ? (
            <button
              key={s.id}
              type="button"
              disabled={disabled}
              onClick={() => onAddToSprint(s.id)}
              className="flex w-full items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1.5 text-left text-sm hover:border-primary hover:bg-primary/5 disabled:opacity-50"
              title="Pull onto the Sprint board"
            >
              <Plus className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="flex-1 truncate">{s.title}</span>
              <span className="shrink-0 font-mono text-xs text-muted-foreground">{s.points}</span>
            </button>
          ) : (
            <button
              key={s.id}
              type="button"
              disabled={disabled || !isSplittable(s.points)}
              onClick={() => onSplitStory(s.id)}
              className="flex w-full items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-left text-sm hover:bg-amber-100 disabled:opacity-60 dark:border-amber-800/50 dark:bg-amber-950/30"
              title="Too big to be Ready - split it (refinement)"
            >
              <Scissors className="h-3.5 w-3.5 shrink-0 text-amber-700 dark:text-amber-400" />
              <span className="flex-1 truncate">{s.title}</span>
              <span className="flex shrink-0 items-center gap-1 text-[10px] font-medium text-amber-700 dark:text-amber-400"><AlertTriangle className="h-3 w-3" /> split</span>
              <span className="shrink-0 font-mono text-xs">{s.points}</span>
            </button>
          ),
        )}
      </div>
    </section>
  );
}
