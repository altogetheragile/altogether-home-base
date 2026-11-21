import { describe, it, expect } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SprintPlanning } from './SprintPlanning';
import { ParkOptions } from './ParkOptions';
import { initialZooState } from './config';
import { presetFor } from './design';
import { openGroup } from './openGroup';
import type { ZooGameState } from './types';

// From the eighteenth scrum-master playtest (playtest-report-sm18).

const noop = () => {};
const planning = (topic: 'what' | 'how', over: (s: ZooGameState) => ZooGameState = (x) => x) => render(
  <MemoryRouter>
    <SprintPlanning state={over({ ...initialZooState(1), adopted: ['sprint-bet'], phase: 'planning', planningTopic: topic, sprintGoal: 'A pleasanter park', sprintGoalAgreed: ['developer'] } as ZooGameState)}
      onPlan={noop} onSetForecast={noop} onSetSprintGoal={noop}
      onEstimate={noop} onSetTasks={noop} onPlanShape={noop} onToggleGoalCritical={noop}
      onReorderForecast={noop} onRefine={noop} onTakeSignal={noop} onSplitEpic={noop} onSetBet={noop} />
  </MemoryRouter>,
);

describe('the bet says what is chosen', () => {
  // "I have been clicking 'everybody' and '10' but ... the buttons do not show a clear selected state."
  it('marks the chosen group, measure and number as pressed, and moves the mark when you choose', () => {
    planning('what');
    fireEvent.click(screen.getByRole('button', { name: /Make a bet on this Sprint/ }));
    const pressed = (name: string) => screen.getByRole('button', { name }).getAttribute('aria-pressed');
    for (const n of ['families', 'enthusiasts', 'comfort seekers', 'everybody', 'happiness', 'visitors', '5', '10', '20']) {
      expect(pressed(n), `${n} does not say whether it is chosen`).toMatch(/^(true|false)$/);
    }
    fireEvent.click(screen.getByRole('button', { name: 'everybody' }));
    fireEvent.click(screen.getByRole('button', { name: '20' }));
    expect(pressed('everybody')).toBe('true');
    expect(pressed('families')).toBe('false');
    expect(pressed('20')).toBe('true');
    expect(pressed('10')).toBe('false');
  });
});

describe('a colour says whether it is the one chosen', () => {
  // "There is no visible confirmation that the high fence colour #6b7280 has been applied."
  it('every swatch is a pressed or unpressed button, and only one is pressed', () => {
    const s = { ...initialZooState(3), phase: 'sprint', dayStage: 'building', sprintNumber: 1 } as ZooGameState;
    const pen = s.backlog.find((it) => it.category === 'enclosure')!;
    const preset = presetFor(pen as never);
    render(<MemoryRouter><ParkOptions state={s} item={{ ...pen, draftDesign: { ...preset, parts: { ...preset.parts, barrier: 'high' } } }}
      api={{ onDesign: noop, onSetEnclosure: noop, onAddInside: noop, onTurn: noop, onUnplace: noop, onInside: noop }} /></MemoryRouter>);
    const swatches = [...openGroup('barrier').querySelectorAll('button[aria-label]')].filter((b) => /#[0-9a-f]{6}/i.test(b.getAttribute('aria-label') ?? ''));
    expect(swatches.length).toBeGreaterThan(0);
    for (const b of swatches) expect(b.getAttribute('aria-pressed'), b.getAttribute('aria-label') ?? '').toMatch(/^(true|false)$/);
    expect(swatches.filter((b) => b.getAttribute('aria-pressed') === 'true').length).toBeLessThanOrEqual(1);
  });
});

describe('how much ready work is waiting', () => {
  // "'About 0.8 Sprints of ready work is waiting' but also 'The next Planning will have nothing to
  // choose from' ... seem contradictory."
  it('does not say there is nothing when there is some', () => {
    // Less than a Sprint of it: one small sized item, everything else still to size.
    let kept = false;
    const { container } = planning('how', (st) => ({ ...st, backlog: st.backlog.map((it) => {
      if (!kept && !it.unsized && it.estimate > 0 && it.estimate <= 5) { kept = true; return it; }
      return { ...it, unsized: true };
    }) }));
    const line = container.querySelector('[data-part="refine-points-mean"]')?.nextElementSibling?.textContent ?? '';
    expect(line).toMatch(/of ready work is waiting/);
    expect(line).toMatch(/About 0\.\d Sprints/);
    expect(line).not.toMatch(/nothing to choose from/);
    expect(line).toMatch(/short of ready work/);
  });
});
