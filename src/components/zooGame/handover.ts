import type { ZooGameState } from './types';
import { availableItems, isReady, enoughToStart, sprintCapacity, START_READY, goalCandidates } from './engine';

// Priya hands each step over, in her own voice.
//
// A game with nobody to lead it has to say what it wants next (docs/ZOO_GAME_FLOW.md, "Led Through
// It"). The journey line says where you are; this says what the Product Owner is asking for, as
// somebody would say it across a table, and pins what it asks of the team underneath so it cannot be
// missed: "Here is my starter, one epic for each area. Split enough for one Sprint and we can plan."
//
// Worked out from the state rather than stored, so a shared game reads the same handover in every
// browser and a reload cannot lose it. Only the steps before the Sprint have one. From the Sprint
// on, the team chat and the rail are already where people say things and ask for them.

export interface Handover {
  /** Which step it hands over. The Definition of Done shares the Refinement screen. */
  key: 'refinement' | 'dod' | 'start' | 'goal';
  /** Priya's line. */
  says: string;
  /** What the team is being asked to do, in one line: the "needs you" card. */
  asks: string;
  /** How far along it is, where that can be counted. */
  progress?: string;
}

const pts = (n: number) => `${n} point${n === 1 ? '' : 's'}`;

export function handover(state: ZooGameState): Handover | null {
  if (state.phase === 'refine') {
    // The first pass only. After a Sprint, Refinement is ongoing work and Priya does not need to
    // explain what she is handing over: it is the Product Backlog the team has been working from.
    if (state.sprintNumber !== 1 || state.velocity.length > 0) return null;
    const cap = sprintCapacity(state).points;
    if (!enoughToStart(state)) {
      const ready = availableItems(state).filter((it) => isReady(it, state)).reduce((n, it) => n + it.estimate, 0);
      return {
        key: 'refinement',
        says: 'Here is my starter, one epic for each area, in the order I would like them. We need enough split and sized to get started, now or in Sprint Planning. The rest we refine as we go.',
        asks: 'Refine enough to start: now, or in Sprint Planning. The team decides.',
        // Says where the number comes from: "0 points Ready of about 11 points to start - I don't
        // know what 'about 11 points' means or where that figure comes from" (scrum-master playtest).
        // ...and still it was read as a riddle, five times a run: what "ready" is, and what half of
        // what. So it says both: ready means sized (with its criteria), and the half is of the
        // team's Sprint (sm13).
        // ...and then it was still read as items: "0 of 11 points" beside 13 cards, "why 11 rather
        // than 13?" (sm16, sm17). So it leads with what is counted, and says the target last.
        progress: `Sized and ready to start: ${pts(ready)} so far. The team can do about ${pts(cap)} a Sprint, so about ${pts(Math.round(cap * START_READY))} ready is enough to begin the Sprint, not to fill it: the rest is refined during the Sprint. This counts points, not items`,
      };
    }
    if (!state.dodAgreed) {
      return {
        key: 'dod',
        says: 'That is enough ready to start. One more thing before we plan: what does Done mean? I want us all to know when something is finished.',
        asks: 'Agree the Definition of Done as a Scrum Team, or start without one.',
      };
    }
    return state.definitionOfDone.length
      ? { key: 'start', says: 'Enough ready to start, and we agree what Done means. Let’s plan the first Sprint.', asks: 'Go to Sprint Planning.' }
      : { key: 'start', says: 'No Definition of Done, then. We will find out at the Review what Done meant. Let’s plan the first Sprint.', asks: 'Go to Sprint Planning.' };
  }
  if (state.phase === 'planning' && (state.planningTopic ?? 'why') === 'why') {
    // The Product Owner proposes how the Sprint could add value, and the whole Scrum Team agrees the
    // Sprint Goal (Scrum Guide 2020, Topic One). Her line is the proposal, not the Goal.
    // Nothing Ready means nothing marked, and a line about "the marked items" points at nothing.
    const top = availableItems(state)[0];
    // ...and once she has offered words of her own, she says so, rather than asking the team what
    // the Sprint is for with her answer already in the box.
    if (state.sprintGoalSuggestedIn === state.sprintNumber && state.sprintGoal.trim()) {
      return {
        key: 'goal',
        says: 'I have put a Sprint Goal in the box to start from. It is the whole team\u2019s to agree, so change it if it does not say why this Sprint is worth doing.',
        asks: 'Agree a Sprint Goal as a Scrum Team.',
      };
    }
    if (!goalCandidates(state).length && top) {
      return {
        key: 'goal',
        says: `Nothing is Ready yet, so the Goal comes first. ${top.name}, at the top, is where I think the value is. What should this Sprint be for? We refine what it needs in the next topic.`,
        asks: 'Agree a Sprint Goal as a Scrum Team.',
      };
    }
    return {
      key: 'goal',
      says: state.sprintNumber === 1
        ? 'This first Sprint is the zoo’s first chance to give visitors something. The marked items off the top are where I think the value is. What should this Sprint be for?'
        : `Sprint ${state.sprintNumber}. The marked items off the top are where I think the value is now. What should this Sprint be for?`,
      asks: 'Agree a Sprint Goal as a Scrum Team.',
    };
  }
  return null;
}
