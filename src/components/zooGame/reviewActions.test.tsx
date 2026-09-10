import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ZooFinal } from './ZooFinal';
import { ZooIntro } from './ZooIntro';
import { SprintRetro } from './SprintRetro';
import { SprintPlanning } from './SprintPlanning';
import { initialZooState, DAY_SECONDS } from './config';
import { reducer } from './useZooGame';
import { suggestTasks, startItem, buildItem } from './engine';
import { presetFor } from './design';
import { readSave, stampSave, SAVE_VERSION } from './zooSaves';
import type { ZooGameState } from './types';

// The correctness items from the consolidated review, held as rules.
//
// Four screens that told a learner something untrue, or told them nothing when they needed it most,
// or offered a decision only a mouse could take. And one recompute that ran once a second for no
// reason. Each one is small; what they have in common is that none of them could be seen from the
// screen they were on.

const finished = (over: Partial<ZooGameState> = {}) => render(
  <ZooFinal state={{ ...initialZooState(3), phase: 'final', sprintNumber: 3, ...over } as ZooGameState}
    onReset={() => {}} />,
).container.textContent ?? '';

describe('the ending', () => {
  it('does not congratulate a Product Owner who stopped short', () => {
    // "End it here anyway" is offered at the Review below the bar, and it is a real decision. The
    // ending used to answer it with "You reached the Product Goal in 3 Sprints".
    const text = finished({ happiness: [10] } as Partial<ZooGameState>);
    expect(text, 'the game claimed a goal the player had just declined to reach')
      .not.toMatch(/You reached the Product Goal/);
    expect(text, 'stopping short was not acknowledged at all').toMatch(/called it here|stopped after/i);
  });

  it('celebrates one that was actually reached', () => {
    // The same measure the Review offers "wrap up" on, so the two cannot disagree.
    const text = finished({ happiness: [80], lastReview: { totalAttendance: 900, overallHappiness: 80 } } as never);
    expect(text).toMatch(/You reached the Product Goal in 3 Sprints/);
  });
});

describe('the Product Goal', () => {
  it('cannot be left empty on the way in', () => {
    const { container } = render(
      <ZooIntro productGoal="" onSetGoal={() => {}} onStart={() => {}} />,
    );
    const start = [...container.querySelectorAll('button')].find((b) => /Start building/.test(b.textContent ?? ''))!;
    expect(start, 'there is no way to start at all').toBeTruthy();
    expect(start.disabled, 'the game started with no Product Goal to aim at').toBe(true);
    expect(container.textContent, 'nothing said why the button was dead').toMatch(/Write a Product Goal first/i);
  });
});

describe('the Retrospective', () => {
  it('shows what the Sprint cost and earned even when nothing was logged', () => {
    // The numbers sat inside the decision log's own guard, so they vanished for the team that had
    // over-forecast and delivered nothing - the team the numbers are for.
    const state = {
      ...initialZooState(3), phase: 'retro', sprintNumber: 1, decisions: [],
      velocity: [0], sprintGoalMet: false,
    } as ZooGameState;
    const text = render(<SprintRetro state={state} onNextSprint={() => {}} onSetDod={() => {}} />).container.textContent ?? '';
    expect(text, 'a Sprint with no log showed no numbers either').toMatch(/What it cost, and what it earned/);
    expect(text).toMatch(/Delivered \d+ of \d+ points/);
  });
});

describe('marking an item essential to the Sprint Goal', () => {
  it('is a control anybody can reach, not a span a mouse can hit', () => {
    const s = { ...initialZooState(3), phase: 'planning', planningTopic: 'how', sprintNumber: 2 } as ZooGameState;
    // Forecast, which is what the Sprint Backlog list at topic three is drawn from.
    const take = s.backlog.filter((it) => !it.unsized && it.category !== 'epic' && it.status === 'backlog').slice(0, 2);
    expect(take.length, 'this test needs something to forecast').toBeGreaterThan(0);
    const state = { ...s, forecast: take.map((it) => it.id) } as ZooGameState;
    const onToggleGoalCritical = vi.fn();
    const { container } = render(<MemoryRouter>
      <SprintPlanning state={state} onPlan={() => {}} onSetForecast={() => {}} onEstimate={() => {}}
        onSetTasks={() => {}} onSetSprintGoal={() => {}} onRefine={() => {}} onPlanShape={() => {}}
        onToggleGoalCritical={onToggleGoalCritical} onTakeSignal={() => {}} onSplitEpic={() => {}} />
    </MemoryRouter>);
    const star = container.querySelector('[data-part="goal-critical"]') as HTMLButtonElement | null;
    expect(star, 'no way to mark an item essential').toBeTruthy();
    expect(star!.tagName, 'the star is not a control at all').toBe('BUTTON');
    expect(star!.closest('button') === star, 'a button inside a button: the browser decides what happens').toBe(true);
    expect(star!.getAttribute('aria-pressed'), 'nothing announced whether it is on').toBeTruthy();
    fireEvent.click(star!);
    expect(onToggleGoalCritical).toHaveBeenCalled();
  });
});

