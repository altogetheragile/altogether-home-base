import type { ZooGameState, HuddleAnswer } from './types';
import { huddleProposal, sprintProgress, goalPulse } from './engine';
import { Bubble } from './TeamChat';
import { HUDDLE_SECONDS } from './config';
import { cn } from '@/lib/utils';
import { FOCUS, SURFACE, PADDING, TONE } from './ui/tokens';
import { AlertTriangle } from 'lucide-react';

// The two minutes after the Daily Scrum.
//
// The Daily Scrum is the Developers' event and the Product Owner is not in it. So when the Sprint
// Goal is at risk, the Developers can see it, say it, and do nothing about it in the room: what
// the Sprint promises is hers, and she is not there. The screen used to put the scope decision in
// the event anyway, with a button that dropped an item while the one person it most concerned was
// somewhere else.
//
// So the flag is raised in the room and the decision is made out of it, with Priya - which is both
// what the Guide's division of accountabilities implies and what actually happens in a team.
//
// It is not an event. It is unscheduled, it costs a slice of the day rather than a timebox, and
// you can walk away from it. Walking away is free and is written down, because the conversation
// genuinely did not happen.

export function Huddle({ state, onAnswer }: {
  state: ZooGameState;
  onAnswer: (how: HuddleAnswer) => void;
}) {
  const { says, candidate, answers } = huddleProposal(state);
  const prog = sprintProgress(state);
  const pulse = goalPulse(state);
  const daysLeft = Math.max(0, state.sprintDays - state.dayNumber + 1);

  return (
    <div className="space-y-3" data-part="huddle">
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn('inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold',
          TONE.attention.soft, TONE.attention.text)}>
          <AlertTriangle className="h-3.5 w-3.5" /> A word with the Product Owner
        </span>
        {/* Named as what it is not, because that is the teaching. The Guide has three events inside
            a Sprint and this is none of them: it is the conversation a team has when something
            comes up, and the game is careful not to dress it as an event with a timebox. */}
        <span className="text-[11px] text-muted-foreground">
          not an event &middot; costs {HUDDLE_SECONDS}s of today &middot; not in the Scrum Guide
        </span>
      </div>

      <div>
        <h1 className="text-2xl font-bold leading-tight tracking-tight">The Sprint Goal is at risk</h1>
        <p className="text-sm text-muted-foreground">
          You flagged it at the Daily Scrum and left it there, because the Product Owner was not in the room.
          She is now. What the Sprint promises is hers; the Sprint Backlog is yours. This is where those two meet.
        </p>
      </div>

      {/* The arithmetic, said once. It is the same pulse the strip shows, so the board and the
          room never disagree about whether the Goal is safe. */}
      <div className={cn(SURFACE.card, PADDING.default, 'text-sm')} data-part="huddle-figures">
        <span className={cn(TONE.attention.text, 'font-semibold')}>{pulse.line}</span>
        <span className="text-muted-foreground">
          {' '}&middot; {prog.remaining} point{prog.remaining === 1 ? '' : 's'} left over {daysLeft} day{daysLeft === 1 ? '' : 's'}.
        </span>
      </div>

      {/* Priya, proposing. Her line is the board's own arithmetic rather than an opinion, and she
          is drawn as herself - this is a conversation, not a dialog box with a face on it.
          The bubble signs itself, so there is no name over the top of it as well. */}
      <div className={cn(SURFACE.card, PADDING.default)}>
        <ul className="flex flex-col gap-2">
          <Bubble msg={{ id: 'huddle-proposal', who: 'product_owner', from: state.team.productOwner.name,
            text: says, day: state.dayNumber, itemId: candidate?.id }} />
        </ul>
      </div>

      {/* What the Developers can answer. The Sprint Goal is not among them: it is the commitment,
          and a game that offers to drop it the moment it gets hard has taught that a commitment is
          a preference. */}
      <div data-part="huddle-answers" className="grid gap-2 sm:grid-cols-3">
        {answers.map((a) => (
          <button key={a.how} type="button" onClick={() => onAnswer(a.how)}
            className={cn(FOCUS, 'rounded-lg border border-border bg-card px-3 py-2 text-left transition-colors hover:border-primary/50')}>
            <span className="block text-sm font-semibold">{a.label}</span>
            <span className="block text-[11px] text-muted-foreground">{a.cost}</span>
          </button>
        ))}
      </div>

      {/* Said plainly, because it is the one thing a learner should take away from this screen. */}
      <p data-part="goal-not-on-the-table" className="text-[11px] text-muted-foreground">
        The Sprint Goal is not on the table. It is the Sprint Backlog&rsquo;s commitment, and the
        work is what moves around it.
      </p>
    </div>
  );
}
