import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { initialZooState } from './config';
import { joinTeam, startNextSprint } from './engine';
import { reducer } from './useZooGame';
import { mayTake, refusal } from './seatRules';
import { TrainerDeck } from './TrainerDeck';
import type { ZooAction, ZooGameState } from './types';

// A player who leaves stays on the team as away (Al, 29 Oct 2026). If that player wears the Scrum
// Master hat, a blocker the team asks for help with waits on an empty chair - so the trainer can
// hand the hat to somebody who is here.

const table = (): ZooGameState => {
  const base = initialZooState(5);
  const empty = { ...base, team: { ...base.team, developers: [] } } as ZooGameState;
  return { ...joinTeam(joinTeam(joinTeam(empty, 'p-ann', 'Ann'), 'p-bo', 'Bo'), 'p-cy', 'Cy'), phase: 'sprint', dayStage: 'building' } as ZooGameState;
};
const hand = (s: ZooGameState, to: string) => reducer(s, { type: 'HAND_HAT', to } as ZooAction);

describe('the trainer hands the hat on', () => {
  it('to another player, and says so in the Sprint’s record', () => {
    const s = hand(table(), 'p-cy');
    expect(s.scrumMasterId).toBe('p-cy');
    expect(JSON.stringify(s)).toMatch(/The trainer handed the Scrum Master hat to Cy/);
  });

  it('only to somebody on the team', () => {
    expect(hand(table(), 'p-nobody').scrumMasterId).toBe('p-ann');
  });

  it('and it moves on from the new holder at the next Sprint Planning', () => {
    const s = hand(table(), 'p-bo');
    expect(startNextSprint({ ...s, phase: 'retro' } as ZooGameState, '').scrumMasterId).toBe('p-cy');
  });

  it('is the trainer’s alone', () => {
    expect(mayTake('HAND_HAT', { seat: 'developer', memberId: 'p-ann', facilitator: true }).allowed).toBe(true);
    const no = mayTake('HAND_HAT', { seat: 'developer', memberId: 'p-ann' });
    expect(no.allowed).toBe(false);
    expect(refusal(no)).toMatch(/Only the trainer hands it on/);
  });
});

describe('the trainer’s panel', () => {
  const panel = (away: string[], onHandHat = (_: string) => {}) => render(
    <TrainerDeck state={table()} onPlay={() => {}} onSetLed={() => {}} onHandHat={onHandHat} away={away} />).container;

  it('says when the hat holder is away, even closed', () => {
    expect(panel(['p-ann']).querySelector('[data-part="hat-away-hint"]')?.textContent).toMatch(/Ann wears the Scrum Master hat and is away/);
    expect(panel([]).querySelector('[data-part="hat-away-hint"]')).toBeNull();
  });

  it('offers the hat to each other player, and hands it on', () => {
    const given: string[] = [];
    const c = panel(['p-ann', 'p-cy'], (to) => given.push(to));
    fireEvent.click(c.querySelector('[data-part="trainer-deck"] > button')!);
    const buttons = [...c.querySelectorAll<HTMLButtonElement>('[data-part="hand-hat"]')];
    expect(buttons.map((b) => b.textContent)).toEqual(['Give it to Bo', 'Give it to Cy (away)']);
    expect(c.querySelector('[data-part="trainer-hat"]')?.textContent).toMatch(/They are away/);
    fireEvent.click(buttons[0]);
    expect(given).toEqual(['p-bo']);
  });
});
