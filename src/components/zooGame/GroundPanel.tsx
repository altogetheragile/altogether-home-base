import { Heart, Lock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { groundOpen, groundPrice, cannotOpenGround, availableItems } from './engine';
import { plotOrder } from './parkZones';
import { FOCUS } from './ui/tokens';
import type { ZooGameState } from './types';

// ============= Buying the ground for another area =============
//
// The Product Owner's real argument, made into a button: another animal in the area we have, or the
// ground for the area we have not? It sits in refinement because that is where the Product Backlog's
// order is argued about, and the order is exactly what this decides - work in an area with no ground
// is not Ready, so opening ground is how a whole branch of the Product Backlog becomes plannable.
//
// It is paid for out of what the zoo is WORTH, not out of points and not out of anything the team
// did. A zoo earns its next area by being worth visiting, which is the only sentence in this game
// that connects an outcome to an investment - and it is the sentence the whole value mechanism was
// built to be able to say.

export function GroundPanel({ state, onOpenGround }: {
  state: ZooGameState;
  onOpenGround?: (zone: string) => void;
}) {
  const open = groundOpen(state);
  const price = groundPrice();
  const areas = plotOrder(state).filter((z) => !open.includes(z));
  if (!areas.length) return null;

  const worth = state.value ?? 0;
  const waiting = (zone: string) => availableItems(state).filter((it) => it.zone === zone).length;

  return (
    <section data-part="ground" className="space-y-2 rounded-lg border border-border bg-card px-3 py-2.5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-sm font-bold">
          <MapPin className="h-4 w-4 text-primary" /> Ground the zoo does not have yet
        </h3>
        <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
          <Heart className="h-3.5 w-3.5" aria-hidden /> {worth.toLocaleString()}
          <span className="font-normal text-muted-foreground">to spend</span>
        </span>
      </div>
      <p className="text-[11px] leading-snug text-muted-foreground">
        The first area is the one the zoo was given. Every one after it is earned: ground costs what
        the zoo is worth to the people who come, so growing is paid for by being good. Work in an
        area with no ground is not Ready to plan.
      </p>
      <ul className="space-y-1.5">
        {areas.map((zone) => {
          const why = cannotOpenGround(state, zone);
          const short = Math.max(0, price - worth);
          return (
            <li key={zone} data-part="ground-area" data-zone={zone}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-dashed border-border px-2.5 py-1.5">
              <span className="flex items-center gap-1.5 text-sm">
                {why ? <Lock className="h-3.5 w-3.5 text-muted-foreground" /> : <MapPin className="h-3.5 w-3.5 text-primary" />}
                <b className="font-semibold">{zone}</b>
                <span className="text-[11px] text-muted-foreground">
                  {waiting(zone) > 0 ? `${waiting(zone)} item${waiting(zone) === 1 ? '' : 's'} waiting on it` : 'nothing waiting on it yet'}
                </span>
              </span>
              <span className="flex items-center gap-2">
                <span className={cn('text-xs font-semibold tabular-nums', short > 0 ? 'text-muted-foreground' : 'text-emerald-700 dark:text-emerald-400')}>
                  {price.toLocaleString()}
                  {short > 0 && <span className="ml-1 font-normal">· {short.toLocaleString()} short</span>}
                </span>
                <Button size="sm" className={cn(FOCUS)} disabled={!!why || !onOpenGround}
                  title={why ?? `Open the ${zone}, out of what the zoo is worth`}
                  onClick={() => onOpenGround?.(zone)}>
                  Open this ground
                </Button>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
