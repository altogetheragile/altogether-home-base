import type { ZooGameState, ZooFlowChoices, FlowLeftOut, ZooBrief } from './types';
import { DEFAULT_BRIEF, DEFAULT_DOD, PRODUCT_GOAL } from './config';
import { writeBacklog, refineAll, setDefinitionOfDone, setProductGoal, startOnTheBoard, goalCandidates, suggestSprintGoal, players, setTrainerLed, LADDER } from './engine';

// A trainer's flow, as data (docs/ZOO_GAME_FLOW.md, "A Flow Is A List Of Choices About Where The
// Game Starts"). Each choice leaves a step for the team or does it for them before they get there.
// Nothing here changes the rules of Scrum: it changes what the team is handed.
//
// `applyFlow` takes a new game to wherever its flow starts. What the flow does for the team further
// along, after a step the team does itself, is kept on the game (`state.flow`) and done when the
// game reaches it: the Product Backlog when the team has answered the brief, the Sprint Goal when
// it walks into Sprint Planning.

export interface ZooFlow {
  id: string;
  name: string;
  /** What it is for, in a line, for the trainer choosing one. */
  about: string;
  choices: ZooFlowChoices;
}

const WHOLE: ZooFlowChoices = {
  productGoal: 'team', backlog: 'epics', definitionOfDone: 'team', sprintGoal: 'team', forecast: 'team',
  refinementInSprint: true, chance: true, ladder: false,
};

/** The flows that ship with the game, so a trainer never starts from nothing. They cannot be edited
 *  in place: a trainer copies one, so the original is always there to go back to. */
export const PRESETS: ZooFlow[] = [
  { id: 'whole', name: 'The whole of Scrum',
    about: 'Every step is the team’s, from the Product Goal on. What a solo player gets.',
    choices: WHOLE },
  { id: 'start-building', name: 'Start building',
    about: 'Sprint 1 arrives planned, with no Definition of Done. Each Retrospective hands over one practice.',
    choices: { productGoal: 'given', backlog: 'first-area', definitionOfDone: 'none', sprintGoal: 'given', forecast: 'given',
      refinementInSprint: false, chance: true, ladder: true } },
  { id: 'ready-to-go', name: 'Ready to go',
    about: 'The Product Backlog refined, a Definition of Done and a Sprint Goal given. The team starts by choosing the work.',
    choices: { productGoal: 'given', backlog: 'refined', definitionOfDone: 'given', sprintGoal: 'given', forecast: 'team',
      refinementInSprint: true, chance: true, ladder: false } },
  { id: 'no-done', name: 'Nobody knows what Done means',
    about: 'The whole of Scrum, with no Definition of Done.',
    choices: { ...WHOLE, definitionOfDone: 'none' } },
];

export const preset = (id: string): ZooFlow | undefined => PRESETS.find((f) => f.id === id);

/** The trainer cards a choice suggests (step 8 puts them in the deck). */
export const SUGGESTED_CARDS = {
  noDone: 'nobody-sure-what-finished',
  goalGiven: 'who-wrote-this-goal',
  refined: 'never-really-ready',
} as const;

/** A flow that can be played. A planned Sprint 1 arrives before the team has done anything, so it
 *  brings its Sprint Goal and the Product Goal with it: the team cannot have written either. And a
 *  planned Sprint needs something Ready to plan, so it never starts from epics only. */
export function playable(c: ZooFlowChoices): ZooFlowChoices {
  if (c.forecast !== 'given') return c;
  return { ...c, productGoal: 'given', sprintGoal: 'given', backlog: c.backlog === 'epics' ? 'first-area' : c.backlog };
}

/** What the flow does for the team or leaves out, and the card each suggests, for the trainer's
 *  "Left out in this flow". */
export function leftOut(choices: ZooFlowChoices): FlowLeftOut[] {
  const c = playable(choices);
  const out: FlowLeftOut[] = [];
  if (c.productGoal === 'given') out.push({ step: 'productGoal', how: 'given' });
  if (c.backlog === 'refined') out.push({ step: 'backlog', how: 'given', card: SUGGESTED_CARDS.refined });
  else if (c.backlog === 'first-area') out.push({ step: 'backlog', how: 'given' });
  if (c.definitionOfDone === 'none') out.push({ step: 'definitionOfDone', how: 'none', card: SUGGESTED_CARDS.noDone });
  else if (c.definitionOfDone === 'given') out.push({ step: 'definitionOfDone', how: 'given' });
  if (c.sprintGoal === 'given') out.push({ step: 'sprintGoal', how: 'given', card: SUGGESTED_CARDS.goalGiven });
  if (c.forecast === 'given') out.push({ step: 'forecast', how: 'given' });
  return out;
}

