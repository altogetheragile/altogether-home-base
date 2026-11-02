import type { ZooGameState, ChatMessage } from './types';
import { handover } from './handover';
import { Bubble } from './TeamChat';
import { cn } from '@/lib/utils';

/** Priya handing the step over, as a line in the team's chat, with what she asks pinned under it
 *  as the "needs you" card. Nothing, on a step she has nothing to hand over. See `handover.ts`. */
export function PriyaHandover({ state, className }: { state: ZooGameState; className?: string }) {
  const h = handover(state);
  if (!h) return null;
  const msg: ChatMessage = { id: `handover-${h.key}`, who: 'product_owner', from: state.team.productOwner.name, text: h.says, day: state.dayNumber };
  return (
    <section data-part="handover" data-step={h.key} className={cn('space-y-2', className)}>
      <ul className="flex flex-col">
        <Bubble msg={msg} />
      </ul>
      {/* Drawn as the rail draws what needs you, because it is the same kind of thing: a solid card,
          labelled, that stays until it is done. Everybody in a shared game is on the Scrum Team, so
          it is everybody's move. */}
      <div data-part="needs-you" className="rounded-lg border-2 border-primary bg-primary/[0.07] px-3 py-2 shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
            Your move
          </span>
          {h.progress && <span data-part="needs-you-progress" className="ml-auto text-[11px] font-medium text-muted-foreground">{h.progress}</span>}
        </div>
        <p className="mt-1 text-sm font-medium leading-snug">{h.asks}</p>
      </div>
    </section>
  );
}
