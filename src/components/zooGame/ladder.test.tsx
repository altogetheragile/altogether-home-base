import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SprintRetro } from './SprintRetro';
import { SprintPlanning } from './SprintPlanning';
import { ProductBacklogSidebar } from './Board';
import { initialZooState, DEFAULT_DOD } from './config';
import { LADDER, nextRung, adopt, adopted, startOnTheBoard, reviewSprint, startNextSprint, decisionsIn } from './engine';
import type { ZooGameState } from './types';

// One practice per Sprint, and only once it has been missed.
//
// Scrum has a lot of parts, and a game that hands over all of them on the first screen teaches the
// shape of a syllabus rather than the point of a practice. So the game starts with the smallest
// thing that is still Scrum, and every Retrospective offers ONE more - named against what its
// absence just cost.
//
// A practice that has not been adopted is ABSENT. Not greyed out, not padlocked, not behind a
// tooltip promising it later: a padlock teaches that the game is withholding something, and an
// absence teaches nothing at all - which is right, because a learner who has not missed Sprint
// Planning has no question that Sprint Planning is the answer to.

const started = (): ZooGameState => startOnTheBoard(initialZooState(1) as ZooGameState);

describe('the ladder', () => {
  it('starts with the Definition of Done and ends with the bet', () => {
    expect(LADDER.map((r) => r.key)).toEqual([
      'definition-of-done', 'sprint-planning', 'refinement', 'sprint-bet',
    ]);
  });

  it('offers one rung at a time, in order', () => {
    let s = started();
    expect(nextRung(s)!.key, 'the first thing offered was not the Definition of Done').toBe('definition-of-done');
    s = { ...s, definitionOfDone: [...DEFAULT_DOD] };
    expect(nextRung(s)!.key).toBe('sprint-planning');
    s = adopt(s, 'sprint-planning');
    expect(nextRung(s)!.key).toBe('refinement');
    s = adopt(s, 'refinement');
    expect(nextRung(s)!.key).toBe('sprint-bet');
    s = adopt(s, 'sprint-bet');
    expect(nextRung(s), 'the ladder never ends').toBeNull();
  });

  it('says what each rung is for, and what taking it on changes', () => {
    for (const r of LADDER) {
      expect(r.because.length, `${r.label} does not say what its absence costs`).toBeGreaterThan(40);
      expect(r.changes.length, `${r.label} does not say what it changes`).toBeGreaterThan(30);
    }
  });

  it('cannot be taken on twice, or out of nothing', () => {
    const s = adopt(started(), 'sprint-planning');
    expect(adopt(s, 'sprint-planning'), 'the same practice was taken on twice').toBe(s);
    expect(adopt(s, 'making-tea'), 'the game took on a practice it has never heard of').toBe(s);
  });

  it('goes in the log, because it is how the team has decided to work', () => {
    const s = adopt(started(), 'sprint-planning');
    const said = decisionsIn(s, s.sprintNumber).map((d) => `${d.what} ${d.cost ?? ''}`).join(' | ');
    expect(said).toMatch(/took on sprint planning/i);
  });
});

