import { describe, it, expect } from 'vitest';
import { reviewed } from './testReviewed';
import { initialZooState } from './config';
import { planSprint, startItem, setDraftDesign, setItemTasks, fillTheGaps, whatIsLeft, readyToMove, answerQuestion, askToCheck } from './engine';
import { applyParkChecks } from './parkChecks';
import type { ZooGameState } from './types';

// From the scrum-master playtest sm9: the Lion was sent back by Priya ("one lion on its own"), the
// persona made it a pair, Priya accepted - and the card said "build it on the park" for the rest of
// Sprint 2 and all of Sprint 3. Sending work back keeps the build as a draft; the plan stayed
// ticked, so nothing ever committed the draft again, and Done waits for a committed build.

const lionInDoing = (): ZooGameState => {
  let s = initialZooState(1);
  s = { ...s, backlog: s.backlog.map((it) => (it.id === 'lion-enc'
    ? { ...it, status: 'open' as const, design: { parts: {}, colors: {} } as never, enclosureSize: 'medium' as const } : it)) } as ZooGameState;
  s = setItemTasks(s, 'lion', fillTheGaps(s.backlog.find((x) => x.id === 'lion')!));
  s = { ...planSprint(s, ['lion']), phase: 'sprint', dayStage: 'building' } as ZooGameState;
  return startItem(s, 'lion');
};
const lion = (s: ZooGameState) => s.backlog.find((x) => x.id === 'lion')!;
const group = (males: number, females: number) =>
  ({ parts: {}, colors: { coat: '#c90' }, group: { males, females, juveniles: 0, cubs: 0 } }) as never;

describe('work sent back can still reach Done', () => {
  it('fixed and accepted, it is ready to move', () => {
    let s = applyParkChecks(setDraftDesign(lionInDoing(), 'lion', group(1, 0)));
    s = applyParkChecks(answerQuestion(askToCheck(s, 'lion'), 'check-lion', 'back', 'product_owner'));
    s = applyParkChecks(setDraftDesign(s, 'lion', group(1, 1)));
    s = applyParkChecks(answerQuestion(askToCheck(s, 'lion'), 'check-lion', 'accept', 'product_owner'));
    expect(whatIsLeft(s, lion(s)), 'the review the Definition of Done asks for comes first').toMatch(/second pair of eyes/);
    s = reviewed(s, 'lion');
    expect(whatIsLeft(s, lion(s))).toBe('Ready · move it to Done');
    expect(readyToMove(lion(s))).toBe(true);
  });
});
