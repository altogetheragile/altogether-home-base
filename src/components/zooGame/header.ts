import type { ZooGameState } from './types';
import { goalPulse, dayTotalSeconds } from './engine';

// What the header says, read off the game rather than written on each screen.
//
// Three rows, everywhere. The strip says where you are, how much time is left and whether the Goal
// is safe. The tabs are the artifacts. The band says who does what now, and what each of the five
// people is actually doing. Nothing is said twice, and nothing is said in the wrong weight.

/** Where you are, in the words the event uses for itself. Orange while an event is running,
 *  because an event is a moment and a working day is not. */
export function eventPill(state: ZooGameState): { text: string; event: boolean } {
  const day = `Day ${state.dayNumber}`;
  switch (state.phase) {
    case 'intro':
    case 'brief':
    case 'refine':
      return { text: `Before Sprint ${state.sprintNumber}`, event: false };
    case 'planning': {
      const topic = state.planningTopic ?? 'why';
      return { text: `Sprint Planning · ${topic === 'why' ? 'Why' : topic === 'what' ? 'What' : 'How'}`, event: true };
    }
    case 'review':
      return { text: 'Sprint Review', event: true };
    case 'retro':
      return { text: 'Retrospective', event: true };
    case 'sprint':
      if (state.dayStage === 'dailyScrum') return { text: `Daily Scrum · ${day}`, event: true };
      if (state.dayStage === 'dayStart') return { text: `${day} · Starting`, event: false };
      return { text: `${day} · Building`, event: false };
    default:
      return { text: `Sprint ${state.sprintNumber}`, event: false };
  }
}

/** The two clocks, and which of them is the big one.
 *
 *  Every event is inside the Sprint, so the day keeps running through the Daily Scrum: that is the
 *  lesson - an event is time you spend, not time you are given. But only one number is big at a
 *  time. On a working day the big one is what is left of today. During an event with a timebox the
 *  big one is the timebox, and today is a small figure under it. */
export function clocks(state: ZooGameState): {
  big: { seconds: number; total: number; label: string } | null;
  small?: string;
} {
  if (state.phase !== 'sprint') {
    // Before a Sprint there is no day to count, and a zero would be a lie. A dash is the honest state.
    return { big: null };
  }
  const day = { seconds: state.daySecondsLeft, total: dayTotalSeconds(state.dayTimeMult ?? 1), label: 'left today' };
  if (state.dayStage === 'dailyScrum') {
    return {
      big: { seconds: state.scrumSecondsLeft, total: 20, label: 'of the timebox' },
      small: `day ${state.dayNumber} · ${clockText(state.daySecondsLeft)} left`,
    };
  }
  return { big: day };
}

