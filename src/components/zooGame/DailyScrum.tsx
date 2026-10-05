import type { ZooGameState, ImpedimentAnswer, ChatKind } from './types';
import { Button } from '@/components/ui/button';
import { Users, AlertTriangle, CheckCircle2, Clock, Star, Target } from 'lucide-react';
import { DAILY_SCRUM_SECONDS, DAILY_SCRUM_FLOOR_SECONDS } from './config';
import { sprintProgress, todaysDecision, inTheWayOfTheGoal, yourStandUp, goalAtRisk } from './engine';
import { Bubble } from './TeamChat';
import { Burndown } from './Burndown';
import { cn } from '@/lib/utils';
import { FOCUS, PADDING, SURFACE, TONE } from './ui/tokens';
import { Chip } from './ui/Chip';

interface DailyScrumProps {
  state: ZooGameState;
  onHold: () => void;
  onSkip: () => void;
  /** Take something back out of the Sprint Backlog to protect the Goal. The Developers' call, and
   *  the one this event exists to make. */
  onDrop?: (id: string) => void;
  /** What the Scrum Master does about what surfaced. Four answers, and the game charges each. */
  onAnswer?: (how: ImpedimentAnswer) => void;
  /** Your own turn in the room. Chosen rather than typed, so what you say is something your own
   *  cards make true. */
  onSay?: (text: string, kind?: ChatKind) => void;
}


/** The stand-up: what everybody said, and your turn.
 *
 *  The three questions are not the Guide's - the 2020 Guide dropped them and says the Developers
 *  select whatever structure they want - so the heading says whose format it is, beside the thing
 *  it is naming rather than in a footnote nobody reads.
 *
 *  Your turn is three options, not a text box. Every one of them is built from your own cards, so
 *  all three are true; what differs is what they are ABOUT. One is progress toward the Sprint
 *  Goal, which is the only thing the Guide insists this event focuses on. The other two are the
 *  ways a stand-up goes wrong - a status report addressed to nobody, and a promise where a plan
 *  should be. Nothing scores them. The Retrospective reads back what was said. */
