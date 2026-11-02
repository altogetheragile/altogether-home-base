import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { initialZooState, DEFAULT_BRIEF } from './config';
import { writeBacklog, splitEpic, estimateItem } from './engine';
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
    expect(JOURNEY.map((s) => s.label)).toEqual(['Product Goal', 'Product Backlog', 'Refinement',
      'Definition of Done', 'Sprint Planning', 'Sprint', 'Sprint Review', 'Retrospective']);
  });

  it('lights the Product Goal first, and nothing is ticked', () => {
    const s = at({ phase: 'intro' });
    expect(now(s)).toBe('goal');
    expect(Object.values(statusOf(s)).filter((x) => x === 'done')).toEqual([]);
  });

  it('is on Refinement until a Sprint\'s worth is Ready, then on the Definition of Done', () => {
    const written = writeBacklog(at({}), DEFAULT_BRIEF);
    expect(now(written)).toBe('refinement');
    expect(statusOf(written).goal).toBe('done');
    expect(statusOf(written).backlog).toBe('done');
    // Split the first area and size everything that comes out of it.
    let s = splitEpic(written, 'bigcats', (written.backlog.find((it) => it.id === 'bigcats')?.epicMembers ?? []).map((m) => m.id));
    for (const it of s.backlog.filter((x) => x.unsized && x.category !== 'epic' && x.category !== 'need')) s = estimateItem(s, it.id, 3);
    expect(now(s), 'a Sprint\'s worth is Ready and the line has not moved on').toBe('dod');
    expect(statusOf(s).refinement).toBe('done');
    expect(now({ ...s, dodAgreed: true } as ZooGameState), 'Done is agreed and the line is still asking for it').not.toBe('dod');
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
