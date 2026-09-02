import { describe, it, expect } from 'vitest';
import { initialZooState } from './config';
import { reducer } from './useZooGame';
import { aiTurn } from './aiSeats';
import { mayTake } from './seatRules';
import { splitEpic, planSprint, startItem, decisionsIn, PLACEMENT_CHOICES } from './engine';
import { CANVAS_W, PLAY_H } from './parkLayout';
import type { ZooGameState } from './types';

// Where a habitat or a building goes.
//
// It is what a visitor walks up to and in what order, which makes it a product decision - so the
// Developers ask instead of letting a layout decide it quietly. They do not wait forever: an
// unanswered question costs the Product Owner the say, which is the truer lesson and means a
// Product Owner who has wandered off cannot stall a Sprint.

/** A Sprint under way, with a habitat in it that nobody has placed. */
function midSprint(): { s: ZooGameState; habitat: string } {
  let s = splitEpic(initialZooState(1), 'bigcats', ['tiger', 'leopard', 'kiosk']);
  for (const it of s.backlog.filter((x) => x.unsized)) s = reducer(s, { type: 'ESTIMATE_ITEM', id: it.id, points: it.trueSize ?? 3 });
  const habitat = s.backlog.find((it) => it.category === 'enclosure')!.id;
  s = planSprint({ ...s, phase: 'planning' }, [habitat]);
  return { s: { ...s, dayStage: 'building', daySecondsLeft: 90 }, habitat };
}

