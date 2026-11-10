import type { ReactNode } from 'react';
import { useYou } from './you';
import type { ZooGameState, ImpedimentAnswer, ChatKind } from './types';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { DAILY_SCRUM_SECONDS, DAILY_SCRUM_FLOOR_SECONDS } from './config';
import { sprintProgress, todaysDecision, inTheWayOfTheGoal, yourStandUp, goalAtRisk, hatHolder, teamAnswersFirst } from './engine';
import { Bubble } from './TeamChat';
import { Burndown } from './Burndown';
import { cn } from '@/lib/utils';
import { FOCUS, TONE } from './ui/tokens';
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
  /** In a shared game: the Developers ask whoever wears the Scrum Master hat to help. Until they do,
   *  the two Scrum Master answers are not on the table. */
  onAskScrumMaster?: () => void;
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
  const { thread, options } = useStandUp(state);
  if (!thread.length && !options.length) return null;
  return (
    <div data-part="stand-up" className="space-y-2">
      {thread.length > 0 && (
        <ul className="flex flex-col gap-2">
          {thread.map((m) => <Bubble key={m.id} msg={m} />)}
        </ul>
      )}
      {options.length > 0 && onSay && (
        <div data-part="your-turn" className="flex flex-wrap gap-2">
          {/* Choices, drawn as choices. They were small pills that read as tags. */}
          {options.map((o) => (
            <button key={o.key} type="button" onClick={() => onSay(o.text, 'stand-up')} title={o.text}
              className={cn(FOCUS, 'rounded-lg border-2 border-border bg-card px-3 py-2 text-left text-sm font-semibold transition-colors hover:border-foreground')}>
              {o.label}
            </button>
          ))}
        </div>
      )}
      <p className="text-[11px] text-muted-foreground">
        A common format, not the Guide&rsquo;s: the Developers choose how they run this.
      </p>
    </div>
  );
}

function useStandUp(state: ZooGameState) {
  const thread = (state.chat ?? []).filter((m) => m.kind === 'stand-up' && m.day === state.dayNumber);
  const viewer = useYou();
  const yours = thread.some((m) => m.who === 'you' || (!!viewer && m.member === viewer));
  const options = yours ? [] : yourStandUp(state, viewer);
  return { thread, options, yours };
}

/** One of the event's steps: a number, the question it answers, and what you do about it. Asked
 *  while playing it: "what is important? What should I do?" The screen had seven panels of the
 *  same weight and no order to read them in. */
function Step({ n, title, aside, children }: { n: number; title: string; aside?: string; children: ReactNode }) {
  return (
    <section data-step={n} className="space-y-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span aria-hidden className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-bold text-background">{n}</span>
        <h2 className="text-lg font-bold leading-tight">{title}</h2>
        {aside && <span className="text-xs text-muted-foreground">{aside}</span>}
      </div>
      <div className="sm:pl-10">{children}</div>
    </section>
  );
}

/** Your move in this event, drawn the way it is on every other screen. */
function Move({ children, className, part }: { children: ReactNode; className?: string; part?: string }) {
  return (
    <div data-part={part ?? 'your-move'} data-move className={cn('space-y-2 rounded-lg border-2 border-primary bg-card p-3 shadow-[3px_3px_0_hsl(var(--zoo-ink))]', className)}>
      {children}
    </div>
  );
}

const YOUR_MOVE = <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">Your move</span>;
const days = (n: number) => `${n} day${n === 1 ? '' : 's'}`;
const pts = (n: number) => `${n} point${n === 1 ? '' : 's'}`;

/** The Daily Scrum: the Developers' short, TIMEBOXED daily event to inspect progress toward
 *  the Sprint Goal (the burndown + essentials) and adapt the plan for the next day. It always happens.
 *  Blockers are surfaced here, not solved here - the Scrum Master removes them outside it. The
 *  real choice is whether you ADAPT to what it surfaced or carry on regardless (letting a
 *  blocker grow overnight). The timebox counts down; on expiry it adapts (the disciplined
 *  default), so you decide within the box. In learn mode the timebox is paused. */
