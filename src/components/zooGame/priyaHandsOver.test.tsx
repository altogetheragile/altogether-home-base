import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { initialZooState, DEFAULT_BRIEF } from './config';
import { writeBacklog, splitEpic, estimateItem, setDefinitionOfDone, sprintCapacity, readyHorizon, START_READY } from './engine';
import type { ZooGameState } from './types';
import { handover } from './handover';
import { journey } from './journey';
import { PriyaHandover } from './PriyaHandover';

// Priya hands each step over in her own voice, with what she asks pinned under it
// (docs/ZOO_GAME_FLOW.md, "Led Through It"). The journey line said where you were; nothing said
// what anybody wanted next, and a newcomer on the Refinement screen faced three panels and a list.

const at = (over: Partial<ZooGameState>) => ({ ...initialZooState(1), ...over } as ZooGameState);
const written = () => writeBacklog(at({}), DEFAULT_BRIEF);
/** The first area split, and everything that came out of it sized: a Sprint's worth Ready. */
const aSprintReady = () => {
  const w = written();
  let s = splitEpic(w, 'bigcats', (w.backlog.find((it) => it.id === 'bigcats')?.epicMembers ?? []).map((m) => m.id));
  for (const it of s.backlog.filter((x) => x.unsized && x.category !== 'epic' && x.category !== 'need')) s = estimateItem(s, it.id, 3);
  return s;
};

describe('Priya hands each step over', () => {
  it('hands over her starter, and asks for just enough to start with how far along it is', () => {
    const h = handover(written())!;
    expect(h.key).toBe('refinement');
    expect(h.says).toMatch(/one epic for each area/);
    expect(h.says).toMatch(/The rest we refine as we go/);
    expect(h.asks).toMatch(/enough to start/);
    // ...and it is the team's call when: up front, or in Sprint Planning.
    expect(h.asks).toMatch(/now, or in Sprint Planning/);
    expect(h.progress).toMatch(/^0 points Ready of about \d+ points to start$/);
  });

  it('counts half a Sprint as enough to start, not a whole one', () => {
    // Al, 4 November 2026: "just enough refinement to get started and then more refinement in
    // initial Sprints." A whole Sprint's worth meant 35 points of refining before anything was built.
    const w = written();
    const cap = sprintCapacity(w).points;
    const half = { ...w, backlog: [{ ...w.backlog[0], id: 'x', category: 'path', unsized: false, estimate: Math.ceil(cap * START_READY), acceptance: ['a'], epicMembers: undefined, status: 'backlog', zone: 'Grounds' }, ...w.backlog] } as ZooGameState;
    expect(readyHorizon(half)).toBeLessThan(1);
    expect(handover(half)?.key).toBe('dod');
  });

  it('asks what Done means once a Sprint\'s worth is Ready, as the journey line does', () => {
    const s = aSprintReady();
    expect(handover(s)?.key).toBe('dod');
    expect(journey(s).steps.find((x) => x.status === 'now')?.key).toBe('dod');
  });

  it('says to plan once Done is agreed, and says what starting without one means', () => {
    const agreed = setDefinitionOfDone(aSprintReady(), ['Built', 'Signed off']);
    expect(handover(agreed)?.key).toBe('start');
    const none = setDefinitionOfDone(aSprintReady(), []);
    expect(handover(none)?.says).toMatch(/find out at the Review what Done meant/);
    // Starting without one is not a Definition of Done, and the line does not tick it.
    expect(journey({ ...none, phase: 'planning' } as ZooGameState).steps.find((x) => x.key === 'dod')?.status).toBe('passed');
  });

  it('proposes where the value is at Sprint Planning, and leaves the Goal to the team', () => {
    const h = handover(at({ phase: 'planning', planningTopic: 'why' }))!;
    expect(h.key).toBe('goal');
    expect(h.asks).toMatch(/as a Scrum Team/);
    expect(handover(at({ phase: 'planning', planningTopic: 'what' }))).toBeNull();
  });

  it('has nothing to hand over in a later Refinement or during the Sprint', () => {
    expect(handover({ ...written(), sprintNumber: 2, velocity: [10] } as ZooGameState)).toBeNull();
    expect(handover(at({ phase: 'sprint' }))).toBeNull();
  });

  it('is drawn as a line from Priya with a "needs you" card under it', () => {
    const { container } = render(<PriyaHandover state={written()} />);
    const line = container.querySelector('[data-part="chat-message"]')!;
    expect(line.getAttribute('data-who')).toBe('product_owner');
    expect(line.textContent).toContain('Priya');
    const card = container.querySelector('[data-part="needs-you"]')!;
    expect(card.textContent).toContain('Your move');
    expect(card.textContent).toContain('Refine enough to start');
  });

  it('draws nothing where there is nothing to hand over', () => {
    expect(render(<PriyaHandover state={at({ phase: 'sprint' })} />).container.innerHTML).toBe('');
  });
});
