import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { initialZooState } from './config';
import { joinTeam } from './engine';
import { reducer } from './useZooGame';
import { mayDo, withTheHat } from './seatRules';
import { DailyScrum } from './DailyScrum';
import { YouContext } from './you';
import { SHIPPED_TRAINER_CARDS, asPlayed, type PlayedCard } from './trainerCards';
import type { Impediment, ZooAction, ZooGameState } from './types';

// "I'm not sure a SM unilaterally decides this - the default is always ask the team." In a shared
// game the Developers answer what surfaced first; removing or escalating it is the Scrum Master
// hat holder's, and only once the team has asked (docs/ZOO_EVERYONE_A_DEVELOPER.md).

const as = (member: string, action: ZooAction) => ({ ...action, as: member }) as unknown as ZooAction;
const supplier: Impediment = { id: 'imp-1', title: 'Supplier late', detail: 'The fencing has not arrived.', kind: 'impediment' };

const atTheDailyScrum = (s: ZooGameState): ZooGameState => ({ ...s, phase: 'sprint', dayStage: 'dailyScrum',
  sprintNumber: 1, dayNumber: 2, pendingImpediment: supplier } as ZooGameState);
/** Ann holds the hat; Bo is the other Developer. */
const shared = (): ZooGameState => {
  const base = initialZooState(5);
  const empty = { ...base, team: { ...base.team, developers: [] } } as ZooGameState;
  return atTheDailyScrum(joinTeam(joinTeam(empty, 'p-ann', 'Ann'), 'p-bo', 'Bo'));
};

describe('a blocker in a shared game', () => {
  it('cannot be removed or escalated until the team asks the Scrum Master', () => {
    const s = shared();
    expect(reducer(s, as('p-ann', { type: 'ANSWER_IMPEDIMENT', how: 'remove' })).pendingImpediment).toEqual(supplier);
    expect(reducer(s, as('p-ann', { type: 'ANSWER_IMPEDIMENT', how: 'escalate' })).pendingImpediment).toEqual(supplier);
  });

  it('is the team’s to clear or work around, whoever holds the hat', () => {
    const bo = withTheHat({ seat: 'developer', memberId: 'p-bo' }, shared());
    expect(mayDo({ type: 'ANSWER_IMPEDIMENT', how: 'team' }, bo).allowed).toBe(true);
    expect(mayDo({ type: 'ANSWER_IMPEDIMENT', how: 'around' }, bo).allowed).toBe(true);
    expect(mayDo({ type: 'ASK_SCRUM_MASTER' }, bo).allowed).toBe(true);
    expect(mayDo({ type: 'ANSWER_IMPEDIMENT', how: 'remove' }, bo).allowed, 'Bo removed it without the hat').toBe(false);
    expect(reducer(shared(), as('p-bo', { type: 'ANSWER_IMPEDIMENT', how: 'around' })).pendingImpediment).toBeNull();
  });

  it('once asked, is the hat holder’s to remove, and the asking is said in the room', () => {
    const asked = reducer(shared(), as('p-bo', { type: 'ASK_SCRUM_MASTER' }));
    expect(asked.pendingImpediment?.askedSm).toBe(true);
    expect(asked.chat![asked.chat!.length - 1]).toMatchObject({ from: 'Bo', text: expect.stringMatching(/^Ann, can you help with Supplier late/) });
    expect(reducer(asked, as('p-ann', { type: 'ANSWER_IMPEDIMENT', how: 'remove' })).pendingImpediment).toBeNull();
  });

  it('lands on the Scrum Master directly only when the trainer’s card says it does', () => {
    const play = (card: PlayedCard) => reducer({ ...shared(), pendingImpediment: null }, { type: 'PLAY_TRAINER_CARD', card } as ZooAction);
    const sick = asPlayed(SHIPPED_TRAINER_CARDS.find((c) => c.id === 'sick')!);
    expect(play(sick).pendingImpediment?.askedSm, 'the team was not asked first').toBeFalsy();
    expect(play({ ...sick, landsOn: 'Scrum Master' }).pendingImpediment?.askedSm).toBe(true);
  });
});

describe('a blocker playing alone', () => {
  it('keeps all four answers, because you are the whole team', () => {
    const solo = atTheDailyScrum(initialZooState(5));
    expect(reducer(solo, { type: 'ANSWER_IMPEDIMENT', how: 'remove' }).pendingImpediment).toBeNull();
    const shown = render(<DailyScrum state={solo} onHold={() => {}} onSkip={() => {}} onAnswer={() => {}} />).container;
    expect([...shown.querySelectorAll('[data-answer]')].map((b) => b.getAttribute('data-answer'))).toEqual(['team', 'remove', 'around', 'escalate']);
  });
});

describe('the Daily Scrum screen in a shared game', () => {
  const answers = (state: ZooGameState, viewer: string, onAsk = () => {}) => {
    const c = render(<YouContext.Provider value={viewer}>
      <DailyScrum state={state} onHold={() => {}} onSkip={() => {}} onAnswer={() => {}} onAskScrumMaster={onAsk} />
    </YouContext.Provider>).container;
    return [...c.querySelectorAll<HTMLButtonElement>('[data-answer]')];
  };

  it('offers the team its own two answers and asking the hat holder', () => {
    let asked = 0;
    const shown = answers(shared(), 'p-bo', () => { asked++; });
    expect(shown.map((b) => b.textContent)).toEqual([
      expect.stringMatching(/^We will clear it ourselves/), expect.stringMatching(/^We will work around it/), expect.stringMatching(/^Ask Ann to help/)]);
    fireEvent.click(shown[2]);
    expect(asked).toBe(1);
  });

  it('once asked, offers removing and escalating to the hat holder only', () => {
    const asked = reducer(shared(), as('p-bo', { type: 'ASK_SCRUM_MASTER' }));
    expect(answers(asked, 'p-ann').map((b) => [b.getAttribute('data-answer'), b.disabled])).toEqual([['remove', false], ['escalate', false]]);
    expect(answers(asked, 'p-bo').every((b) => b.disabled), 'Bo can answer for the Scrum Master').toBe(true);
  });
});