describe('a second passing', () => {
  it('does not re-read the park', () => {
    // The park check walks every item, every criterion and every run of path, and the clock ticks
    // once a second all day. A second does not move a fence.
    const base = initialZooState(3);
    const h = base.backlog.find((it) => it.category === 'enclosure' && !it.unsized)!;
    let s = {
      ...base, phase: 'sprint', dayStage: 'building', sprintNumber: 1, daySecondsLeft: DAY_SECONDS,
      backlog: base.backlog.map((it) => (it.id === h.id
        ? { ...it, status: 'committed' as const, sprintNumber: 1, tasks: suggestTasks(it) } : it)),
    } as ZooGameState;
    s = startItem(s, h.id, 'developer');
    // Something the park WOULD tick, if it were asked.
    s = buildItem(s, h.id, { ...presetFor(h), colors: { ground: '#c8a06a', fence: '#8a6a3b' } });
    const unticked = { ...s, backlog: s.backlog.map((it) => (it.id === h.id
      ? { ...it, tasks: (it.tasks ?? []).map((t) => ({ ...t, done: false })) } : it)) } as ZooGameState;
    const done = (g: ZooGameState) => (g.backlog.find((it) => it.id === h.id)?.tasks ?? []).filter((t) => t.done).length;

    expect(done(reducer(unticked, { type: 'TICK_DAY' })),
      'the clock ticked and the whole park was read again').toBe(0);
    expect(done(reducer(unticked, { type: 'SET_POS', id: h.id, pos: { x: 300, y: 300 } })),
      'a real action stopped reading the park').toBeGreaterThan(0);
  });
});

describe('a save', () => {
  it('says which build wrote it, and is refused when this build cannot read it', () => {
    const state = initialZooState(3);
    expect(stampSave(state).version, 'a save went out with no version on it').toBe(SAVE_VERSION);

    const newer = readSave({ ...state, version: SAVE_VERSION + 1 });
    expect(newer.ok, 'a save from a newer game was read as though it were this one').toBe(false);
    if (!newer.ok) expect(newer.why).toMatch(/newer version/i);

    const notOurs = readSave({ hello: 'world' });
    expect(notOurs.ok, 'something that is not a saved game loaded as one').toBe(false);

    // Saved before the game recorded a version: readable, and said so rather than silently.
    const old = readSave({ ...state, version: undefined });
    expect(old.ok).toBe(true);
    if (old.ok) {
      expect(old.note, 'an older save came in with nothing said about it').toBeTruthy();
      expect(old.state.version, 'it was not brought up to this build').toBe(SAVE_VERSION);
    }
  });
});

describe('starting over', () => {
  it('takes two presses, and says what goes', () => {
    // The only action in the game with nothing behind it. Everything else that cannot be undone is
    // meant to cost something - a confirm on End Day would teach that the day did not matter.
    render(
      <ZooFinal state={{ ...initialZooState(3), phase: 'final', sprintNumber: 3 } as ZooGameState}
        onReset={() => {}} />,
    );
    // The action bar is portalled to the body - it is pinned to the window, not to this screen.
    const at = (part: string) => document.body.querySelector(`[data-part="${part}"]`);
    expect(at('confirm-reset'), 'it started over on one press').toBeNull();
    fireEvent.click(at('start-over')!);
    expect(at('confirm-reset'), 'there is no second step').toBeTruthy();
    expect(document.body.textContent, 'nothing said what starting over costs').toMatch(/no way back/i);
  });
});
