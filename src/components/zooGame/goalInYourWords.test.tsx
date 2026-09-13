import { describe, it, expect } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SprintPlanning } from './SprintPlanning';
import { initialZooState } from './config';
import { rewordSprintGoal, goalCandidates, splitEpic, estimateItem } from './engine';
import type { ZooGameState } from './types';

// The wand rewords what the learner wrote.
//
// Asked for while playing it: "to support learning can the wizard reword a goal for a learner and
// not just write it?" Writing one from nothing does the single piece of thinking the screen exists
// to teach - the learner reads a good Sprint Goal and learns that the button makes good Sprint
// Goals. Rewording is the opposite move: their idea survives, and the game says what a Goal needs
// that their sentence did not have.
//
// So the button does both, and which one it does is decided by whether they have had a go.

const planning = (goal = ''): ZooGameState => {
  let s = initialZooState(1) as ZooGameState;
  for (const e of s.backlog.filter((i) => i.category === 'epic')) {
    s = splitEpic(s, e.id, (e.epicMembers ?? []).map((m) => m.id));
  }
  for (const it of s.backlog) if (it.unsized && it.category !== 'epic') s = estimateItem(s, it.id, it.trueSize ?? 5);
  return { ...s, phase: 'planning', planningTopic: 'why', sprintGoal: goal } as ZooGameState;
};

const planningPanel = (state: ZooGameState, onSetSprintGoal: (g: string) => void = () => {}) => (
  <MemoryRouter>
    <SprintPlanning state={state} onPlan={() => {}} onSetForecast={() => {}} onSetSprintGoal={onSetSprintGoal}
      onEstimate={() => {}} onSetTasks={() => {}} onPlanShape={() => {}} onToggleGoalCritical={() => {}}
      onReorderForecast={() => {}} onRefine={() => {}} onTakeSignal={() => {}} onSplitEpic={() => {}} />
  </MemoryRouter>
);
const panel = (state: ZooGameState, onSetSprintGoal: (g: string) => void = () => {}) =>
  render(planningPanel(state, onSetSprintGoal));

describe('what the wand does with what you wrote', () => {
  it('keeps your words and adds what the work is for', () => {
    const items = goalCandidates(planning());
    const out = rewordSprintGoal('Build the lion enclosure', items);
    expect(out.goal, 'the learner’s own words were thrown away').toMatch(/build the lion enclosure/i);
    expect(out.goal, 'a Goal with no "so that" is a plan').toMatch(/so that/i);
    expect(out.goal, 'it says deliver build, which is nobody’s English').not.toMatch(/deliver build/i);
    expect(out.note, 'nothing said what was changed, or why').toMatch(/what the work is FOR/i);
  });

  it('keeps one goal out of a list of work', () => {
    const items = goalCandidates(planning());
    const out = rewordSprintGoal('Lion enclosure. Tiger enclosure. Kiosk.', items);
    expect(out.goal, 'the second and third goals came along too').not.toMatch(/tiger/i);
    expect(out.goal, 'a bare name was left without an article').toMatch(/deliver the lion enclosure/i);
    expect(out.note).toMatch(/one thing the whole team can commit to/i);
  });

  it('leaves a Goal that is already a Goal nearly alone', () => {
    const items = goalCandidates(planning());
    const said = 'Open the Big Cats so that families have something to see';
    const out = rewordSprintGoal(said, items);
    expect(out.goal).toBe('Our goal is to open the Big Cats so that families have something to see');
    expect(out.note, 'it invented a fault to report').toMatch(/already a Goal/i);
  });

  it('does not mangle somebody who is shouting', () => {
    const out = rewordSprintGoal('OPEN THE SAVANNA', goalCandidates(planning()));
    expect(out.goal, 'it lowercased the first letter of a shout: "oPEN THE SAVANNA"').toMatch(/OPEN THE SAVANNA/);
  });
});

describe('the button', () => {
  it('offers to reword what is there, and to write one when there is nothing', () => {
    const { rerender } = panel(planning());
    expect(screen.getByRole('button', { name: /Word it for me/ }),
      'an empty box was offered a rewording of nothing').toBeTruthy();
    rerender(planningPanel(planning('Build the lion enclosure')));
    expect(screen.getByRole('button', { name: /Reword mine/ }),
      'a learner who had a go was offered a goal written for them instead').toBeTruthy();
  });

  it('says what it changed, once it has changed it', () => {
    const said: string[] = [];
    const { container, rerender } = panel(planning('Build the lion enclosure'), (g) => said.push(g));
    fireEvent.click(screen.getByRole('button', { name: /Reword mine/ }));
    expect(said[0], 'the Goal was not reworded at all').toMatch(/so that/i);
    rerender(planningPanel(planning(said[0])));
    expect(container.querySelector('[data-part="reworded"]'),
      'it reworded the Goal and said nothing about why').toBeTruthy();
  });
});

describe('the example', () => {
  it('is beside the box, not inside it', () => {
    // Reported from playing it: "text is large and hard to read the example template for a Sprint
    // Goal". As a placeholder it was set in the same large type as the Goal and ran off its own line.
    const { container } = panel(planning());
    const box = container.querySelector('textarea')!;
    expect(box.getAttribute('placeholder'), 'the example is still inside the box')
      .not.toMatch(/Savanna/);
    expect(box.className, 'the Goal box is still set in display type').not.toMatch(/text-lg/);
    expect(container.textContent, 'the example went away with the placeholder').toMatch(/For example/i);
  });
});
