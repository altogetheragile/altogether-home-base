import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SprintRetro } from './SprintRetro';
import { initialZooState, DEFAULT_DOD } from './config';
import { startOnTheBoard, reviewSprint, isReady, hasGround } from './engine';
import { reducer } from './useZooGame';
import type { ZooGameState } from './types';

// Sprint 1 arrives the way a Sprint arrives on somebody's first day at a job: already planned.
//
// A learner used to meet Scrum before they met the zoo - a page about Scrum, then the team, then the
// brief, then refinement, then three topics of Sprint Planning, and only then something to build.
// Five screens of being told, before one thing done. Everything on them is worth learning and none
// of it is worth learning THEN, because none of it is yet an answer to a question the learner has.
//
// The screens are all still in the game. They are what the Retrospective hands over, one at a time,
// once the team has felt the lack of them - starting with the Definition of Done, which Sprint 1
// deliberately does not have.

const started = (): ZooGameState => startOnTheBoard(initialZooState(1) as ZooGameState);

describe('a new game', () => {
  it('is already building, with the clock about to run', () => {
    const s = started();
    expect(s.phase, 'the learner was sent to a form instead of the board').toBe('sprint');
    expect(s.sprintNumber).toBe(1);
    expect(s.dayNumber).toBe(1);
    expect(s.dayStage, 'the first day had not begun').toBe('building');
  });

  it('arrives with a Goal the whole team has agreed', () => {
    const s = started();
    expect(s.sprintGoal, 'nobody had said what the Sprint was for').toMatch(/so that/i);
    expect([...(s.sprintGoalAgreed ?? [])].sort(),
      'the Sprint arrived planned but not agreed, which is nobody’s Sprint')
      .toEqual(['developer', 'product_owner', 'scrum_master']);
  });

  it('arrives with a forecast the Developers could have chosen', () => {
    const s = started();
    const board = s.backlog.filter((it) => it.status === 'committed' && it.sprintNumber === 1);
    expect(board.length, 'the board is empty, or unreadable on a first morning').toBeGreaterThan(1);
    expect(board.length).toBeLessThanOrEqual(3);
    const points = board.reduce((n, it) => n + it.estimate, 0);
    expect(points, 'the Developers forecast more than the Sprint holds').toBeLessThanOrEqual(s.sprintForecast);
    // One area: a first Sprint that reaches across the whole park has no slice in it.
    for (const it of board) expect(hasGround(s, it.zone), `${it.name} is in ground the zoo does not have`).toBe(true);
    // ...and each card carries the Developers' own plan, which is the third topic of Planning.
    for (const it of board) expect((it.tasks ?? []).length, `${it.name} arrived with no plan`).toBeGreaterThan(0);
  });

  it('puts the habitat before the animal that lives in it', () => {
    // The Product Backlog is ordered by value, which puts the lion above its pen. The Sprint
    // Backlog's order is the Developers', and they know the pen has to exist first.
    const s = started();
    const board = s.backlog.filter((it) => it.status === 'committed' && it.sprintNumber === 1);
    for (const [i, it] of board.entries()) {
      if (!it.enclosureId) continue;
      const pen = board.findIndex((x) => x.id === it.enclosureId);
      if (pen < 0) continue;
      expect(pen, `${it.name} is on the board above the ${board[pen].name} it lives in`).toBeLessThan(i);
    }
  });

  it('has no Definition of Done', () => {
    // The whole design: a game that opens by asking what Done means is asking for a rule about a job
    // nobody has done yet, and gets one written out of politeness.
    const s = started();
    expect(s.definitionOfDone, 'Sprint 1 was handed the answer it is supposed to earn').toEqual([]);
    expect(s.dodAgreed).toBe(false);
  });

  it('is what pressing Start gives you', () => {
    const s = reducer(initialZooState(1) as ZooGameState, { type: 'START' });
    expect(s.phase, 'the one button still leads to a form').toBe('sprint');
    expect(s.backlog.some((it) => it.status === 'committed'), 'the board is empty').toBe(true);
  });

  it('still offers the long way round, for a group that wants it', () => {
    const s = reducer(initialZooState(1) as ZooGameState, { type: 'START_FROM_THE_BRIEF' });
    expect(s.phase, 'writing the Product Backlog yourself is no longer possible').toBe('brief');
    expect(s.backlog, 'the brief starts from a Product Backlog somebody else wrote').toEqual([]);
  });

  it('leaves the rest of the zoo unplannable until its ground is earned', () => {
    const s = started();
    const far = s.backlog.find((it) => !hasGround(s, it.zone) && it.category !== 'epic');
    if (far) expect(isReady(far, s), 'the whole park was plannable on day one').toBe(false);
  });
});

describe('the Retrospective hands over the Definition of Done', () => {
  const retro = (s: ZooGameState) => render(
    <MemoryRouter>
      <SprintRetro state={{ ...s, phase: 'retro' } as ZooGameState}
        onNextSprint={() => {}} onSetDod={() => {}} />
    </MemoryRouter>,
  );

  it('says what shipped without one, in this zoo', () => {
    const s = reviewSprint(started());
    const { container } = retro(s);
    fireEvent.click(screen.getByRole('button', { name: /what we will change/i }));
    const said = container.querySelector('[data-part="dod-handover"]');
    expect(said, 'the Retrospective said nothing about the missing Definition of Done').toBeTruthy();
    expect(said!.textContent).toMatch(/no Definition of Done/i);
    expect(said!.textContent, 'it does not say why it is worth having NOW').toMatch(/now you know what it is for/i);
  });

  it('offers one to adopt, and it is the game’s own', () => {
    const s = reviewSprint(started());
    const taken: string[][] = [];
    render(
      <MemoryRouter>
        <SprintRetro state={{ ...s, phase: 'retro' } as ZooGameState}
          onNextSprint={() => {}} onSetDod={(d) => taken.push(d)} />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: /what we will change/i }));
    fireEvent.click(screen.getByRole('button', { name: /Adopt this Definition of Done/i }));
    expect(taken[0], 'adopting it handed over something other than the game’s own bar').toEqual([...DEFAULT_DOD]);
  });

  it('says nothing once the team has one', () => {
    const s = { ...reviewSprint(started()), definitionOfDone: [...DEFAULT_DOD] } as ZooGameState;
    const { container } = retro(s);
    fireEvent.click(screen.getByRole('button', { name: /what we will change/i }));
    expect(container.querySelector('[data-part="dod-handover"]'),
      'a team with a Definition of Done was told it had none').toBeNull();
  });
});
