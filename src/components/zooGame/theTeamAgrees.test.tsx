import { describe, it, expect } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SprintPlanning } from './SprintPlanning';
import { initialZooState } from './config';
import { joinTeam, splitEpic, estimateItem, availableItems, forecastWaitingOn } from './engine';
import { reducer } from './useZooGame';
import { YouContext } from './you';
import type { ZooAction, ZooGameState } from './types';

// Decisions the whole team makes, in a shared game. Each player agrees the Sprint Goal for
// themselves, and the forecast is proposed by one Developer and agreed by the others (Al, 29 Oct
// 2026; docs/ZOO_EVERYONE_A_DEVELOPER.md).

const as = (member: string, action: ZooAction) => ({ ...action, as: member }) as unknown as ZooAction;

const planning = (s: ZooGameState): ZooGameState => {
  for (const e of s.backlog.filter((i) => i.category === 'epic')) s = splitEpic(s, e.id, (e.epicMembers ?? []).map((m) => m.id));
  for (const it of s.backlog) if (it.unsized && it.category !== 'epic') s = estimateItem(s, it.id, it.trueSize ?? 5);
  return { ...s, phase: 'planning', planningTopic: 'what', sprintGoal: 'Open the Big Cats zone so families have a reason to come' } as ZooGameState;
};
const people = (...names: string[]): ZooGameState => {
  const base = initialZooState(1);
  return planning(names.reduce((s, n) => joinTeam(s, `p-${n.toLowerCase()}`, n),
    { ...base, team: { ...base.team, developers: [] } } as ZooGameState));
};
const two = (s: ZooGameState) => availableItems(s).slice(0, 2).map((it) => it.id);

describe('the forecast, with two players', () => {
  it('is proposed by whoever makes it, and waits on the other', () => {
    const s = people('Ann', 'Bo');
    const proposed = reducer(s, as('p-bo', { type: 'SET_FORECAST', ids: two(s) }));
    expect(forecastWaitingOn(proposed).map((p) => p.name)).toEqual(['Ann']);
    expect(reducer(proposed, as('p-bo', { type: 'SET_PLANNING_TOPIC', topic: 'how' })).planningTopic, 'moved on to how unagreed').toBe('what');
    expect(reducer(proposed, as('p-bo', { type: 'PLAN_SPRINT', ids: two(s) } as ZooAction)).phase, 'started unagreed').toBe('planning');
  });

  it('moves on once the others agree', () => {
    const s = people('Ann', 'Bo');
    const agreed = reducer(reducer(s, as('p-bo', { type: 'SET_FORECAST', ids: two(s) })), as('p-ann', { type: 'AGREE_FORECAST' }));
    expect(forecastWaitingOn(agreed)).toEqual([]);
    expect(reducer(agreed, as('p-ann', { type: 'SET_PLANNING_TOPIC', topic: 'how' })).planningTopic).toBe('how');
    expect(reducer(agreed, as('p-ann', { type: 'PLAN_SPRINT', ids: two(s) } as ZooAction)).phase).toBe('sprint');
  });

  it('is proposed again when somebody changes it, and everybody is asked again', () => {
    const s = people('Ann', 'Bo', 'Cy');
    const ids = two(s);
    let t = reducer(s, as('p-bo', { type: 'SET_FORECAST', ids }));
    t = reducer(t, as('p-ann', { type: 'AGREE_FORECAST' }));
    t = reducer(t, as('p-cy', { type: 'SET_FORECAST', ids: ids.slice(0, 1) }));
    expect(forecastWaitingOn(t).map((p) => p.name)).toEqual(['Ann', 'Bo']);
  });

  it('is nobody else’s to wait on with one player, or playing alone', () => {
    const one = people('Ann');
    expect(forecastWaitingOn(reducer(one, as('p-ann', { type: 'SET_FORECAST', ids: two(one) })))).toEqual([]);
    const solo = planning(initialZooState(1));
    const chosen = reducer(solo, { type: 'SET_FORECAST', ids: two(solo) });
    expect(forecastWaitingOn(chosen)).toEqual([]);
    expect(reducer(chosen, { type: 'PLAN_SPRINT', ids: two(solo) } as ZooAction).phase).toBe('sprint');
  });
});

describe('the Sprint Goal, with two players', () => {
  it('is agreed by each player for themselves, and by nobody for somebody else', () => {
    const s = people('Ann', 'Bo');
    expect(reducer(s, as('p-bo', { type: 'AGREE_SPRINT_GOAL', seat: 'p-ann' })).sprintGoalAgreed).toEqual([]);
    expect(reducer(s, as('p-bo', { type: 'AGREE_SPRINT_GOAL', seat: 'p-bo' })).sprintGoalAgreed).toEqual(['p-bo']);
  });
});

describe('the Planning screen, with two players', () => {
  const screen = (state: ZooGameState, viewer: string, mustAgree: string[] = []) => render(
    <MemoryRouter><YouContext.Provider value={viewer}>
      <SprintPlanning state={state} mustAgree={mustAgree} onPlan={() => {}} onSetForecast={() => {}} onAgreeSprintGoal={() => {}} onAgreeForecast={() => {}} onSetSprintGoal={() => {}}
        onEstimate={() => {}} onSetTasks={() => {}} onPlanShape={() => {}} onToggleGoalCritical={() => {}}
        onReorderForecast={() => {}} onRefine={() => {}} onTakeSignal={() => {}} onSplitEpic={() => {}} />
    </YouContext.Provider></MemoryRouter>).baseElement;
  const nextHow = (c: Element) => [...c.querySelectorAll('button')].find((b) => /Next: how/.test(b.textContent ?? ''))!;

  it('asks the one who did not propose the forecast to agree it, and holds topic three until they do', () => {
    const s = people('Ann', 'Bo');
    const proposed = reducer(s, as('p-bo', { type: 'SET_FORECAST', ids: two(s) }));
    const ann = screen(proposed, 'p-ann');
    expect(ann.querySelector('[data-part="forecast-agreement"]')?.textContent).toMatch(/Bo proposed this forecast\. Waiting on you/);
    expect(ann.querySelector('[data-part="agree-forecast"]')).not.toBeNull();
    expect(nextHow(ann).disabled).toBe(true);
    cleanup();
    const bo = screen(proposed, 'p-bo');
    expect(bo.querySelector('[data-part="agree-forecast"]'), 'Bo is asked to agree his own proposal').toBeNull();
  });

  it('lists each player under their own name to agree the Sprint Goal, with a button only on your own', () => {
    const c = screen({ ...people('Ann', 'Bo'), planningTopic: 'why' } as ZooGameState, 'p-ann', ['product_owner', 'p-ann', 'p-bo']);
    const rows = [...c.querySelectorAll('li')].filter((li) => /Ann|Bo|Product Owner/.test(li.textContent ?? ''));
    expect(rows.map((li) => [li.textContent?.replace(/\s+/g, ' ').trim(), !!li.querySelector('button')])).toEqual([
      ['· the Product Ownerwaiting', false], ['· Ann (you)I agree', true], ['· Bowaiting', false]]);
  });
});
