import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { reducer } from './useZooGame';
import { initialZooState } from './config';
import { endDay, generateImpediment } from './engine';
import { SHIPPED_TRAINER_CARDS, asPlayed } from './trainerCards';

const TRAINER_CARDS = SHIPPED_TRAINER_CARDS;
const card = (id: string) => asPlayed(SHIPPED_TRAINER_CARDS.find((c) => c.id === id)!);
import { mayTake } from './seatRules';
import { TrainerDeck } from './TrainerDeck';
import type { ZooGameState } from './types';

// The drama, on cue. Al, 26 Oct 2026: "For a trainer led game they inject the drama by being able
// to play certain cards e.g. materials are delayed, a lion has escaped or something."

const building = (over: Partial<ZooGameState> = {}): ZooGameState => {
  const base = initialZooState(7);
  const one = base.backlog.find((it) => !it.unsized && it.category === 'enclosure')!;
  return {
    ...base, phase: 'sprint', dayStage: 'building', sprintNumber: 1, dayNumber: 1, sprintDays: 5,
    daySecondsLeft: 60, pendingImpediment: null, committedIds: [one.id],
    backlog: base.backlog.map((it) => (it.id === one.id ? { ...it, status: 'committed' as const, sprintNumber: 1, started: true } : it)),
    ...over,
  } as ZooGameState;
};

/** A day whose own roll would have turned something up, so "nothing surfaced" means chance is off. */
const rollyDay = (s: ZooGameState) => {
  for (let seed = 1; seed < 200; seed++) {
    if (generateImpediment(seed, s.sprintNumber, s.dayNumber)) return { ...s, gameSeed: seed };
  }
  throw new Error('no seed rolls an impediment');
};

describe('a trainer plays the drama', () => {
  it('lands a card at the next Daily Scrum, and only there', () => {
    const played = reducer(building(), { type: 'PLAY_TRAINER_CARD', card: card('materials') });
    expect(played.pendingImpediment, 'a card interrupted the build instead of waiting for the Daily Scrum').toBeNull();
    expect(played.trainerCard?.title).toBe('The materials are delayed');
    const scrum = endDay(played);
    expect(scrum.dayStage).toBe('dailyScrum');
    expect(scrum.pendingImpediment?.title).toBe('The materials are delayed');
    expect(scrum.pendingImpediment?.itemId, 'a block names the item it is on').toBeTruthy();
    expect(scrum.trainerCard, 'the card is still waiting after it landed').toBeNull();
  });

  it('lands at once when a Daily Scrum is open with nothing on it', () => {
    const s = reducer(building({ dayStage: 'dailyScrum' }), { type: 'PLAY_TRAINER_CARD', card: card('sick') });
    expect(s.pendingImpediment?.title).toBe('A Developer is off sick');
    expect(s.pendingImpediment?.kind).toBe('impediment');
  });

  it('turns chance off, so only the trainer’s cards get in the way', () => {
    const s = rollyDay(building());
    expect(endDay(s).pendingImpediment, 'this seed should roll something').toBeTruthy();
    const led = reducer(s, { type: 'SET_TRAINER_LED', on: true });
    expect(endDay(led).pendingImpediment, 'chance still rolled with a trainer running it').toBeNull();
    const played = reducer(s, { type: 'PLAY_TRAINER_CARD', card: card('inspection') });
    expect(played.trainerLed, 'playing a card did not take over from chance').toBe(true);
  });

  it('goes in the decision log, so the debrief can read it back', () => {
    const s = reducer(building(), { type: 'PLAY_TRAINER_CARD', card: card('sick') });
    expect((s.decisions ?? []).slice(-1)[0]).toMatchObject({ kind: 'trainer', by: 'trainer' });
  });

  it('cannot be played outside a Sprint', () => {
    const s = building({ phase: 'planning' });
    const after = reducer(s, { type: 'PLAY_TRAINER_CARD', card: card('sick') });
    expect(after.trainerCard ?? null).toBeNull();
    expect(after.trainerLed ?? false).toBe(false);
    expect((after.decisions ?? []).some((d) => d.kind === 'trainer')).toBe(false);
  });
});

describe('only the trainer holds the deck', () => {
  it('is the facilitator’s, watching or not', () => {
    expect(mayTake('PLAY_TRAINER_CARD', { seat: null, observer: true, facilitator: true }).allowed).toBe(true);
    expect(mayTake('SET_TRAINER_LED', { seat: 'developer', facilitator: true }).allowed).toBe(true);
  });
  it('is nobody else’s, not even the Scrum Master’s', () => {
    for (const seat of ['product_owner', 'scrum_master', 'developer'] as const) {
      expect(mayTake('PLAY_TRAINER_CARD', { seat }).allowed, `${seat} played a card into their own Sprint`).toBe(false);
    }
  });
  it('leaves an observer who is not the trainer acting on nothing', () => {
    expect(mayTake('PLAY_TRAINER_CARD', { seat: null, observer: true }).allowed).toBe(false);
  });
});

describe('the deck', () => {
  it('offers every card in a Sprint, and says what is waiting', () => {
    const onPlay = vi.fn();
    const s = reducer(building(), { type: 'PLAY_TRAINER_CARD', card: card('materials') });
    const { container } = render(<TrainerDeck state={s} onPlay={onPlay} onSetLed={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Cards to play/ }));
    expect(container.querySelectorAll('[data-card]').length).toBe(TRAINER_CARDS.length);
    expect(container.querySelector('[data-part="trainer-queued"]')?.textContent).toMatch(/materials are delayed/);
    fireEvent.click(screen.getAllByRole('button', { name: 'Play' })[1]);
    expect(onPlay).toHaveBeenCalledWith(asPlayed(TRAINER_CARDS[1]));
  });
  it('holds its cards outside a Sprint', () => {
    render(<TrainerDeck state={building({ phase: 'planning' })} onPlay={vi.fn()} onSetLed={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Cards to play/ }));
    for (const b of screen.getAllByRole('button', { name: 'Play' })) expect(b).toBeDisabled();
  });
});
