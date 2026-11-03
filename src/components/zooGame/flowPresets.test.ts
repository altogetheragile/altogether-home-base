import { describe, it, expect } from 'vitest';
import { initialZooState, DEFAULT_BRIEF, DEFAULT_DOD } from './config';
import { startOnTheBoard, adopted, LADDER, goalCandidates, isDraftedGoal } from './engine';
import { reducer } from './useZooGame';
import type { ZooAction, ZooGameState } from './types';
import { PRESETS, preset, applyFlow, playable, leftOut, arriveAtPlanning, SUGGESTED_CARDS } from './flow';
import { handover } from './handover';
import { journey } from './journey';

// A trainer's flow is a list of choices about where the game starts (docs/ZOO_GAME_FLOW.md, step 4).
// Each one leaves a step for the team or does it for them, and the four presets are the flows a
// trainer copies from. Nothing on screen yet: this is the engine's half.

const fresh = () => initialZooState(1);
const flow = (id: string) => preset(id)!;
const act = (s: ZooGameState, a: unknown) => reducer(s, a as ZooAction);

describe('the four presets', () => {
  it('are the four the design names', () => {
    expect(PRESETS.map((f) => f.name)).toEqual(['The whole of Scrum', 'Start building', 'Ready to go', 'Nobody knows what Done means']);
  });

  it('the whole of Scrum starts at the Product Goal with every practice, and leaves nothing out', () => {
    const s = applyFlow(fresh(), flow('whole'));
    expect(s.phase).toBe('intro');
    for (const r of LADDER.filter((x) => x.key !== 'definition-of-done')) expect(adopted(s, r.key), r.key).toBe(true);
    expect(s.flowLeftOut).toEqual([]);
  });

  it('start building is the game\'s old main button: Sprint 1 planned, no Definition of Done, no practices', () => {
    const s = applyFlow(fresh(), flow('start-building'));
    const old = startOnTheBoard(fresh());
    expect(s.phase).toBe('sprint');
    expect(s.committedIds).toEqual(old.committedIds);
    expect(s.sprintGoal).toBe(old.sprintGoal);
    expect(s.definitionOfDone).toEqual([]);
    for (const r of LADDER) expect(adopted(s, r.key), `${r.key} is the ladder's to hand over`).toBe(false);
  });

  it('ready to go starts at Sprint Planning\'s second topic, with everything before it done', () => {
    const s = applyFlow(fresh(), flow('ready-to-go'));
    expect(s.phase).toBe('planning');
    expect(s.planningTopic).toBe('what');
    expect(s.backlog.filter((it) => it.category === 'epic'), 'fully refined: every area split').toEqual([]);
    expect(s.backlog.filter((it) => it.unsized && it.category !== 'need'), 'and every piece sized').toEqual([]);
    expect(goalCandidates(s).length).toBeGreaterThan(0);
    expect(s.definitionOfDone).toEqual(DEFAULT_DOD);
    expect(s.dodAgreed).toBe(true);
    expect(isDraftedGoal(s.sprintGoal)).toBe(true);
    expect(s.sprintGoalAgreed).toEqual(expect.arrayContaining(['product_owner', 'developer', 'scrum_master']));
    expect(s.flowLeftOut?.map((l) => l.card).filter(Boolean)).toEqual([SUGGESTED_CARDS.refined, SUGGESTED_CARDS.goalGiven]);
  });

  it('nobody knows what Done means is the whole flow, and nothing asks for a Definition of Done', () => {
    const s0 = applyFlow(fresh(), flow('no-done'));
    expect(s0.phase).toBe('intro');
    const s = act({ ...s0, phase: 'brief', backlog: [] }, { type: 'WRITE_BACKLOG', brief: DEFAULT_BRIEF });
    expect(s.phase).toBe('refine');
    expect(s.definitionOfDone).toEqual([]);
    expect(s.dodAgreed).toBe(true);
    expect(handover(s)?.key, 'Priya asks for refinement, then never for Done').toBe('refinement');
    expect(journey({ ...s, phase: 'planning' } as ZooGameState).steps.find((x) => x.key === 'dod')?.status).toBe('passed');
    expect(s.flowLeftOut).toEqual([{ step: 'definitionOfDone', how: 'none', card: SUGGESTED_CARDS.noDone }]);
  });
});

