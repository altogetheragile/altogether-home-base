import { describe, it, expect } from 'vitest';
import { aiTurn } from './aiSeats';
import { initialZooState } from './config';
import { planSprint, startItem, availableItems, askToCheck, setDraftDesign } from './engine';
import { wayRound } from './parkNetwork';
import type { ZooGameState } from './types';

// Game-Priya judges a criterion only when the Developers ask her to check, and she looks first.
// From a playtest: she said "I can walk right round it" about an enclosure nobody had asked her
// about, which taught that acceptance is a stamp. Decided 19 Nov 2026: the Developers ask, then
// she looks, and says "not yet" when it is not so.

const ROUND = 'Can I walk right round it?';

/** The Lion Enclosure built, standing at `at`, with a walk-round criterion, and the asking done. */
function built(at = { x: 600, y: 400 }, ask = true): ZooGameState {
  const base = initialZooState(1);
  const habitat = availableItems(base).find((it) => it.category === 'enclosure')!;
  let s = { ...planSprint(base, [habitat.id]), phase: 'sprint', dayStage: 'building', dayNumber: 1 } as ZooGameState;
  s = startItem(s, habitat.id);
  s = setDraftDesign(s, habitat.id, { parts: {}, colors: {} } as never);
  s = { ...s, backlog: s.backlog.map((it) => (it.id === habitat.id
    ? { ...it, pos: at, acceptance: [ROUND], acConfirmed: [] } : it)) };
  return ask ? askToCheck(s, habitat.id) : s;
}
const habitatOf = (s: ZooGameState) => s.backlog.find((it) => it.acceptance?.[0] === ROUND)!;

/** A building, finished and standing right against it. */
function crowded(s: ZooGameState): ZooGameState {
  const me = habitatOf(s);
  const other = s.backlog.find((it) => it.category === 'amenity')!;
  return { ...s, backlog: s.backlog.map((it) => (it.id === other.id
    ? { ...it, status: 'open' as const, design: { parts: {}, colors: {} } as never, pos: { x: me.pos!.x + 60, y: me.pos!.y } } : it)) };
}

describe('Priya looks before she says yes', () => {
  it('sees the walkway round a habitat that has room round it', () => {
    const s = built();
    expect(wayRound(s, habitatOf(s))).toMatchObject({ met: true });
  });

  it('sees when something else stands in the way round it', () => {
    const s = crowded(built());
    expect(wayRound(s, habitatOf(s))).toMatchObject({ met: false });
    expect(wayRound(s, habitatOf(s))?.evidence).toMatch(/blocked by the Toilets/);
  });

  it('accepts what she can walk round, and says what she saw', () => {
    const move = aiTurn(built(), 'product_owner');
    expect(move?.action).toMatchObject({ type: 'ANSWER_QUESTION', choice: 'accept' });
    expect(move?.says).toMatch(/I can walk right round it/);
  });

  it('says not yet, and why, when she cannot walk round it', () => {
    const move = aiTurn(crowded(built()), 'product_owner');
    expect(move?.action).toMatchObject({ type: 'ANSWER_QUESTION', choice: 'back' });
    expect(move?.says).toBe('Not yet. I went to look at the Lion Enclosure, and I cannot walk right round it: it is blocked by the Toilets. Move one of them apart, then ask me again.');
  });

  it('does not tick it when nobody has asked her', () => {
    const s = built(undefined, false);
    for (let i = 0; i < 5; i += 1) {
      const move = aiTurn(s, 'product_owner');
      expect(move?.action.type).not.toBe('CONFIRM_AC');
    }
  });
});
