import { cn } from '@/lib/utils';
import { EYEBROW } from './ui/tokens';
import { BoardIcon, BOARD } from './board/BoardIcon';

/** The Product Goal, at the head of the Product Backlog it is the commitment of.
 *
 *  It sat in the strip above the screen, one line of small type beside the seats, and in a box on
 *  the Product Backlog tab only: "the product goal is still basically invisible on the screen. Can
 *  we move it so it's at the top of the product backlog because it is the commitment for the
 *  product backlog" (Al, 25 November 2026). So it is drawn as part of the list itself, on every
 *  screen the list is on. In Priya's orange, with the label in ink so it can be read: it is the
 *  Product Owner's, and the game's blue is for the move waiting on you, which this is not. */
export function ProductGoalBar({ goal, className }: { goal: string; className?: string }) {
  const text = goal.trim();
  return (
    <div data-part="product-goal"
      className={cn('rounded-lg border-2 border-[hsl(var(--zoo-po))] bg-[hsl(var(--zoo-po)/0.10)] px-3 py-2', className)}>
      <div className={cn(EYEBROW, 'flex flex-wrap items-center gap-x-1.5 text-foreground')}>
        <BoardIcon name={BOARD.productGoal} className="h-3.5 w-3.5" /> Product Goal
        <span className="font-normal normal-case tracking-normal text-muted-foreground">commitment of the Product Backlog</span>
      </div>
      <p data-part="product-goal-text" className={cn('text-base leading-snug', text ? 'font-semibold' : 'text-sm text-muted-foreground')}>
        {text || 'No Product Goal set yet. It is the long-term objective the Product Backlog is ordered towards.'}
      </p>
    </div>
  );
}