describe('a flow of the trainer\'s own', () => {
  const whole = flow('whole').choices;

  it('gives the Sprint Goal when the team walks into Sprint 1\'s Planning, and only Sprint 1\'s', () => {
    const s0 = applyFlow(fresh(), { ...whole, sprintGoal: 'given', sprintGoalText: 'Our goal is to open the lions so that families come' });
    const refined = act({ ...s0, phase: 'brief', backlog: [] }, { type: 'WRITE_BACKLOG', brief: DEFAULT_BRIEF });
    const s = act(refined, { type: 'SET_PHASE', phase: 'planning' });
    expect(s.sprintGoal).toBe('Our goal is to open the lions so that families come');
    expect(s.planningTopic).toBe('what');
    const later = { ...s, sprintNumber: 2, sprintGoal: '', planningTopic: 'why' } as ZooGameState;
    expect(arriveAtPlanning(later)).toBe(later);
  });

  it('hands the starter over refined while leaving Refinement and Done to the team', () => {
    const s0 = applyFlow(fresh(), { ...whole, productGoal: 'given', backlog: 'refined' });
    expect(s0.phase, 'the team still answers the brief').toBe('brief');
    expect(applyFlow(fresh(), { ...whole, backlog: 'refined' }).phase, '...after its Product Goal').toBe('intro');
    const s = act(s0, { type: 'WRITE_BACKLOG', brief: DEFAULT_BRIEF });
    expect(s.phase).toBe('refine');
    expect(s.backlog.some((it) => it.category === 'epic')).toBe(false);
    expect(s.dodAgreed).toBeFalsy();
  });

  it('turns chance off and sets the Sprint length', () => {
    const s = applyFlow(fresh(), { ...whole, chance: false, sprintDays: 5 });
    expect(s.trainerLed).toBe(true);
    expect(s.sprintDays).toBe(5);
  });

  it('cannot plan Sprint 1 for the team and leave its goals to them, or plan it from epics', () => {
    const c = playable({ ...whole, forecast: 'given' });
    expect([c.productGoal, c.sprintGoal, c.backlog]).toEqual(['given', 'given', 'first-area']);
    expect(leftOut({ ...whole, forecast: 'given' }).map((l) => l.step)).toEqual(['productGoal', 'backlog', 'sprintGoal', 'forecast']);
  });

  it('plans Sprint 1 with a refined backlog and a Definition of Done when the flow gives them', () => {
    const s = applyFlow(fresh(), { ...flow('start-building').choices, backlog: 'refined', definitionOfDone: 'given', definitionOfDoneLines: ['Built', 'Signed off'] });
    expect(s.phase).toBe('sprint');
    expect(s.backlog.some((it) => it.category === 'epic')).toBe(false);
    expect(s.definitionOfDone).toEqual(['Built', 'Signed off']);
    expect(s.dodAgreed).toBe(true);
  });
});

describe('a game with no flow', () => {
  it('writes the whole flow\'s epics, as before', () => {
    const s = act({ ...fresh(), phase: 'brief', backlog: [] }, { type: 'WRITE_BACKLOG', brief: DEFAULT_BRIEF });
    expect(s.phase).toBe('refine');
    expect(s.backlog.some((it) => it.category === 'epic')).toBe(true);
    expect(s.dodAgreed).toBeFalsy();
    const p = act(s, { type: 'SET_PHASE', phase: 'planning' });
    expect(p.sprintGoal).toBe('');
  });
});
