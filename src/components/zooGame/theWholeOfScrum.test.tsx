import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ZooIntro } from './ZooIntro';
import { reducer } from './useZooGame';
import { initialZooState } from './config';
import { nextRung, adopted, LADDER } from './engine';
import type { ZooAction, ZooGameState } from './types';

// Every game starts with the whole of Scrum now: the Product Goal, the Product Owner's starter
// Product Backlog, Refinement and the Definition of Done, Sprint Planning, the Sprint, the Review
// and the Retrospective (docs/ZOO_GAME_FLOW.md, Al, 1 November 2026). Starting on a planned
// Sprint 1 is a trainer's preset, not a learner's choice.

describe('the way in', () => {
  it('is one button', () => {
    const c = render(<MemoryRouter><ZooIntro productGoal="Open a big cat zone" onSetGoal={() => {}} onStart={() => {}} /></MemoryRouter>).container;
    const starts = [...c.querySelectorAll('button')].filter((b) => /^Start/.test(b.textContent ?? ''));
    expect(starts.map((b) => b.textContent)).toEqual(['Start →']);
    expect(c.textContent, 'the long way round is still offered as a second door').not.toMatch(/Write the Product Backlog myself/);
    expect(c.textContent).toMatch(/Priya hands over her starter Product Backlog/);
  });
});

describe('a game started from the Product Goal', () => {
  const started = (): ZooGameState => reducer(initialZooState(1), { type: 'START_FROM_THE_BRIEF' } as ZooAction);

  it('goes to the Product Owner’s starter, with nothing already planned', () => {
    const s = started();
    expect(s.phase).toBe('brief');
    expect(s.backlog).toEqual([]);
  });

  it('has every practice from the first Sprint, so the Retrospective hands none over', () => {
    const s = started();
    for (const r of LADDER) expect(adopted(s, r.key), `${r.key} has to be earned`).toBe(true);
    expect(nextRung(s)).toBeNull();
  });

  it('arrives with a Definition of Done for the team to agree at Refinement, not one already agreed', () => {
    const s = started();
    expect(s.definitionOfDone.length, 'nothing to start the Definition of Done from').toBeGreaterThan(0);
    expect(s.dodAgreed).toBeFalsy();
  });
});