/** Whether Refinement before Sprint 1 is the team's. It is not when the Product Backlog arrives
 *  refined and nothing is left to agree there either, or when Sprint 1 arrives planned. */
const teamRefines = (c: ZooFlowChoices) =>
  c.forecast !== 'given' && !(c.backlog === 'refined' && c.definitionOfDone !== 'team');

/** Which practices the team has from the start. With the ladder off, all of them. With it on, only
 *  what the flow leaves to the team, and the Retrospectives hand over the rest. Refinement is the
 *  team's whenever it refines the starter itself, because it cannot do that without it. */
export function adoptedFor(choices: ZooFlowChoices): string[] {
  const c = playable(choices);
  const has = (key: string) => {
    if (key === 'refinement') return c.refinementInSprint || teamRefines(c);
    if (!c.ladder) return true;
    if (key === 'sprint-planning') return c.forecast === 'team';
    return false;
  };
  // The Definition of Done is a list, not a flag, and answers for itself (`adopted`).
  return LADDER.map((r) => r.key).filter((k) => k !== 'definition-of-done' && has(k));
}

const dodLines = (c: ZooFlowChoices) => (c.definitionOfDoneLines?.length ? c.definitionOfDoneLines : DEFAULT_DOD);

/** Take a new game to where its flow starts. */
export function applyFlow(state: ZooGameState, flow: ZooFlow | ZooFlowChoices, brief: ZooBrief = DEFAULT_BRIEF): ZooGameState {
  const c = playable('choices' in flow ? flow.choices : flow);
  let s: ZooGameState = { ...state, flow: c, flowLeftOut: leftOut(c), adopted: adoptedFor(c) };
  // A length the trainer chose is a length agreed, as the team choosing one is.
  if (c.sprintDays) s = { ...s, sprintDays: Math.max(1, Math.round(c.sprintDays)), sprintDaysAgreed: true };
  if (!c.chance) s = setTrainerLed(s, true);
  if (c.productGoal === 'team') return s;
  s = setProductGoal(s, c.productGoalText ?? PRODUCT_GOAL);

  if (c.forecast === 'given') {
    return startOnTheBoard(s, brief, {
      refined: c.backlog === 'refined',
      definitionOfDone: c.definitionOfDone === 'given' ? dodLines(c) : undefined,
      sprintGoal: c.sprintGoalText,
    });
  }
  // The team answers the brief, unless there is nothing left for it to refine: then Priya wrote
  // the Product Backlog from the game's own, and the team walks into Sprint Planning.
  if (teamRefines(c)) return { ...s, phase: 'brief', backlog: [] };
  return writeFlowBacklog(s, brief);
}

/** Write the Product Backlog from the brief as the game's flow has it: how refined it arrives, and
 *  the Definition of Done it does for the team. Without a flow, the whole flow's epics. */
export function writeFlowBacklog(state: ZooGameState, brief: ZooBrief): ZooGameState {
  const c = state.flow;
  if (!c) return writeBacklog(state, brief);
  let s = writeBacklog(state, brief, { firstAreaRefined: c.backlog === 'first-area' });
  if (c.backlog === 'refined') s = refineAll(s);
  // None: agreed as none, so nothing asks for one (`handover`). The Review finds out what that meant.
  // Written from empty, so the lines the game suggests count as agreed when the trainer gives them.
  if (c.definitionOfDone === 'given') s = setDefinitionOfDone({ ...s, definitionOfDone: [] }, dodLines(c));
  else if (c.definitionOfDone === 'none') s = { ...s, definitionOfDone: [], dodAgreed: true };
  return teamRefines(c) ? s : arriveAtPlanning({ ...s, phase: 'planning', planningTopic: 'why' });
}

/** Walking into Sprint 1's Planning with a flow that gave the Sprint Goal: it is there, agreed by
 *  everybody at the table, and Planning opens on what to forecast. Every Sprint after the first is
 *  the team's. */
export function arriveAtPlanning(state: ZooGameState): ZooGameState {
  const c = state.flow;
  if (!c || c.sprintGoal !== 'given' || state.phase !== 'planning' || state.sprintNumber !== 1 || state.sprintGoal.trim()) return state;
  const goal = c.sprintGoalText?.trim() || suggestSprintGoal(goalCandidates(state));
  return { ...state, sprintGoal: goal, planningTopic: 'what',
    sprintGoalAgreed: ['product_owner', 'developer', 'scrum_master', ...players(state).map((p) => p.id)] };
}
