import { describe, it, expect } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import { DodHandover } from './DodHandover';
import { SprintRetro } from './SprintRetro';
import { initialZooState, DEFAULT_DOD } from './config';
import { startOnTheBoard, setDefinitionOfDone, pokerHand, decisionsIn } from './engine';
import { reducer } from './useZooGame';
import type { ZooGameState } from './types';

// The Definition of Done a team adopts has to register.
//
// Reported from a play-through: at the Sprint 1 Retrospective they pressed "Adopt this Definition of
// Done". Sprint 2's Learn panel duly showed three things every item must be - and Sprint 2's
// Decision Log opened with "Nobody agreed a Definition of Done", the estimation dialog said the
// same, and the poker hands stayed wide. The game shows you three, then tells you that you have
// none.
//
// This is the spine of the whole game. The player is taught that a missing Definition of Done cost
// them 480 worthless visits, they act on it, and the game refuses to notice.
//
// Two flags for one fact, and the fact fell down the gap: `definitionOfDone` was the text and
// `dodAgreed` was the agreement, and the one button that exists to agree it set only the text.
// Writing one IS agreeing it - the whole Scrum Team is sitting here. The only Definition of Done
// nobody has agreed is the one nobody wrote: the suggestion the wizard opens with.

const sprint = (): ZooGameState => startOnTheBoard(initialZooState(1) as ZooGameState);

describe('adopting a Definition of Done', () => {
  it('registers as agreed, not just as text somewhere', () => {
    const s = sprint();
    expect(s.definitionOfDone, 'Sprint 1 is meant to run without one').toEqual([]);
    const after = setDefinitionOfDone(s, [...DEFAULT_DOD], 'scrum_master');
    expect(after.definitionOfDone.length, 'the lines were not written down').toBe(DEFAULT_DOD.length);
    expect(after.dodAgreed, 'they adopted it and the game says nobody agreed one').toBe(true);
  });

  it('stops the next Sprint saying nobody agreed one', () => {
    // Sprint 1's own log says what was true then - there was none - and that line stays, because it
    // is history. What must change is the log of the Sprint AFTER they adopted one.
    const first = sprint();
    expect((first.decisions ?? []).filter((d) => d.kind === 'dod').map((d) => d.what).join(' '),
      'Sprint 1 ran with no Definition of Done and its log said three of them stood')
      .toMatch(/No Definition of Done/i);

    let s = setDefinitionOfDone(first, [...DEFAULT_DOD], 'scrum_master');
    s = reducer({ ...s, phase: 'retro' } as ZooGameState, { type: 'START_NEXT_SPRINT', improvement: '' } as never);
    const said = decisionsIn(s, s.sprintNumber).filter((d) => d.kind === 'dod').map((d) => d.what).join(' ');
    expect(said, `the next Sprint's log still says nobody agreed one: ${said}`).not.toMatch(/Nobody agreed/i);
    expect(said, 'the next Sprint was not told what Done means').toMatch(/the Scrum Team agreed/i);
  });

  it('narrows the estimates, because they are now guesses at the same thing', () => {
    const s = sprint();
    const it0 = s.backlog.find((x) => x.status === 'committed')!;
    const spread = (hand: number[]) => Math.max(...hand) - Math.min(...hand);
    expect(spread(pokerHand(it0, s.gameSeed, false)), 'this test needs a hand that disagrees with itself')
      .toBeGreaterThan(0);
    expect(spread(pokerHand(it0, s.gameSeed, true)),
      'agreeing what Done means changed nothing about what the team is estimating')
      .toBeLessThan(spread(pokerHand(it0, s.gameSeed, false)));
  });

  it('is what the button on the Retrospective does', () => {
    const s = sprint();
    let dod: string[] = [];
    render(<DodHandover state={s} onSetDod={(d) => { dod = d; }} />);
    fireEvent.click(screen.getByText(/Adopt this Definition of Done/i));
    expect(dod.length, 'the button handed over nothing').toBe(DEFAULT_DOD.length);
    expect(setDefinitionOfDone(s, dod, 'scrum_master').dodAgreed,
      'the one button that exists to agree it does not agree it').toBe(true);
  });
});

describe('a number that only counts if Done means one thing', () => {
  const retro = (s: ZooGameState) => render(
    <SprintRetro state={{ ...s, phase: 'retro', velocity: [8] } as ZooGameState}
      onNextSprint={() => {}} onSetDod={() => {}} onSetSprintDays={() => {}} />,
  ).container;

  it('calls velocity a guess while nobody has agreed a Definition of Done', () => {
    // The screen makes its own argument - "without it the estimates are guesses at different pieces
    // of work" - and then called the number they add up to measured, two lines later.
    expect(retro(sprint()).textContent, 'velocity with no agreed bar was reported as measured')
      .toMatch(/it is a guess/i);
  });

  it('calls it measured once they have', () => {
    const agreed = setDefinitionOfDone(sprint(), [...DEFAULT_DOD], 'scrum_master');
    const said = retro(agreed).textContent ?? '';
    expect(said, 'a team that agreed what Done means is still told their velocity is a guess')
      .not.toMatch(/it is a guess/i);
    expect(said).toMatch(/measured, not chosen/i);
  });
});
