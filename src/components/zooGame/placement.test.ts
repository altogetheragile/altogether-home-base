import { describe, it, expect } from 'vitest';
import { initialZooState, DAY_SECONDS } from './config';
import { reducer } from './useZooGame';
import { splitEpic, planSprint, startItem } from './engine';
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
  return { s: { ...s, dayStage: 'building', daySecondsLeft: DAY_SECONDS }, habitat };
}

describe('starting work answers the question by doing it', () => {
  it('clears the question when the item starts', () => {
    const { s, habitat } = midSprint();
    const asked = reducer(s, { type: 'ASK_PLACEMENT', id: habitat });
    expect(startItem(asked, habitat).pendingPlacement, 'the question outlived the work starting').toBeFalsy();
  });
});
