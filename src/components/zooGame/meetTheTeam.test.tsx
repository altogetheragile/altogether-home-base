import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MeetTheTeam } from './MeetTheTeam';
import { SprintPlanning } from './SprintPlanning';
import { initialZooState } from './config';
import type { ZooGameState } from './types';

// Five seats, three accountabilities, no manager - and the pull has a name on it.
//
// The roles were invisible: the game had a Scrum Team from the first Sprint and never introduced
// them, so a learner met the Product Owner as a name on a chip and found out what a Scrum Master
// was for by never needing one.

const state = (over: Partial<ZooGameState> = {}): ZooGameState =>
  ({ ...initialZooState(3), ...over }) as ZooGameState;

describe('meeting the Scrum Team', () => {
  it('introduces five people, three accountabilities and no manager', () => {
    const { container } = render(
      <MemoryRouter><MeetTheTeam state={state()} onNext={() => {}} /></MemoryRouter>,
    );
    expect(container.querySelectorAll('[data-part="seat-card"]').length, 'the team is not five seats').toBe(5);
    for (const role of ['Product Owner', 'Scrum Master', 'Developer']) {
      expect(container.textContent, `${role} is not introduced`).toContain(role);
    }
    expect(container.textContent, 'nothing says nobody assigns the work').toMatch(/Developers pull it/);
  });

  it('says where capacity comes from, in the team’s own numbers', () => {
    const { container } = render(
      <MemoryRouter><MeetTheTeam state={state()} onNext={() => {}} /></MemoryRouter>,
    );
    expect(container.textContent).toMatch(/3 Developers × a 3-day Sprint/);
    expect(container.textContent, 'capacity is a number with no story').toMatch(/points/);
  });

  it('offers no seat to pick when there is nobody to pick against', () => {
    // "Should I be able to pick a seat in single player mode?" - no. Playing alone you hold all
    // three accountabilities, and five identical buttons that do nothing is an offer the game
    // cannot keep.
    const { container } = render(<MemoryRouter><MeetTheTeam state={state()} onNext={() => {}} /></MemoryRouter>);
    const cards = [...container.querySelectorAll('[data-part="seat-card"]')];
    expect(cards.some((c) => c.querySelector('button')), 'a seat could be picked in solo play').toBe(false);
    expect(container.textContent).toMatch(/you hold all three/i);
  });

  it('marks every seat yours when you play alone, and only yours when you do not', () => {
    const solo = render(<MemoryRouter><MeetTheTeam state={state()} onNext={() => {}} /></MemoryRouter>);
    expect(solo.container.querySelectorAll('[data-part="seat-card"].border-primary').length,
      'playing alone, some accountability was said to be somebody else’s').toBe(5);
    solo.unmount();

    const seated = render(
      <MemoryRouter><MeetTheTeam state={state()} seat="product_owner" onNext={() => {}} /></MemoryRouter>,
    );
    expect(seated.container.querySelectorAll('[data-part="seat-card"].border-primary').length).toBe(1);
    expect(seated.container.textContent).toMatch(/Played by the game/);
  });

  it('leads to the brief', () => {
    const onNext = vi.fn();
    render(<MemoryRouter><MeetTheTeam state={state()} onNext={onNext} /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: /who is the zoo for/i }));
    expect(onNext).toHaveBeenCalled();
  });
});

describe('the pull at topic two', () => {
  const planning = (over: Partial<ZooGameState> = {}, props: Record<string, unknown> = {}) => {
    const base = initialZooState(3);
    const take = base.backlog.filter((it) => !it.unsized && it.category !== 'epic').slice(0, 2);
    const s = {
      ...base, phase: 'planning', planningTopic: 'what', sprintNumber: 1,
      sprintGoal: 'Deliver the Big Cats zone', sprintGoalAgreed: ['product_owner', 'developer', 'scrum_master'],
      forecast: take.map((it) => it.id), ...over,
    } as ZooGameState;
    return { s, take, ...render(
      <MemoryRouter>
        <SprintPlanning state={s} onPlan={() => {}} onSetForecast={() => {}} onEstimate={() => {}}
          onSetTasks={() => {}} onSetSprintGoal={() => {}} onRefine={() => {}} onPlanShape={() => {}}
          onToggleGoalCritical={() => {}} onTakeSignal={() => {}} onSplitEpic={() => {}} {...props} />
      </MemoryRouter>,
    ) };
  };

  it('asks which Developer pulled each item', () => {
    const onAssignDev = vi.fn();
    const { container, take, s } = planning({}, { onAssignDev });
    const who = container.querySelector('[data-part="who-pulled"]')!;
    expect(who, 'the forecast says nothing about who pulled anything').toBeTruthy();
    for (const d of s.team.developers) expect(who.textContent).toContain(d.name);
    fireEvent.click([...who.querySelectorAll('button')].find((b) => b.textContent === s.team.developers[0].name)!);
    expect(onAssignDev, 'nobody could put their name on the work').toHaveBeenCalledWith(take[0].id, s.team.developers[0].id);
  });

  it('does not let the Product Owner pull for them', () => {
    // "The Developers select; you can make the case." The Product Owner is in the room and has the
    // argument - what they do not have is the pull.
    const { container } = planning({}, { onAssignDev: () => {}, mySeat: 'product_owner' });
    const who = container.querySelector('[data-part="who-pulled"]')!;
    const buttons = [...who.querySelectorAll('button')] as HTMLButtonElement[];
    expect(buttons.every((b) => b.disabled), 'a Product Owner could pull work for the Developers').toBe(true);
    expect(buttons[0].title).toMatch(/make the case/i);
  });
});
