import { describe, it, expect } from 'vitest';
import { reducer } from './useZooGame';
import { initialZooState } from './config';
import { dayTotalSeconds } from './engine';
import { aiTurn } from './aiSeats';
import { SHIPPED_TRAINER_CARDS, asPlayed, parseDeck } from './trainerCards';
import type { ZooGameState } from './types';

// The cards that land on the Product Owner. "A lion has escaped: absorb it, or cancel the Sprint?
// Only the Product Owner can cancel." A decision goes to that seat at once, with the three answers
// Scrum gives it, and waits for them.

const escape = asPlayed(SHIPPED_TRAINER_CARDS.find((c) => c.id === 'escape')!);
const sponsor = asPlayed(SHIPPED_TRAINER_CARDS.find((c) => c.id === 'stakeholder')!);

const sprint = (): ZooGameState => {
  const base = initialZooState(7);
  return { ...base, phase: 'sprint', dayStage: 'building', sprintNumber: 1, dayNumber: 2, sprintDays: 5,
    daySecondsLeft: dayTotalSeconds(1), sprintGoal: 'Open the lions' } as ZooGameState;
};
const played = (card = escape) => reducer(sprint(), { type: 'PLAY_TRAINER_CARD', card });
const theCard = (s: ZooGameState) => (s.questions ?? []).find((q) => q.id.startsWith('card-'))!;

describe('a decision card', () => {
  it('goes straight to the Product Owner, not to the Daily Scrum', () => {
    const s = played();
    const q = theCard(s);
    expect(q.of).toBe('product_owner');
    expect(q.choices.map((c) => c.key)).toEqual(['now', 'backlog', 'cancel']);
    expect(q.developersMayAnswer, 'the Developers may decide what happens to the Sprint').toBe(false);
    expect(s.trainerCard ?? null, 'it was queued for the Daily Scrum').toBeNull();
  });

  it('dealt with now, costs a quarter of today', () => {
    const s = played();
    const after = reducer(s, { type: 'ANSWER_QUESTION', id: theCard(s).id, choice: 'now' });
    expect(s.daySecondsLeft - after.daySecondsLeft).toBe(Math.round(dayTotalSeconds(1) * 0.25));
    expect(after.questions ?? []).toHaveLength(0);
  });

  it('ordered in, is a Product Backlog item at the top, and the Sprint is untouched', () => {
    const s = played(sponsor);
    const after = reducer(s, { type: 'ANSWER_QUESTION', id: theCard(s).id, choice: 'backlog' });
    const first = after.backlog.find((it) => it.status === 'backlog');
    expect(first?.name).toBe('Gift Shop');
    expect(after.phase).toBe('sprint');
  });

  it('cancelled, ends the Sprint, which only the Product Owner may do', () => {
    const s = played();
    const after = reducer(s, { type: 'ANSWER_QUESTION', id: theCard(s).id, choice: 'cancel' });
    expect(after.phase).toBe('planning');
    expect(after.sprintNumber).toBe(2);
  });

  it('is answered by a Product Owner played by the game, as the card says, and says why', () => {
    const move = aiTurn(played(sponsor), 'product_owner');
    expect(move?.action).toMatchObject({ type: 'ANSWER_QUESTION', choice: 'backlog' });
    expect(move?.says).toMatch(/Sprint’s Goal stands/);
  });

  it('keeps what a decision needs when an admin saves one', () => {
    const deck = parseDeck(JSON.stringify([{ id: 'own-vip', kind: 'decision', title: 'A VIP visit', detail: 'The mayor is coming.', landsOn: 'Developers', item: 'Red carpet', aiChoice: 'cancel' }]))!;
    expect(deck[0]).toMatchObject({ kind: 'decision', landsOn: 'Product Owner', item: 'Red carpet', aiChoice: 'cancel' });
  });
});