describe('the Developers asking where something goes', () => {
  it('asks before starting a habitat nobody has placed', () => {
    const { s, habitat } = midSprint();
    const move = aiTurn(s, 'developer')!;
    expect(move.action, 'they placed it themselves without asking').toEqual({ type: 'ASK_PLACEMENT', id: habitat });
    expect(move.says, 'the question does not say what is being asked about').toMatch(/Where do you want/i);
    expect(mayTake(move.action.type, { seat: 'developer' }).allowed).toBe(true);
  });

  it('waits for the answer, and gets on with it if none comes', () => {
    const { s, habitat } = midSprint();
    let asked = reducer(s, { type: 'ASK_PLACEMENT', id: habitat });
    expect(asked.pendingPlacement?.itemId).toBe(habitat);
    expect(aiTurn(asked, 'developer'), 'they started it while the question was still open').toBeNull();

    // Twelve seconds of the day later, they get on with it and say why.
    asked = { ...asked, daySecondsLeft: asked.daySecondsLeft - 13 };
    const move = aiTurn(asked, 'developer')!;
    expect(move.action).toEqual({ type: 'START_ITEM', id: habitat });
    expect(move.says, 'they did not say why they had chosen for themselves').toMatch(/no word/i);
  });

  it('puts it where the Product Owner said, inside the park', () => {
    const { s, habitat } = midSprint();
    const asked = reducer(s, { type: 'ASK_PLACEMENT', id: habitat });
    const answered = reducer(asked, { type: 'ANSWER_PLACEMENT', id: habitat, choice: 'entrance' });
    const pos = answered.backlog.find((it) => it.id === habitat)!.pos!;
    expect(pos, 'the answer did not put it anywhere').toBeTruthy();
    expect(pos.y, 'by the entrance is the bottom of the park').toBeGreaterThan(PLAY_H / 2);
    expect(pos.x).toBeGreaterThan(0);
    expect(pos.x).toBeLessThan(CANVAS_W);
    expect(answered.pendingPlacement, 'the question stayed open after it was answered').toBeFalsy();

    // ...and the Developers get on with it now they know.
    expect(aiTurn(answered, 'developer')?.action).toEqual({ type: 'START_ITEM', id: habitat });
  });

  it('records the answer, including leaving it to them', () => {
    const { s, habitat } = midSprint();
    const asked = reducer(s, { type: 'ASK_PLACEMENT', id: habitat });
    const mine = reducer(asked, { type: 'ANSWER_PLACEMENT', id: habitat, choice: 'back' });
    expect(decisionsIn(mine, mine.sprintNumber).some((d) => d.kind === 'placement')).toBe(true);

    const theirs = reducer(asked, { type: 'ANSWER_PLACEMENT', id: habitat, choice: 'them' });
    const left = decisionsIn(theirs, theirs.sprintNumber).find((d) => d.kind === 'placement')!;
    expect(left.what, 'leaving it to them was not recorded as the decision it is').toMatch(/left it to them/i);
    expect(theirs.backlog.find((it) => it.id === habitat)!.pos, 'they were told to choose and it was placed anyway').toBeFalsy();
  });

  it('does not ask about a path, or about anything already placed', () => {
    // Nobody needs consulting about which patch of grass a shrub goes on.
    let base = splitEpic(initialZooState(1), 'bigcats', ['tiger', 'leopard', 'kiosk']);
    for (const it of base.backlog.filter((x) => x.unsized)) base = reducer(base, { type: 'ESTIMATE_ITEM', id: it.id, points: it.trueSize ?? 3 });
    const path = base.backlog.find((it) => it.category === 'path')!;
    const pathOnly = { ...planSprint({ ...base, phase: 'planning' }, [path.id]), dayStage: 'building' as const, daySecondsLeft: 90 };
    expect(pathOnly.backlog.filter((it) => it.status === 'committed').map((it) => it.category),
      'this test needs a Sprint of nothing but the path').toEqual(['path']);
    expect(aiTurn(pathOnly, 'developer')?.action.type, 'they asked where to put a pathway').not.toBe('ASK_PLACEMENT');
    // ...nor about something the Product Owner has already dropped somewhere.
    const { s: s2, habitat } = midSprint();
    const placed = { ...s2, backlog: s2.backlog.map((it) => (it.id === habitat ? { ...it, pos: { x: 300, y: 300 } } : it)) };
    expect(aiTurn(placed, 'developer')?.action).toEqual({ type: 'START_ITEM', id: habitat });
  });

  it('does not carry a question over into tomorrow', () => {
    // The wait is measured on the day clock, which resets - so a question that survived the
    // boundary would be waited on for ever.
    const { s, habitat } = midSprint();
    const asked = reducer(s, { type: 'ASK_PLACEMENT', id: habitat });
    // Through the day's end and its Daily Scrum, which is how a new day actually arrives.
    let tomorrow = reducer({ ...asked, dayStage: 'building' }, { type: 'END_DAY' });
    if (tomorrow.dayStage === 'dailyScrum') tomorrow = reducer(tomorrow, { type: 'RUN_DAILY_SCRUM' });
    expect(tomorrow.dayNumber, 'the day never turned over').toBeGreaterThan(asked.dayNumber);
    expect(tomorrow.pendingPlacement, 'yesterday\'s question was still hanging over today').toBeFalsy();
  });

  it('is answered by the seat when the game is playing the Product Owner', () => {
    // Otherwise a game where every seat is played sits waiting for an answer nobody is there
    // to give, which is the deadlock this game keeps finding new ways to arrive at.
    const { s, habitat } = midSprint();
    const asked = reducer(s, { type: 'ASK_PLACEMENT', id: habitat });
    const move = aiTurn(asked, 'product_owner')!;
    expect(move.action.type).toBe('ANSWER_PLACEMENT');
    expect(PLACEMENT_CHOICES.map((c) => c.key)).toContain((move.action as { choice: string }).choice);
    expect(move.says, 'they answered without saying why').toMatch(/where I want people to meet it/i);
  });
});

describe('starting work answers the question by doing it', () => {
  it('clears the question when the item starts', () => {
    const { s, habitat } = midSprint();
    const asked = reducer(s, { type: 'ASK_PLACEMENT', id: habitat });
    expect(startItem(asked, habitat).pendingPlacement, 'the question outlived the work starting').toBeFalsy();
  });
});
