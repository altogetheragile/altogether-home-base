import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SeatBand } from './SeatBand';
import { JourneyLine } from './JourneyLine';
import { StepTrack } from './StepTrack';
import { TAB_EDGE } from './ui/tokens';
import { initialZooState } from './config';
import type { ZooGameState } from './types';

// Orange is yours to do now, and nothing else on the screen is orange (rule 11 in
// docs/SCRUM_GAMES_PLAN.md). Asked while playing the Sprint: "The colours are too uniform in that
// it is not obvious what to do." The tab, the step you are on and your seats were all orange.

const sprint = { ...initialZooState(3), phase: 'sprint', dayStage: 'building', sprintNumber: 1, sprintGoal: 'Open the lions' } as ZooGameState;
const orange = /\b(bg|border|text)-primary\b/;

describe('where you are is ink, not orange', () => {
  it('the selected tab', () => {
    expect(TAB_EDGE).not.toMatch(/primary/);
  });

  it('the step of Scrum you are on', () => {
    const now = render(<JourneyLine state={sprint} />).container.querySelector('[aria-current="step"] > span:last-child')!;
    expect(now.className).not.toMatch(orange);
  });

  it('the topic you are on', () => {
    const c = render(<StepTrack steps={[{ key: 'a', label: 'Why' }, { key: 'b', label: 'What' }]} current="a" done={() => false} onGo={() => {}} />).container;
    expect(c.querySelector('[aria-current="step"]')!.className).not.toMatch(orange);
  });

  it('your seat, and the Sprint Goal label', () => {
    const c = render(<MemoryRouter><SeatBand state={sprint} seat="developer" /></MemoryRouter>).container;
    for (const el of c.querySelectorAll('[data-part="seat"], [data-part="seat-you"], [data-part="sprint-goal"] > span')) {
      expect(el.className, el.textContent ?? '').not.toMatch(orange);
    }
  });
});
