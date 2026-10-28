import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { ZooGameState } from './types';
import { playableCards, asPlayed, type PlayedCard } from './trainerCards';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SURFACE, PADDING, TEXT, EYEBROW, TONE, FOCUS } from './ui/tokens';

// The trainer's hand.
//
// Only a participant the host granted `can_facilitate` sees it. It sits in a corner of the shared
// game rather than on a screen of its own, because the trainer plays a card while watching the
// team work, and a card played from somewhere else is a card played blind. It sits under the events:
// the Daily Scrum is a modal, and a click outside one closes it, so a card is played during the day
// and waits for the next Daily Scrum.

export function TrainerDeck({ state, onPlay, onSetLed, className }: {
  state: ZooGameState;
  onPlay: (card: PlayedCard) => void;
  onSetLed: (on: boolean) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const inSprint = state.phase === 'sprint';
  const queued = state.trainerCard;
  const led = !!state.trainerLed;

  return (
    <section data-part="trainer-deck" aria-label="Trainer cards"
      className={cn(SURFACE.card, 'fixed bottom-4 left-4 z-30 w-[min(22rem,calc(100vw-2rem))]', className)}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}
        className={cn(FOCUS, PADDING.default, 'flex w-full items-center justify-between gap-2 text-left')}>
        <span>
          <span className={cn(EYEBROW, TONE.action.text)}>Trainer</span>
          <span className={cn(TEXT.lead, 'block')}>Cards to play</span>
          {!open && queued && <span className={cn(TEXT.micro, TONE.attention.text, 'block')}>One waiting for the Daily Scrum</span>}
        </span>
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
      </button>
      {open && (
        <div className={cn(PADDING.default, 'space-y-2 border-t border-border pt-2')}>
          <div className="flex items-start justify-between gap-2">
            <p data-part="trainer-chance" className={cn(TEXT.micro, 'text-muted-foreground')}>
              {led
                ? 'Chance is off. Only your cards get in the team’s way.'
                : 'Chance is on: something may turn up at any Daily Scrum. Playing a card turns it off.'}
            </p>
            <button type="button" onClick={() => onSetLed(!led)}
              className={cn(FOCUS, TEXT.micro, 'shrink-0 font-semibold text-primary underline underline-offset-2')}>
              {led ? 'Turn chance on' : 'Turn chance off'}
            </button>
          </div>
          {queued && (
            <p data-part="trainer-queued" className={cn(TONE.attention.soft, TEXT.micro, 'rounded-md border px-2 py-1')}>
              Waiting for the next Daily Scrum: <span className="font-semibold">{queued.title}</span>
            </p>
          )}
          <ul className="space-y-1.5">
            {playableCards().map((c) => (
              <li key={c.id} data-card={c.id} className={cn(SURFACE.inset, 'px-2.5 py-2')}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className={cn(TEXT.small, 'font-semibold')}>{c.title}</p>
                    <p className={cn(TEXT.micro, 'text-muted-foreground')}>
                      {c.kind === 'decision' ? 'Goes to the Product Owner now' : `Lands on the ${c.landsOn}, at the next Daily Scrum`}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" disabled={!inSprint} onClick={() => onPlay(asPlayed(c))}>Play</Button>
                </div>
                <p className={cn(TEXT.micro, 'mt-1')}>{c.lesson}</p>
              </li>
            ))}
          </ul>
          {!inSprint && (
            <p className={cn(TEXT.micro, 'text-muted-foreground')}>Cards are played during a Sprint.</p>
          )}
        </div>
      )}
    </section>
  );
}