/** m:ss, the way a clock says it. */
export const clockText = (seconds: number): string => {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/** Whether the Sprint Goal is safe, for the strip. Before a Sprint there is nothing to be at risk. */
export function goalLine(state: ZooGameState): { line: string; risk: boolean } {
  if (state.phase === 'intro' || state.phase === 'brief' || state.phase === 'refine') {
    return { line: `No Sprint yet`, risk: false };
  }
  // No Goal at all is not "goal safe": a Sprint without one has nothing to be safe. Say it plainly
  // wherever it happens, which is Planning before it is agreed and any Sprint started without one.
  if (!state.sprintGoal.trim()) return { line: 'No Sprint Goal yet', risk: false };
  const pulse = goalPulse(state);
  return { line: pulse.line, risk: pulse.level === 'risk' };
}

/** One sentence on who does what now. The band's job is to make the accountabilities visible
 *  without a lecture, and a sentence does it where five badges do not. */
export function whoDoesWhatNow(state: ZooGameState, seat?: string | null): string {
  // The band's badges say the accountability, so a name carrying it too says it twice.
  const po = state.team.productOwner.name.replace(/\s*\((PO|SM|Dev)\)\s*$/i, '');
  switch (state.phase) {
    case 'intro':
    case 'brief':
      // Playing alone there is no seat to pick: you hold all three, and the game names which one
      // you are in at the moment you act.
      return seat
        ? 'Five seats, three accountabilities. Yours is outlined.'
        : 'Five seats, three accountabilities. Playing alone you hold all three.';
    case 'refine':
      return `${po} orders the Backlog. The Developers size it.`;
    case 'planning':
      switch (state.planningTopic ?? 'why') {
        case 'why': return `${po} proposes the value. The whole Scrum Team agrees the Sprint Goal.`;
        case 'what': return `The Developers select. ${po} makes the case.`;
        default: return 'The Developers plan how the work gets done. Nobody assigns it.';
      }
    case 'sprint':
      if (state.dayStage === 'dailyScrum') return `The Developers inspect and adapt their plan. ${po} and ${state.team.scrumMaster.name.replace(/\s*\((PO|SM|Dev)\)\s*$/i, '')} are not in the room.`;
      return `Developers pull and build. ${po} refines and answers.`;
    case 'review':
      return `The Scrum Team and the visitors inspect the Increment. ${po} decides what happens next.`;
    case 'retro':
      return 'The whole Scrum Team, one voice each. What changes next Sprint.';
    default:
      return '';
  }
}

/** One seat on the band: who they are, what they are doing right now, and whether they are in the
 *  room for what is on the screen. A greyed seat is the point of the Daily Scrum being the
 *  Developers': you can see who is not in it. */
export interface SeatLine {
  id: string;
  name: string;
  initials: string;
  role: 'product_owner' | 'scrum_master' | 'developer';
  doing: string;
  /** In the room for what is happening on this screen. */
  present: boolean;
}

export function seatLines(state: ZooGameState): SeatLine[] {
  const sprint = state.phase === 'sprint';
  const scrum = sprint && state.dayStage === 'dailyScrum';
  const inSprint = state.backlog.filter((it) => it.sprintNumber === state.sprintNumber);
  const started = inSprint.filter((it) => it.status === 'committed' && it.started);
  const shortName = (name: string) => (name.length > 12 ? `${name.slice(0, 11)}…` : name);
  // The badge already says PO or SM, so a name carrying it too says it twice.
  const plain = (name: string) => name.replace(/\s*\((PO|SM|Dev)\)\s*$/i, '');

  const devDoing = (id: string): string => {
    const on = started.find((it) => (it.assignedDevs ?? []).includes(id));
    if (on) return `building ${shortName(on.name)}`;
    if (!sprint) return state.phase === 'planning' ? 'choosing work' : state.phase === 'refine' ? 'sizing' : 'available';
    return started.length ? 'choosing work' : 'nothing in hand';
  };

  const poDoing = (): string => {
    if (state.phase === 'refine' || state.phase === 'brief' || state.phase === 'intro') return 'ordering the Backlog';
    if (state.phase === 'planning') return 'making the case';
    if (state.phase === 'review') return 'presenting';
    if (state.phase === 'retro') return 'one voice of five';
    if (scrum) return 'not in the room';
    const waiting = state.pendingPlacement ? 'answering the Developers' : null;
    const toAccept = inSprint.find((it) => it.status === 'committed' && it.design
      && (it.acceptance ?? []).some((_, i) => !it.acConfirmed?.[i]));
    return waiting ?? (toAccept ? `checking ${shortName(toAccept.name)}` : 'available');
  };

  const smDoing = (): string => {
    if (scrum) return 'not in the room';
    if (state.carriedImpediment) return 'clearing a blocker';
    if (state.phase === 'retro') return 'holding the Retrospective';
    if (state.phase === 'planning' || state.phase === 'review') return 'keeping the timebox';
    return 'available';
  };

  return [
    { id: state.team.productOwner.id, name: plain(state.team.productOwner.name), initials: 'PO',
      role: 'product_owner', doing: poDoing(), present: !scrum },
    { id: state.team.scrumMaster.id, name: plain(state.team.scrumMaster.name), initials: 'SM',
      role: 'scrum_master', doing: smDoing(), present: !scrum },
    ...state.team.developers.map((d) => ({
      id: d.id, name: plain(d.name), initials: plain(d.name).slice(0, 1).toUpperCase(),
      role: 'developer' as const, doing: devDoing(d.id), present: true,
    })),
  ];
}
