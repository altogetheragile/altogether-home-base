import { describe, it, expect } from 'vitest';
import { initialZooState } from './config';
import { startOnTheBoard, readyToMove, whatIsLeft, finishItem, awaitingReview } from './engine';
import { reducer } from './useZooGame';
import type { ZooGameState } from './types';

// sm17: "YOUR MOVE: choose who reviews it (Ben or Cara)" on the rail, and "Priya accepted it · move it
// to Done" on the card beside it - and the move went through without the review. The Definition of
// Done asked for a second Developer's eyes; the rail asked for them; nothing waited for them.

const REVIEW = 'Peer-reviewed by another Developer';
/** Picnic-Area-shaped: built, the plan done, accepted, one Developer on it. */
const acceptedByOne = (dod: string[]): { s: ZooGameState; id: string } => {
  const s0 = startOnTheBoard(initialZooState(1) as ZooGameState);
  const id = s0.backlog.find((it) => it.status === 'committed')!.id;
  let s = reducer(s0, { type: 'START_ITEM', id });
  const dev = s.team.developers[0].id;
  s = { ...s, definitionOfDone: dod, backlog: s.backlog.map((it) => (it.id !== id ? it : {
    ...it, design: it.draftDesign ?? { parts: {}, colors: {} } as never, assignedDevs: [dev], signedOff: true,
    acConfirmed: it.acceptance.map(() => true), tasks: (it.tasks ?? []).map((t) => ({ ...t, done: true })),
  })) } as ZooGameState;
  return { s, id };
};
const item = (s: ZooGameState, id: string) => s.backlog.find((it) => it.id === id)!;

describe('the review the Definition of Done asks for comes before Done', () => {
  it('waits for it, and the card says so instead of "move it to Done"', () => {
    const { s, id } = acceptedByOne([REVIEW]);
    expect(readyToMove(item(s, id)), 'the setup is not otherwise ready').toBe(true);
    expect(awaitingReview(s, item(s, id))).toBe(true);
    expect(readyToMove(item(s, id), s)).toBe(false);
    expect(whatIsLeft(s, item(s, id))).toMatch(/second pair of eyes/);
    expect(finishItem(s, id, 'developer'), 'it moved to Done without the review').toBe(s);
  });

  it('once another Developer is on it, it can move', () => {
    const { s, id } = acceptedByOne([REVIEW]);
    const two = { ...s, backlog: s.backlog.map((it) => (it.id === id ? { ...it, assignedDevs: [...(it.assignedDevs ?? []), s.team.developers[1].id] } : it)) };
    expect(item(two, id).assignedDevs?.length).toBe(2);
    expect(whatIsLeft(two, item(two, id))).toBe('Ready · move it to Done');
    expect(item(finishItem(two, id, 'developer'), id).status).toBe('done');
  });

  it('asks nothing of a Definition of Done without a review in it', () => {
    const { s, id } = acceptedByOne(['Meets its acceptance criteria']);
    expect(whatIsLeft(s, item(s, id))).toBe('Ready · move it to Done');
  });
});