describe('what is absent before it is taken on', () => {
  it('is Sprint Planning: the next Sprint arrives planned, as the first one did', () => {
    const s = reviewSprint(started());
    const next = startNextSprint(s, '');
    expect(next.phase, 'a team that has never planned was sent to Sprint Planning').toBe('sprint');
    expect(next.sprintNumber).toBe(2);
    expect(next.sprintGoal, 'the Sprint it was handed has no Goal').toMatch(/so that/i);
    expect(next.backlog.some((it) => it.status === 'committed' && it.sprintNumber === 2),
      'it was handed a Sprint with nothing in it').toBe(true);
  });

  it('...and once it is taken on, the team plans its own', () => {
    const s = adopt(reviewSprint(started()), 'sprint-planning');
    expect(startNextSprint(s, '').phase, 'taking Planning on changed nothing').toBe('planning');
  });

  it('is refinement: the Product Backlog can be read, not worked on', () => {
    const s = started();
    const before = render(<ProductBacklogSidebar state={s} mode="refine" onAddPbi={() => {}} onRefinePbi={() => {}} onSetUseStories={() => {}} />);
    expect(before.container.textContent, 'sizing was offered to a team that has not taken refinement on')
      .not.toMatch(/Size it|Split it up/);
    before.unmount();

    const after = render(<ProductBacklogSidebar state={adopt(s, 'refinement')} mode="refine" onAddPbi={() => {}} onRefinePbi={() => {}} onSetUseStories={() => {}} />);
    expect(after.container.textContent, 'taking refinement on gave the team nothing')
      .toMatch(/Size it|Split it up/);
  });

  it('is the bet: Planning does not ask for a prediction', () => {
    const planning = (s: ZooGameState) => render(
      <MemoryRouter>
        <SprintPlanning state={{ ...s, phase: 'planning', planningTopic: 'what' } as ZooGameState}
          onPlan={() => {}} onSetForecast={() => {}} onSetSprintGoal={() => {}} onSetBet={() => {}}
          onEstimate={() => {}} onSetTasks={() => {}} onPlanShape={() => {}} onToggleGoalCritical={() => {}}
          onReorderForecast={() => {}} onRefine={() => {}} onTakeSignal={() => {}} onSplitEpic={() => {}} />
      </MemoryRouter>,
    );
    // Topic two, where the forecast is made and the bet sits beside it.
    const before = planning(started());
    expect(before.container.textContent, 'a team on its first Sprint was asked to bet').not.toMatch(/the bet/i);
    before.unmount();
    expect(planning(adopt(started(), 'sprint-bet')).container.textContent,
      'taking the bet on gave the team nothing').toMatch(/bet/i);
  });
});

describe('the Retrospective is where a practice arrives from', () => {
  const retro = (s: ZooGameState, onAdopt: (k: string) => void = () => {}) => render(
    <MemoryRouter>
      <SprintRetro state={{ ...s, phase: 'retro' } as ZooGameState}
        onNextSprint={() => {}} onSetDod={() => {}} onAdopt={onAdopt} />
    </MemoryRouter>,
  );

  it('offers the next rung, with what its absence has cost', () => {
    const s = { ...reviewSprint(started()), definitionOfDone: [...DEFAULT_DOD] } as ZooGameState;
    const { container } = retro(s);
    fireEvent.click(screen.getByRole('button', { name: /what we will change/i }));
    const panel = container.querySelector('[data-part="next-rung"]')!;
    expect(panel, 'the Retrospective offered nothing to take on').toBeTruthy();
    expect(panel.getAttribute('data-key')).toBe('sprint-planning');
    expect(panel.textContent, 'it does not say what has been costing them').toMatch(/somebody else wrote the Goal/i);
  });

  it('offers exactly one, however many are outstanding', () => {
    const s = { ...reviewSprint(started()), definitionOfDone: [...DEFAULT_DOD] } as ZooGameState;
    const { container } = retro(s);
    fireEvent.click(screen.getByRole('button', { name: /what we will change/i }));
    expect(container.querySelectorAll('[data-part="next-rung"]').length,
      'the Retrospective handed over a syllabus').toBe(1);
  });

  it('takes it on when the team says so', () => {
    const s = { ...reviewSprint(started()), definitionOfDone: [...DEFAULT_DOD] } as ZooGameState;
    const took: string[] = [];
    retro(s, (k) => took.push(k));
    fireEvent.click(screen.getByRole('button', { name: /what we will change/i }));
    fireEvent.click(screen.getByRole('button', { name: /We’ll do that from now on/i }));
    expect(took, 'saying yes took nothing on').toEqual(['sprint-planning']);
  });

  it('says nothing more once the team has the lot', () => {
    let s = { ...reviewSprint(started()), definitionOfDone: [...DEFAULT_DOD] } as ZooGameState;
    for (const r of LADDER) s = adopt(s, r.key);
    const { container } = retro(s);
    fireEvent.click(screen.getByRole('button', { name: /what we will change/i }));
    expect(container.querySelector('[data-part="next-rung"]'),
      'a team with every practice was offered another').toBeNull();
    expect(LADDER.every((r) => adopted(s, r.key))).toBe(true);
  });
});
