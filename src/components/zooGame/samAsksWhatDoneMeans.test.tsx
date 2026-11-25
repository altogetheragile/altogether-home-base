import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { initialZooState, DEFAULT_BRIEF } from './config';
import { writeBacklog } from './engine';
import { handover } from './handover';
import { RefineBacklog } from './RefineBacklog';
import type { ZooGameState } from './types';

// Two things from one screen (Al, 25 November 2026).
// "This should be the scrum master, no?" - of Priya asking what Done means. The Definition of Done
// is the whole Scrum Team's, and the 2020 Guide has the Scrum Master "Helping the Scrum Team focus
// on creating high-value Increments that meet the Definition of Done". So Sam asks.
// "What is this?" - of a floating "Sprint Planning opens once..." note sitting over the very
// buttons that decide it. It goes: the move card already says what to do.

const noop = () => {};
const atTheDod = (over: Partial<ZooGameState> = {}) =>
  ({ ...writeBacklog(initialZooState(3), DEFAULT_BRIEF), phase: 'refine', ...over } as ZooGameState);
const screen = (s: ZooGameState) => render(
  <MemoryRouter>
    <RefineBacklog state={s} onSetSprintDays={noop} onSetDod={noop} onAgreeDod={noop}
      onEstimate={noop} onAddPbi={noop} onRefinePbi={noop} onReorder={noop} onMoveZone={noop}
      onMoveBefore={noop} onSetUseStories={noop} onSplitEpic={noop} onDeletePbi={noop}
      onDuplicatePbi={noop} onPlan={noop} />
  </MemoryRouter>,
).baseElement;

describe('asking what Done means', () => {
  it('is the Scrum Master\'s line, not the Product Owner\'s', () => {
    const s = atTheDod();
    expect(handover(s)?.key).toBe('dod');
    expect(handover(s)?.who).toBe('scrum_master');
    const page = screen(s);
    const line = page.querySelector('[data-part="handover"]')!;
    expect(line.textContent).toContain(s.team.scrumMaster.name);
    expect(line.textContent, 'Priya is still the one asking').not.toContain(s.team.productOwner.name);
  });

  it('leaves the rest of the handovers to Priya', () => {
    const s = atTheDod({ dodAgreed: true, definitionOfDone: ['Peer-reviewed'] });
    expect(handover(s)?.key).toBe('refinement');
    expect(handover(s)?.who ?? 'product_owner').toBe('product_owner');
  });
});

describe('the way to Sprint Planning', () => {
  it('has no floating note before the Definition of Done is decided', () => {
    const page = screen(atTheDod());
    expect(page.textContent).not.toMatch(/Sprint Planning opens once/);
    expect([...page.querySelectorAll('button')].some((b) => /Go to Sprint Planning/.test(b.textContent ?? ''))).toBe(false);
  });

  it('is a button once it is', () => {
    const page = screen(atTheDod({ dodAgreed: true, definitionOfDone: ['Peer-reviewed'] }));
    expect([...page.querySelectorAll('button')].some((b) => /Go to Sprint Planning/.test(b.textContent ?? ''))).toBe(true);
  });
});