export function DailyScrum({ state, onHold, onSkip, onDrop, onAnswer, onAskScrumMaster, onSay }: DailyScrumProps) {
  // In a shared game the Scrum Master is a hat one of the Developers wears, and the team is asked
  // first: "I'm not sure a SM unilaterally decides this - the default is always ask the team."
  const viewer = useYou();
  const hat = hatHolder(state);
  const smName = hat?.name ?? '';
  const teamFirst = teamAnswersFirst(state);
  const smMine = !!hat && hat.id === viewer;
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

  const { thread, options } = useStandUp(state);
  const standUp = !!(thread.length || options.length);

  // One verdict, in the colour of what it means. The screen had "the Sprint Goal is at risk" in one
  // panel and "On track for the Sprint Goal" in the line under it.
  const done = prog.essentialsTotal
    ? `${prog.essentialsDone} of ${prog.essentialsTotal} essentials done`
    : `${itemsDone} of ${itemsTotal} items done`;
  const verdict: { tone: 'danger' | 'attention' | 'done'; head: string; facts: string } = atRisk
    ? { tone: 'danger',
        head: flagged ? `Not as planned. ${flagged.candidate.name} will not make it.` : 'Not as planned. At this rate the Goal does not make it.',
        facts: flagged ? `${pts(flagged.left)} left and ${days(flagged.daysLeft)} to do about ${flagged.capacity} of them. ${done}.` : `${pts(prog.remaining)} left over ${days(daysLeft)}. ${done}.` }
    : decision
      ? { tone: 'attention', head: 'Yes, if the plan changes. Not everything will fit.',
          facts: `${pts(decision.left)} left and ${days(decision.daysLeft)} to do about ${decision.capacity} of them. ${done}.` }
      : prog.remaining === 0
        ? { tone: 'done', head: 'Yes. All the forecast work is Done.', facts: `${done}, with ${days(daysLeft)} to go.` }
        : prog.essentialsTotal && prog.essentialsDone < prog.essentialsTotal
          ? { tone: 'attention', head: 'On track, but essentials are still open.', facts: `${pts(prog.remaining)} left over ${days(daysLeft)}. ${done}.` }
          : { tone: 'done', head: 'Yes, on track.', facts: `${pts(prog.remaining)} left over ${days(daysLeft)}. ${done}.` };
  const VerdictIcon = verdict.tone === 'done' ? CheckCircle2 : AlertTriangle;

  const steps: { title: string; aside?: string; body: ReactNode }[] = [];
  steps.push({ title: 'Will we make the Sprint Goal?', body: (
    <div data-part="verdict" data-tone={verdict.tone}
      className={cn('grid items-center gap-3 rounded-lg border-2 px-3 py-2 lg:grid-cols-[minmax(0,1fr)_260px]', TONE[verdict.tone].soft)}>
      <div className="space-y-1">
        <div className={cn('flex items-start gap-2 text-base font-bold', TONE[verdict.tone].text)}>
          <VerdictIcon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden /> {verdict.head}
        </div>
        <p className="text-sm">{verdict.facts}</p>
      </div>
      <div data-part="burndown" title="The burndown: above the dashed line means behind">
        <Burndown state={state} compact />
      </div>
    </div>
  ) });
  if (standUp) steps.push({ title: 'Your turn round the room', aside: options.length ? 'Pick what you say.' : undefined, body: <TheStandUp state={state} onSay={onSay} /> });

  // ...and adapt. The reason the event exists, and the one move on the screen.
  const plan = imp ? (
    <Move>
      {/* What surfaced, and which kind of thing it is.

          A block stops one item and the Developers can clear it themselves; an impediment slows
          the whole team and is beyond their self-management, which is what makes it the Scrum
          Master's. The arbiter is the Sprint Goal, and the screen says which test it applied. */}
      <div data-part="surfaced" className="flex items-start gap-2.5">
        <div className="shrink-0">{YOUR_MOVE}</div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-semibold">{imp.title}</span>
            <Chip tone={block ? 'quiet' : 'attention'}>{block ? 'a block · one item' : 'an impediment · the whole team'}</Chip>
          </div>
          <div className="text-sm">{imp.detail}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {block
              ? (goalRisk
                ? 'It is on work the Sprint Goal depends on, so it is not just one item\u2019s problem any more.'
                : 'The Sprint Goal does not depend on it, and the Developers can clear their own blocks. Is this really yours?')
              : hat
                ? `It is beyond what the Developers can sort out between themselves, which is ${teamFirst ? `a reason to ask ${smName} to help` : `why they asked ${smName}`}.`
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

      {/* Four answers, none forbidden, each with what it costs written on it. In a shared game
          they are two people's: the team's two first, and the Scrum Master's two once the team
          has asked for help. */}
      {hat && !teamFirst && (
        <p data-part="asked-sm" className="text-xs text-muted-foreground">
          {smMine
            ? <>The Developers have asked you to help. As Scrum Master, it is your call: remove it, or escalate it.</>
            : <>The Developers have asked {smName} to help. It is the Scrum Master&rsquo;s call now.</>}
        </p>
      )}
      <div data-part="answers" className="grid gap-2 sm:grid-cols-2">
        {(hat && teamFirst ? [
          { how: 'team' as const, label: 'We will clear it ourselves',
            cost: block ? 'about 5% of the day' : 'it is beyond us, and it grows overnight' },
          { how: 'around' as const, label: 'We will work around it',
            cost: 'a small cut today, and it is still there tomorrow' },
          { how: 'ask' as const, label: `Ask ${smName} to help`,
            cost: `the Scrum Master decides: remove it, or escalate it` },
        ] : hat ? [
          { how: 'remove' as const, label: smMine ? 'Remove it yourself' : `${smName} removes it`,
            cost: block ? 'cleared, and they learn to wait for you' : 'cleared today, at about 10% of the day' },
          { how: 'escalate' as const, label: smMine ? 'Escalate it' : `${smName} escalates it`,
            cost: 'nothing today. It clears in a day or two, and nobody here solved it' },
        ] : [
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
          <button key={o.how} type="button" data-answer={o.how}
            onClick={() => (o.how === 'ask' ? onAskScrumMaster?.() : onAnswer?.(o.how))}
            disabled={o.how === 'ask' ? !onAskScrumMaster : !onAnswer || (!!hat && !teamFirst && !smMine)}
            className={cn(FOCUS, 'rounded-lg border-2 border-border bg-card px-3 py-2 text-left transition-colors hover:border-foreground disabled:opacity-50')}>
            <span className="block text-sm font-semibold">{o.label}</span>
            <span className="block text-[11px] text-muted-foreground">{o.cost}</span>
          </button>
        ))}
      </div>
      {atRisk && <p className="text-xs text-muted-foreground">The Sprint Goal is at risk too. That is Priya&rsquo;s, and you take it to her straight after this.</p>}
      {/* Every answer above holds the Daily Scrum: the event is where it surfaced and the answer
          is what the team does about it today. The one way out that is not an answer is not
          dealing with it at all, and its button says so. */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border pt-2">
        <Button variant="ghost" size="sm" onClick={onSkip} className="text-muted-foreground">Nobody deals with it</Button>
        <span className="text-[11px] text-muted-foreground">the Daily Scrum does not happen, it grows overnight, and the timebox is gone either way</span>
      </div>
    </Move>
  ) : flagged || atRisk ? (
    // The reason this event has no Drop button when the Goal is the thing in danger. The Guide
    // puts the Product Owner outside this event unless they are working on Sprint Backlog items;
    // what the Sprint PROMISES is theirs. The huddle after it is where she is, and walking away
    // from that is a choice the huddle offers, so it is not offered twice.
    <Move part="needs-priya">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">{YOUR_MOVE}<span className="text-base font-semibold">The Sprint Goal is at risk, and that is not yours alone to settle.</span></div>
        <p className="text-sm text-muted-foreground">
          The plan is the Developers&rsquo; to change. What the Sprint promised is the Product Owner&rsquo;s, and she is
          not in this event, so take it to her straight after.
        </p>
      </div>
      <Button onClick={onHold}>We&rsquo;re done: take it to {state.team.productOwner.name.replace(/\s*\(PO\)$/i, '')} &rarr;</Button>
    </Move>
  ) : decision && onDrop ? (
    <Move part="decision">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">{YOUR_MOVE}
          <span className="text-base font-semibold">
            {decision.essentialsKnown
              ? <>Put down {decision.candidate.name}? It is not what the Goal depends on.</>
              : <>Put something down? Nothing is marked essential, so which is the Developers&rsquo; judgement. {decision.candidate.name} is the biggest.</>}
          </span>
        </div>
        <p className="text-[12px] text-muted-foreground">{decision.ifDropped}</p>
        <p className="text-[12px] text-muted-foreground">{decision.ifKept}</p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        {/* "Protect the Goal" is a claim, and it is only true where the team has said what the
            Goal depends on. Until then dropping something is how the rest gets finished. */}
        <Button onClick={() => { onDrop(decision.candidate.id); onHold(); }}>
          Drop {decision.candidate.name}, {decision.essentialsKnown ? 'protect the Goal' : 'finish the rest'}
        </Button>
        <Button variant="outline" onClick={onHold}>Keep the plan</Button>
      </div>
      {/* What this event does with the decision, and what it does not. Adapting the Sprint
          Backlog is the Daily Scrum's own purpose and the Sprint Backlog belongs to the
          Developers, so this is theirs to decide with nobody else in the room. The board changes
          when the event closes; anything that needs the Product Owner waits for the huddle. */}
      <p data-part="decided-not-done" className="text-[11px] text-muted-foreground">
        Decided here, done when the event closes. Anything needing the Product Owner waits until you are out of the room.
      </p>
    </Move>
  ) : (
    <Move className="flex flex-wrap items-center gap-3 space-y-0">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">{YOUR_MOVE}
        <span className="text-base font-semibold">Nothing to change. Finish early: the timebox is a maximum.</span>
      </div>
      <div className="flex flex-col items-end gap-1">
        {/* The Developers saying the event is over, named after the thing a team actually says. */}
        <Button onClick={onHold}>We&rsquo;re done &rarr;</Button>
        {/* What it costs, which is the seconds you spend in it: finish and the rest of the box is
            yours, sit through it and you pay all of it, never less than the floor. */}
        <span className="text-[11px] text-muted-foreground">
          it costs the time you spend in it, {DAILY_SCRUM_FLOOR_SECONDS}s to {DAILY_SCRUM_SECONDS}s of the day
          {state.scrumDiscipline && ' \u00b7 and a carried blocker costs you half what it costs a team that skips'}
        </span>
      </div>
    </Move>
  );
  steps.push({ title: 'Change today\u2019s plan', body: plan });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <h1 className="text-2xl font-bold leading-tight tracking-tight">Day {state.dayNumber} Daily Scrum</h1>
          <p className="text-sm text-muted-foreground">The Developers check progress toward the Sprint Goal and change today&rsquo;s plan if they need to.</p>
        </div>
        {/* The timebox, in the game's own seconds. The Guide's fifteen minutes is said under it. */}
        <div data-part="timebox" className="flex shrink-0 flex-col items-end gap-1">
          {state.learnMode
            ? <span className="text-xs text-muted-foreground">timebox paused</span>
            : <span className="text-xs text-muted-foreground"><span className={cn('text-xl font-bold tabular-nums', low ? TONE.attention.text : 'text-foreground')}>0:{String(left).padStart(2, '0')}</span> left of the timebox</span>}
          {!state.learnMode && (
            <span className="h-1.5 w-44 overflow-hidden rounded-full bg-muted" aria-hidden>
              <span className={cn('block h-full rounded-full transition-[width] duration-500 ease-linear', low ? 'bg-amber-500' : 'bg-muted-foreground')} style={{ width: `${boxPct}%` }} />
            </span>
          )}
          <span className="text-[11px] text-muted-foreground">15 minutes in the Guide</span>
        </div>
      </div>

      {steps.map((st, i) => <Step key={st.title} n={i + 1} title={st.title} aside={st.aside}>{st.body}</Step>)}

      {/* Whose event this is, said rather than implied. */}
      <p data-part="in-the-room" className="border-t border-border pt-3 text-[11px] text-muted-foreground">
        <span className="font-semibold uppercase tracking-wide text-foreground">In the room</span> &nbsp;the Developers: {devs}.
        The Product Owner and the Scrum Master join only if they are working on Sprint Backlog items.
      </p>
    </div>
  );
}