function TheStandUp({ state, onSay }: { state: ZooGameState; onSay?: (text: string, kind?: ChatKind) => void }) {
  // This event's own thread, by what each message says it belongs to. It used to be found by
  // sniffing for the words of the three questions, which worked until a Developer said something
  // in the room that was not one of them - the risk flag, which is the most important thing said
  // at a stand-up and the one the filter dropped on the floor.
  const thread = (state.chat ?? []).filter((m) => m.kind === 'stand-up' && m.day === state.dayNumber);
  const yours = thread.some((m) => m.who === 'you');
  const options = yours ? [] : yourStandUp(state);
  if (!thread.length && !options.length) return null;
  return (
    <div data-part="stand-up" className={cn(SURFACE.card, PADDING.default, 'space-y-2')}>
      <div className="flex flex-wrap items-baseline gap-x-2">
        <span className="text-xs font-semibold">Round the room</span>
        <span className="text-[11px] text-muted-foreground">
          the three questions are a common format, not the Guide&rsquo;s - the Developers choose how they run this
        </span>
      </div>
      <ul className="flex flex-col gap-2">
        {thread.map((m) => <Bubble key={m.id} msg={m} />)}
      </ul>
      {options.length > 0 && onSay && (
        <div data-part="your-turn" className="space-y-1.5 border-t border-border pt-2">
          <div className="text-[11px] font-semibold text-muted-foreground">Your turn</div>
          <div className="flex flex-wrap gap-1.5">
            {options.map((o) => (
              <button key={o.key} type="button" onClick={() => onSay(o.text, 'stand-up')} title={o.text}
                className={cn(FOCUS, 'rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium transition-colors hover:border-primary/60 hover:text-foreground')}>
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** The Daily Scrum: the Developers' short, TIMEBOXED daily event to inspect progress toward
 *  the Sprint Goal (the burndown + essentials) and adapt the plan for the next day. It always happens.
 *  Blockers are surfaced here, not solved here - the Scrum Master removes them outside it. The
 *  real choice is whether you ADAPT to what it surfaced or carry on regardless (letting a
 *  blocker grow overnight). The timebox counts down; on expiry it adapts (the disciplined
 *  default), so you decide within the box. In learn mode the timebox is paused. */
export function DailyScrum({ state, onHold, onSkip, onDrop, onAnswer, onSay }: DailyScrumProps) {
  // What does not fit, and whose call it is.
  //
  // Two different situations wear the same arithmetic. Work that will not fit while the Sprint
  // Goal is still safe is the Developers adapting their own Sprint Backlog, which is this event's
  // stated purpose and needs nobody else in the room. A Sprint Goal AT RISK is not: what the
  // Sprint promises is the Product Owner's, and she is not here. So the first is decided in the
  // event and the second is flagged in it and settled in the huddle on the way out, which is where
  // she is. The event cuts no scope it has no right to cut.
  const atRisk = goalAtRisk(state);
  const decision = atRisk ? null : todaysDecision(state);
  const flagged = atRisk ? todaysDecision(state) : null;
  const prog = sprintProgress(state);
  // Today counts. The Daily Scrum is held at the start of the day it is named for, so "days left"
  // that excluded it disagreed with the decision panel underneath, which counts the day you are
  // about to spend - two numbers for the same thing, on the same screen.
  const daysLeft = Math.max(0, state.sprintDays - state.dayNumber + 1);
  const imp = state.pendingImpediment;
  // Before essentials can be marked, the Goal rests on everything forecast - so the figure counts
  // items rather than reporting that nothing has a star on it.
  const inSprint = state.backlog.filter((it) => it.sprintNumber === state.sprintNumber && it.status !== 'backlog');
  const itemsTotal = inSprint.length;
  const itemsDone = inSprint.filter((it) => it.status === 'done' || it.status === 'open').length;

  // The timebox counts in game state (TICK_SCRUM), not here, so it survives a reload and
  // can be shared. On expiry the reducer takes the disciplined default and adapts.
  const left = state.scrumSecondsLeft;

  const boxPct = Math.max(0, Math.min(100, (left / DAILY_SCRUM_SECONDS) * 100));
  const low = boxPct <= 30;

  // Who is in the room. The Daily Scrum is the Developers' event: the Product Owner and the Scrum
  // Master take part only if they are working on Sprint Backlog items. The line is on the screen
  // because the accountability is the thing being taught, and implying it teaches nobody.
  const devs = state.team.developers.map((d) => d.name).join(', ');
  const block = imp?.kind === 'block';
  const goalRisk = inTheWayOfTheGoal(state, imp ?? null);

  return (
    <div className="space-y-3">
      {/* One line: which event, how long it is, and how much of it is left. The timebox used to be a
          bar of its own under the title, which is a third block of furniture before the decision. */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={cn('inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold',
          state.learnMode ? 'bg-muted text-muted-foreground' : low ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300' : 'bg-primary/10 text-primary')}>
          <Users className="h-3.5 w-3.5" /> Daily Scrum
          <span className="opacity-60">&middot;</span>
          {/* The timebox in the game's own seconds. It used to read "15 min timebox &middot; 0:03
              left" - two different units in one sentence, which is why the clock read as broken. The
              real fifteen minutes is a teaching point, and it is made in the text below. */}
          {state.learnMode ? 'timebox paused' : <>timebox <span className="opacity-60">&middot;</span> <span className="tabular-nums">0:{String(left).padStart(2, '0')}</span> left</>}
        </span>
        {!state.learnMode && (
          <span className="h-1.5 w-32 overflow-hidden rounded-full bg-muted" aria-hidden>
            <span className={cn('block h-full rounded-full transition-[width] duration-500 ease-linear', low ? 'bg-amber-500' : 'bg-primary')} style={{ width: `${boxPct}%` }} />
          </span>
        )}
      </div>

      <div>
        <h1 className="text-2xl font-bold leading-tight tracking-tight">Day {state.dayNumber} Daily Scrum</h1>
        {/* The Guide has this every day of the Sprint. The game lets you carry on regardless and
            shows what that costs - so the copy says that, rather than "it always happens" on a
            screen with a button that skips it. */}
        <p className="text-sm text-muted-foreground">
          Are we on track for the Sprint Goal? Inspect progress and adapt the plan for today. The Scrum Guide has this
          every day of a Sprint, timeboxed to 15 minutes; here it runs in the game&rsquo;s own seconds,
          you can carry on regardless, and the cost of that is shown.
        </p>
      </div>

      {/* The room, talking. The event was a dashboard: three numbers, a burndown and a decision,
          with nobody in it saying a word - and a Daily Scrum is the Developers talking to each
          other. Theirs is already said when you walk in; yours is a choice. */}
      <TheStandUp state={state} onSay={onSay} />

      {/* Inspect: the three numbers this event is about. */}
      <div className="grid gap-2 sm:grid-cols-3">
        {/* Marking essentials is revealed after the first Sprint. "none ⭐" was the figure until
            then, which reads as a fault rather than as a thing you have not met yet. */}
        {prog.essentialsTotal
          ? <Stat icon={Star} label="Essentials done" value={`${prog.essentialsDone} of ${prog.essentialsTotal}`} />
          : <Stat icon={Star} label="Items done" value={`${itemsDone} of ${itemsTotal}`} />}
        <Stat icon={Target} label="Points done" value={`${prog.pointsDone} of ${prog.pointsCommitted}`} />
        <Stat icon={Clock} label={daysLeft === 1 ? 'Day left' : 'Days left'} value={`${daysLeft}`} />
      </div>

      {/* ...and adapt: the burndown and the decision, side by side, above the fold. The decision is
          the reason this screen exists, and it used to start eight hundred pixels down it. */}
      <div className={cn('grid gap-2', (decision && onDrop) || flagged ? 'lg:grid-cols-2' : '')}>
        <div className={cn(SURFACE.card, PADDING.default)}>
          <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold">
            <Target className="h-3.5 w-3.5 text-muted-foreground" /> Burndown
            <span className="font-normal text-muted-foreground">- above the line means behind</span>
          </div>
          <Burndown state={state} />
          <p className="mt-1 text-[11px] text-muted-foreground">
            {prog.remaining === 0 ? 'All the forecast work is done - ahead of the line.'
              : `${prog.remaining} pts remain over ${daysLeft} day${daysLeft === 1 ? '' : 's'}.`}
          </p>
        </div>

        {flagged && (
          <div data-part="needs-priya" className="rounded-lg border-2 border-amber-400/70 bg-amber-500/[0.07] p-3">
            <div className="text-sm font-bold">This one is not ours alone</div>
            <p className="mt-1 text-sm">
              {flagged.left} point{flagged.left === 1 ? '' : 's'} left, {flagged.daysLeft} day{flagged.daysLeft === 1 ? '' : 's'} to do
              about {flagged.capacity} of them, and the Sprint Goal is at risk.{' '}
              <strong>{flagged.candidate.name}</strong> is the thing that will not make it.
            </p>
            {/* The teaching, and the reason this event has no Drop button when the Goal is the
                thing in danger. The Guide puts the Product Owner outside this event unless they
                are working on Sprint Backlog items; what the Sprint PROMISES is theirs. */}
            <p className="mt-1.5 text-[12px] text-muted-foreground">
              The Sprint Backlog is yours to change, and you have just changed what you think you can
              finish. What the Sprint promised is the Product Owner&rsquo;s, and she is not in this
              event. Flag it here; settle it with her on the way out.
            </p>
          </div>
        )}

        {decision && onDrop && (
          <div data-part="decision" className="rounded-lg border-2 border-amber-400/70 bg-amber-500/[0.07] p-3">
            <div className="text-sm font-bold">Decision for today</div>
            <p className="mt-1 text-sm">
              {decision.left} point{decision.left === 1 ? '' : 's'} left, {decision.daysLeft} day{decision.daysLeft === 1 ? '' : 's'} to do
              about {decision.capacity} of them.{' '}
              {decision.essentialsKnown
                ? <><strong>{decision.candidate.name}</strong> is not what the Goal depends on.</>
                : <>Nothing is marked essential this Sprint, so which to put down is the Developers&rsquo; judgement.
                  <strong> {decision.candidate.name}</strong> is the biggest of them.</>}
            </p>
            <p className="mt-1.5 text-[12px] text-muted-foreground">{decision.ifDropped}</p>
            <p className="text-[12px] text-muted-foreground">{decision.ifKept}</p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              {/* "Protect the Goal" is a claim, and it is only true where the team has said what the
                  Goal depends on. Until then dropping something is how the rest gets finished. */}
              <Button size="sm" onClick={() => { onDrop(decision.candidate.id); onHold(); }}>
                Drop {decision.candidate.name}, {decision.essentialsKnown ? 'protect the Goal' : 'finish the rest'}
              </Button>
              <Button size="sm" variant="outline" onClick={onHold}>Keep the plan</Button>
            </div>
            {/* What this event does with the decision, and what it does not.
                Adapting the Sprint Backlog is the Daily Scrum's own purpose - the Guide says so in
                its first sentence - and the Sprint Backlog belongs to the Developers, so this is
                theirs to decide with nobody else in the room. What happens here is the DECIDING.
                The board changes when the event closes, which is how a team actually works: you
                agree it in the fifteen minutes and you do it afterwards.
                Anything that needs the Product Owner cannot happen here at all, because she is not
                in the room. That is what the huddle after it is for. */}
            <p data-part="decided-not-done" className="mt-1.5 text-[11px] text-muted-foreground">
              Decided here, done when the event closes. The Sprint Backlog is the Developers&rsquo; to
              change. Anything needing the Product Owner waits until you are out of the room.
            </p>
          </div>
        )}
      </div>

      {imp ? (
        <>
          {/* What surfaced, and which kind of thing it is.
              
              A block stops one item and the Developers can clear it themselves; an impediment slows
              the whole team and is beyond their self-management, which is what makes it the Scrum
              Master's. The arbiter is the Sprint Goal, and the screen says which test it applied. */}
          <div data-part="surfaced" className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 dark:border-amber-700/60 dark:bg-amber-950/30">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className={cn(TONE.attention.text, "mt-0.5 h-5 w-5 shrink-0")} />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className={cn(TONE.attention.text, 'text-sm font-semibold')}>{imp.title}</span>
                  <Chip tone={block ? 'quiet' : 'attention'}>{block ? 'a block · one item' : 'an impediment · the whole team'}</Chip>
                </div>
                <div className={cn(TONE.attention.text, "text-sm")}>{imp.detail}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {block
                    ? (goalRisk
                      ? 'It is on work the Sprint Goal depends on, so it is not just one item\u2019s problem any more.'
                      : 'The Sprint Goal does not depend on it, and the Developers can clear their own blocks. Is this really yours?')
                    : 'It is beyond what the Developers can sort out between themselves, which is what makes it yours.'}
                </div>
                {/* Labelled the way slicing and velocity are. The Guide has impediments and says the
                    Scrum Master causes their removal; the block-versus-impediment split is a lens
                    some teach on top of that, and a game that flags every other extra-Guide practice
                    should flag this one. */}
                <div className="mt-1 text-[11px] italic text-muted-foreground/80">
                  Telling a block from an impediment is a lens some coaches teach, not the Guide&rsquo;s.
                  The Guide has impediments, and asks the Scrum Master to cause their removal.
                </div>
              </div>
            </div>
          </div>

          {/* Four answers, none forbidden, each with what it costs written on it. */}
          <div data-part="answers" className="grid gap-2 sm:grid-cols-2">
            {([
              { how: 'team' as const, label: 'Leave it to the Developers',
                cost: block ? 'they clear it - about 5% of the day' : 'it is beyond them, and it grows overnight' },
              { how: 'remove' as const, label: 'Remove it yourself',
                cost: block ? 'cleared, and they learn to wait for you' : 'cleared today, at about 10% of the day' },
              { how: 'around' as const, label: 'Work around it',
                cost: 'a small cut today, and it is still there tomorrow' },
              { how: 'escalate' as const, label: 'Escalate it',
                cost: 'nothing today. It clears in a day or two, and nobody here solved it' },
            ]).map((o) => (
              // None of them is drawn as the answer. The screen leaned on one - the conventional
              // move for whichever kind of thing it was - and a judgement with an orange button on
              // it is not a judgement, it is a prompt. The costs are the argument; the choice is
              // the Scrum Master's.
              <button key={o.how} type="button" onClick={() => onAnswer?.(o.how)} disabled={!onAnswer}
                className={cn(FOCUS, 'rounded-lg border border-border bg-card px-3 py-2 text-left transition-colors hover:border-primary/50 disabled:opacity-50')}>
                <span className="block text-sm font-semibold">{o.label}</span>
                <span className="block text-[11px] text-muted-foreground">{o.cost}</span>
              </button>
            ))}
          </div>
          {/* Holding the event is its own act, and it was missing: with something on the table the
              only ways out were to answer it or to skip the event altogether. Reported from playing
              it - "there is no option to perform a Daily Scrum on the takeover". The Developers can
              hold their Daily Scrum and leave the thing where it is; working around it is an
              answer, and so is deciding not to decide today. */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
            <div className="flex flex-col gap-1">
              <Button onClick={() => { onAnswer?.('around'); onHold(); }}>Hold the Daily Scrum &rarr;</Button>
              <span className="text-[11px] text-muted-foreground">the event happens; what surfaced is worked around and is still there tomorrow</span>
            </div>
            <div>
              <Button variant="ghost" onClick={onSkip} className="text-muted-foreground">Carry on regardless</Button>
              <span className="ml-2 text-[11px] text-muted-foreground">the event does not happen, it grows overnight, and the timebox is gone either way</span>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2.5 text-sm text-muted-foreground">
            <CheckCircle2 className={cn(TONE.done.text, "h-5 w-5 shrink-0")} />
            {prog.essentialsTotal && prog.essentialsDone < prog.essentialsTotal
              ? 'Nothing blocking today - but essentials are still open. Adapt the plan to finish those first.'
              : 'On track for the Sprint Goal - nothing blocking today. The Daily Scrum is how you know that.'}
          </div>
          <div className="flex flex-col gap-1">
            {/* The Developers saying the event is over. A timebox is a maximum, not a duration, and
                naming the button after the thing a team actually says is the cheapest way to teach
                that. */}
            <Button onClick={onHold}>We&rsquo;re done &rarr;</Button>
            {/* What the habit buys, said correctly.
                This line used to read "efficient - no time lost" for a team that had adopted
                "hold the Daily Scrum every day", which was true until the engine stopped making
                the event free for them - and then went on saying it. The event costs its timebox
                whoever holds it; what improves with the habit is the price of a blocker that does
                get carried. */}
            {/* What it costs, which is the seconds you spend in it.
                This line used to read "efficient - no time lost" for a team that had adopted "hold
                the Daily Scrum every day", which was true until the engine stopped making the
                event free for them - and then went on saying it. Then it read "~10% of tomorrow",
                a flat charge whatever the team did. It is the box you use now: finish and the rest
                of it is yours, sit through it and you pay all of it, and it never costs less than
                the floor, because nobody inspects a burndown in no time. */}
            <span className="text-[11px] text-muted-foreground">
              it costs the time you spend in it, {DAILY_SCRUM_FLOOR_SECONDS}s to {DAILY_SCRUM_SECONDS}s of the day
              {state.scrumDiscipline && ' \u00b7 and a carried blocker costs you half what it costs a team that skips'}
            </span>
          </div>
        </div>
      )}

      {/* Whose event this is, said rather than implied. */}
      <p data-part="in-the-room" className="border-t border-border pt-2 text-[11px] text-muted-foreground">
        <span className="font-semibold text-foreground">In the room:</span> the Developers - {devs}. The Product Owner and
        the Scrum Master take part only if they are working on Sprint Backlog items. The plan is the Developers&rsquo; to
        change, and the Sprint Goal is the thing being protected.
      </p>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return (
    <div className={cn(SURFACE.card, PADDING.default, 'text-center')}>
      <div className="flex items-center justify-center gap-1 text-lg font-bold tabular-nums"><Icon className="h-4 w-4 text-muted-foreground" />{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}
