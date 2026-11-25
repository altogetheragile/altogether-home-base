import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { initialZooState, DEFAULT_BRIEF } from './config';
import { writeBacklog } from './engine';
import type { ZooGameState } from './types';
import { journey, JOURNEY } from './journey';
import { JourneyLine } from './JourneyLine';

// One line for the whole of Scrum, with where you are lit (docs/ZOO_GAME_FLOW.md, "Led Through
// It"). It replaced a pill saying "Before Sprint 1", which named a step and said nothing about
// where it sat or what came next.

const at = (over: Partial<ZooGameState>) => ({ ...initialZooState(1), ...over } as ZooGameState);
const statusOf = (s: ZooGameState) => Object.fromEntries(journey(s).steps.map((x) => [x.key, x.status]));
const now = (s: ZooGameState) => journey(s).steps.find((x) => x.status === 'now')?.key;

describe('the journey line', () => {
  it('has the eight steps in Scrum\'s order', () => {
    expect(JOURNEY.map((s) => s.label)).toEqual(['Product Goal', 'Product Backlog',
      'Definition of Done', 'Refinement', 'Sprint Planning', 'Sprint', 'Sprint Review', 'Retrospective']);
  });

  it('lights the Product Goal first, and nothing is ticked', () => {
    const s = at({ phase: 'intro' });
    expect(now(s)).toBe('goal');
    expect(Object.values(statusOf(s)).filter((x) => x === 'done')).toEqual([]);
  });

  it('is on the Definition of Done first, then on Refinement once it is agreed', () => {
    // Before anything is sized: "We cannot size PBIs without an understanding of the DoD."
    const written = writeBacklog(at({}), DEFAULT_BRIEF);
    expect(now(written), 'sizing is asked for before Done is agreed').toBe('dod');
    expect(statusOf(written).goal).toBe('done');
    expect(statusOf(written).backlog).toBe('done');
    const agreed = { ...written, dodAgreed: true } as ZooGameState;
    expect(now(agreed), 'Done is agreed and the line is still asking for it').toBe('refinement');
    expect(statusOf(agreed).dod).toBe('done');
  });

  it('ticks a Definition of Done agreed early', () => {
    const s = writeBacklog(at({}), DEFAULT_BRIEF);
    expect(statusOf({ ...s, dodAgreed: true } as ZooGameState).dod).toBe('done');
  });

  it('marks a Definition of Done the game went on without as missed, not done', () => {
    // A trainer's flow can leave it out, and then play a card about nobody knowing what finished
    // looks like. A tick there would be the line telling the opposite story.
    const s = at({ phase: 'planning', sprintNumber: 1, dodAgreed: false });
    expect(statusOf(s).dod).toBe('passed');
    expect(statusOf(s).refinement).toBe('done');
  });

  it('carries the pill\'s detail on the step you are on', () => {
    expect(journey(at({ phase: 'planning', planningTopic: 'what' })).steps.find((x) => x.key === 'planning')?.detail).toBe('What');
    expect(journey(at({ phase: 'sprint', dayNumber: 2, dayStage: 'building' })).steps.find((x) => x.key === 'sprint')?.detail).toBe('Day 2 · Building');
  });

  it('loops back to Sprint Planning after the first Retrospective', () => {
    const s = at({ phase: 'planning', sprintNumber: 2, dodAgreed: true });
    const st = statusOf(s);
    expect(now(s)).toBe('planning');
    expect([st.goal, st.backlog, st.refinement, st.dod]).toEqual(['done', 'done', 'done', 'done']);
    // The Sprint's own steps are ahead again, whatever happened in Sprint 1.
    expect([st.sprint, st.review, st.retro]).toEqual(['todo', 'todo', 'todo']);
    expect(journey(s).looped).toBe(true);
  });

  it('draws the step you are on as the current step', () => {
    const { container } = render(<JourneyLine state={at({ phase: 'review', sprintNumber: 1, dodAgreed: true })} />);
    const current = container.querySelector('[aria-current="step"]');
    expect(current?.getAttribute('data-step')).toBe('review');
    expect(current?.textContent).toContain('Sprint Review');
    expect(container.querySelectorAll('[data-status="done"]').length).toBe(6);
  });
});
