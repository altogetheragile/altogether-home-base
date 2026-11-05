import type { ZooGameState, ChatMessage } from './types';
import { handover } from './handover';
import { Bubble } from './TeamChat';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Priya handing the step over, as a line in the team's chat, with what she asks pinned under it
 *  as the "needs you" card. Nothing, on a step she has nothing to hand over. See `handover.ts`. */
export function PriyaHandover({ state, className, children }: {
  state: ZooGameState;
  className?: string;
  /** What the move is done with, inside the card that asks for it rather than somewhere below it. */
  children?: ReactNode;
}) {
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
      {/* White, in the ink everything is drawn in, with a hard shadow: the one sheet on the page that
          is lighter and sharper than what is round it. It was a peach card with an orange edge on a
          page that was cream, tan and orange already, so it did not stand out: "it still doesn't
          pop." It pulses when the move changes, as a game marks something new, and not for anyone
          who has asked for less motion. */}
      <div key={h.key} data-part="needs-you" className="zoo-attention rounded-lg border-2 border-[hsl(var(--zoo-ink))] bg-white px-3 py-2.5 shadow-[4px_4px_0_hsl(var(--zoo-ink))]">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
            Your move
          </span>
          {h.progress && <span data-part="needs-you-progress" className="ml-auto text-[11px] font-medium text-muted-foreground">{h.progress}</span>}
        </div>
        <p className="mt-1 text-sm font-medium leading-snug">{h.asks}</p>
        {children && <div data-part="needs-you-body" className="mt-2">{children}</div>}
      </div>
    </section>
  );
}
