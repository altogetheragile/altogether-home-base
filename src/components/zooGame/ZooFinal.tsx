import type { ZooGameState } from './types';
import { openZoo, productGoalProgress } from './engine';
import { Button } from '@/components/ui/button';
import { ActionBar } from './ActionBar';
import { PADDING, SURFACE, TEXT } from './ui/tokens';
import { cn } from '@/lib/utils';

interface ZooFinalProps {
  state: ZooGameState;
  onReset: () => void;
}

/** Wrap-up: a snapshot of the zoo you built and how it ran.
 *
 *  Two endings, because there are two ways to get here. The Product Owner may judge the Product Goal
 *  met, and they may also stop while it plainly is not - "end it here anyway" is offered at the
 *  Review, and stopping is a real decision a Product Owner gets to make. This screen used to
 *  congratulate both of them in the same words: "You reached the Product Goal in N Sprints", said to
 *  somebody who had just decided they had not. A game that lies at the end teaches nothing about the
 *  Sprint before it. */
export function ZooFinal({ state, onReset }: ZooFinalProps) {
  const r = state.lastReview;
  const open = openZoo(state);
  const exhibits = open.filter((i) => i.category === 'exhibit').length;
  const amenities = open.filter((i) => i.category === 'amenity').length;
  // The same measure the Review shows and the same bar it offers "wrap up" on, so the ending cannot
  // disagree with the screen that reached it.
  const progress = Math.round(productGoalProgress(state) * 100);
  const met = progress >= 80;
  const sprints = `${state.sprintNumber} Sprint${state.sprintNumber === 1 ? '' : 's'}`;

  return (
    <div className="mx-auto flex h-full w-full max-w-2xl flex-col items-center justify-center gap-6 overflow-y-auto px-4 py-8 text-center">
      <div className="space-y-2">
        <h1 className={TEXT.hero}>{met ? 'Your zoo is open' : 'You called it here'}</h1>
        <p className="text-muted-foreground">
          {met
            ? `You reached the Product Goal in ${sprints}.`
            : `You stopped after ${sprints}, with the Product Goal ${progress}% of the way there. Knowing when to stop is the Product Owner's call too.`}
        </p>
      </div>
      <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Exhibits" value={`${exhibits}`} />
        <Stat label="Amenities" value={`${amenities}`} />
        <Stat label="Visitors" value={r ? r.totalAttendance.toLocaleString() : '0'} />
        <Stat label="Happiness" value={r ? `${r.overallHappiness}` : '0'} />
      </div>
      <p className="max-w-md text-sm text-muted-foreground">
        Velocity across the Sprints: {state.velocity.join(', ') || 'none'}.{' '}
        {met
          ? 'The visitors kept telling you what they valued - and you built a zoo around it.'
          : 'The visitors were still telling you what they valued. A Product Goal is abandoned as deliberately as it is met - and the next one starts from what this taught you.'}
      </p>
      <ActionBar><Button onClick={onReset}>Build another zoo &rarr;</Button></ActionBar>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className={cn(SURFACE.card, PADDING.roomy)}>
      <div className={TEXT.figure}>{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}
