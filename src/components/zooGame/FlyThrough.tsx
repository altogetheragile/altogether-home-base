import type { ReactNode } from 'react';
import type { ZooGameState } from './types';
import { useWalkThrough } from './useWalkThrough';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FOCUS } from './ui/tokens';
import { Footprints, X } from 'lucide-react';

// ============= The walk through the Increment =============
//
// "Here is what we built" is the whole point of the Sprint Review, and a still drawing of a park is
// something everybody leans in and squints at. So the park walks you round it: in at the gate, then
// each thing this Sprint delivered, in the order a visitor coming through the gate would meet it.
//
// It follows a visitor, not a list. That is the difference worth having: something delivered that
// nobody can walk to is still a stop on the tour, and the caption says so. A Sprint that finished
// five things behind a river with no bridge looks finished on the board. The walk is where it stops
// looking finished.
//
// One component, used on the Increment tab and at the Review, because it is the same walk - and
// because two of these would drift apart by the second report.

export function FlyThrough({ state, className, children }: {
  state: ZooGameState;
  className?: string;
  /** The picture, given where the camera is looking. Nothing here draws a park. */
  children: (camera: { x: number; y: number; zoom: number } | null) => ReactNode;
}) {
  const walk = useWalkThrough(state);

  return (
    <div data-part="fly-through" className={cn('relative', className)}>
      {children(walk.camera)}

      {walk.ready && (
        <div className="absolute right-2 top-2 z-20">
          {walk.walking ? (
            <Button size="sm" variant="secondary" data-part="walk-stop"
              className={cn(FOCUS, 'h-7 gap-1 px-2 text-xs shadow-sm')} onClick={walk.end}>
              <X className="h-3.5 w-3.5" /> Stop
            </Button>
          ) : (
            <Button size="sm" variant="secondary" data-part="walk-start"
              className={cn(FOCUS, 'h-7 gap-1 px-2 text-xs shadow-sm')} onClick={walk.start}
              title="Walk the zoo the way a visitor would, stopping at everything this Sprint delivered">
              <Footprints className="h-3.5 w-3.5" /> Walk it
            </Button>
          )}
        </div>
      )}

      {/* What you are looking at, over the picture rather than beside it: at the Review the room is
          watching the park, and a caption they have to look away to read is a caption nobody reads. */}
      {walk.showing && (
        <div data-part="walk-caption"
          className="pointer-events-none absolute inset-x-2 bottom-2 z-20 flex justify-center">
          <div className={cn('max-w-full rounded-lg border px-3 py-1.5 text-center shadow-md backdrop-blur',
            walk.showing.visitable
              ? 'border-border bg-background/95'
              : 'border-amber-500/50 bg-amber-50/95 dark:bg-amber-950/90')}>
            <p className="truncate text-sm font-semibold">{walk.showing.caption}</p>
            <p className={cn('text-[11px]',
              walk.showing.visitable ? 'text-muted-foreground' : 'text-amber-700 dark:text-amber-300')}>
              {walk.showing.why}
            </p>
            {/* Where you are in the walk, so it is a tour with an end rather than a screensaver. */}
            <p className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
              {walk.at + 1} of {walk.total}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
