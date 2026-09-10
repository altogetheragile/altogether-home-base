import { cn } from '@/lib/utils';
import { FOCUS } from './ui/tokens';
import { RotateCw } from 'lucide-react';

/** Which side of the park you are looking from, in the order a quarter-turn takes you. */
export const SIDES = ['Front', 'Left', 'Behind', 'Right'] as const;

/** Walking round the park.
 *
 *  A picture of a zoo owes you two things - how close, and from which side - and something at the
 *  back of a habitat is not visible from the front. Quarter-turns only, because every prop is drawn
 *  from one fixed angle: at 37 degrees the trees, the cars and the animals would all face the wrong
 *  way.
 *
 *  Its own component because it is offered in two places now - on the Increment tab, beside the
 *  zoom, and on the Review's picture, which is where somebody is presenting the thing to a room and
 *  most wants to turn it. Two of these would have drifted apart by the second report.
 */
export function TurnControl({ turn, onTurn, className }: {
  turn: number;
  onTurn: (turn: number) => void;
  className?: string;
}) {
  const side = SIDES[((turn % 4) + 4) % 4];
  return (
    <button type="button" data-part="turn-park" onClick={() => onTurn((turn + 1) % 4)}
      title="Walk round the park - a quarter turn each press"
      aria-label={`Turn the park a quarter - now looking from ${side.toLowerCase() === 'behind' ? 'behind' : `the ${side.toLowerCase()}`}`}
      className={cn(FOCUS, 'flex items-center gap-1 rounded-md border border-border bg-background/90 px-1.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground',
        className)}>
      <RotateCw className="h-3.5 w-3.5" />
      {side}
    </button>
  );
}
