import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RefineBacklog } from './RefineBacklog';
import { initialZooState } from './config';
import type { ZooGameState } from './types';

// "The screen is confusing. Too many things going on. The green guidance is off the screen. Are
// there any gaming patterns we can draw on to ease newbies into a game?" (5 Nov 2026)
//
// One objective at a time, things unlocked when they can be used, and a small first level: the
// first screen asks one thing, in the card under Priya's line; what is settled is a line each; the
// ground arrives when there is something to spend; what is for later folds away.

const noop = () => {};
const screen = (over: Partial<ZooGameState> = {}) => render(
  <MemoryRouter>
    <RefineBacklog state={{ ...initialZooState(3), phase: 'refine', ...over } as ZooGameState}
      onSetSprintDays={noop} onSetDod={noop} onAgreeDod={noop}
      onEstimate={noop} onAddPbi={noop} onRefinePbi={noop} onReorder={noop} onMoveZone={noop}
      onMoveBefore={noop} onSetUseStories={noop} onSplitEpic={noop} onDeletePbi={noop}
      onDuplicatePbi={noop} onPlan={noop} onOpenGround={noop} />
  </MemoryRouter>,
).container;

describe('the first screen', () => {
  it('asks one thing, and the Definition of Done is done inside the card that asks for it', () => {
    const c = screen();
    expect(c.querySelectorAll('[data-part="needs-you"]')).toHaveLength(1);
    const card = c.querySelector('[data-part="needs-you"]')!;
    expect(card.textContent).toMatch(/Agree the Definition of Done/);
    expect([...card.querySelectorAll('button')].some((b) => /We agree/.test(b.textContent ?? ''))).toBe(true);
    // No numbered steps beside it.
    expect(c.textContent).not.toMatch(/First, agree how long a Sprint is/);
  });

  it('says what is settled as a line each, with a way to change it', () => {
    const c = screen();
    const length = c.querySelector('[data-part="settled-length"]')!;
    expect(length.textContent).toMatch(/Sprints are 3 days/);
    fireEvent.click(length.querySelector('button')!);
    expect(c.querySelector('[data-part="settled-length"]')!.textContent, 'the length cannot be changed').toMatch(/day/);
    expect(c.querySelector('[data-part="enough-to-start"]')!.textContent).toMatch(/Enough to start/);
  });

  it('keeps the ground until there is something to spend', () => {
    expect(screen().querySelector('[data-part="ground"]'), 'a panel of dead buttons on the first screen').toBeNull();
    expect(screen({ sprintNumber: 2, velocity: [8] }).querySelector('[data-part="ground"]')).toBeTruthy();
  });

  it('folds what is for later into one row', () => {
    const c = screen();
    const fold = c.querySelector('[data-part="later-fold"]') as HTMLButtonElement;
    expect(fold.textContent).toMatch(/\d+ more, refined in later Sprints/);
    expect(c.querySelector('[data-part="later"]')).toBeNull();
    fireEvent.click(fold);
    expect(c.querySelectorAll('[data-part="later"]').length).toBeGreaterThan(0);
  });
});

describe('the move before the first Sprint', () => {
  // "It still doesn't pop. It also decides for the player which PBI to split. They might go for
  // tigers first as the PO. Also, they might decide not to do upfront refinement and refine an item
  // in Sprint Planning." (5 Nov) So no row is singled out, and the card offers both ways to start.
  const starter = () => {
    const s = { ...initialZooState(3), phase: 'refine' } as ZooGameState;
    return { ...s, adopted: ['refinement'], backlog: s.backlog.map((it) => ({ ...it, unsized: true })) } as ZooGameState;
  };

  it('is a choice: refine some now, or refine in Sprint Planning', () => {
    let planned = 0;
    const c = render(
      <MemoryRouter>
        <RefineBacklog state={starter()} onSetSprintDays={noop} onSetDod={noop} onAgreeDod={noop}
          onEstimate={noop} onAddPbi={noop} onRefinePbi={noop} onReorder={noop} onMoveZone={noop}
          onMoveBefore={noop} onSetUseStories={noop} onSplitEpic={noop} onDeletePbi={noop}
          onDuplicatePbi={noop} onPlan={() => { planned += 1; }} />
      </MemoryRouter>,
    ).container;
    const card = c.querySelector('[data-part="needs-you"]')!;
    expect(card.querySelector('[data-choice="now"]')?.textContent).toMatch(/Refine some now/);
    expect(card.querySelector('[data-choice="now"] [data-part="split-steer"]'), 'the tip lost the scissors that point to Split it up').not.toBeNull();
    const later = card.querySelector('[data-choice="planning"]') as HTMLButtonElement;
    expect(later.textContent).toMatch(/Refine in Sprint Planning/);
    fireEvent.click(later);
    expect(planned, 'choosing to refine in Planning did not go there').toBe(1);
  });

  it('names whose order it is, and does not pick an item', () => {
    const c = screen(starter());
    expect(c.querySelector('[data-part="start-here"]'), 'a row is still chosen for the player').toBeNull();
    expect(c.querySelector('[data-choice="now"]')!.textContent).toMatch(/Priya has .+ on top; reorder first if you like/);
  });

  it('leaves every row quiet, the same as the others', () => {
    const c = screen(starter());
    const rows = [...c.querySelectorAll('[aria-label^="Refine "]')];
    expect(rows.length).toBeGreaterThan(1);
    const loud = rows.filter((r) => /border-(rose|amber)-400/.test(r.className));
    expect(loud.map((r) => r.getAttribute('aria-label')), 'a row still shouts in red or amber').toEqual([]);
    // An epic is a stack, and only an epic. Not Ready is a dashed frame, never a greyed one: "Can
    // we make PBIs pop more - especially after splitting?"
    const st = starter();
    for (const r of rows) {
      const name = r.getAttribute('aria-label')!.replace(/^Refine /, '');
      const epic = st.backlog.find((it) => it.name === name)?.category === 'epic';
      expect(r.hasAttribute('data-stack'), `${r.getAttribute('aria-label')} is drawn as the wrong kind of thing`).toBe(epic);
      expect(r.className, `${r.getAttribute('aria-label')} is greyed out`).not.toMatch(/opacity-|text-muted-foreground\b/);
    }
  });

  it('says what a split has just made, until it is sized', () => {
    const s = starter();
    const tree = (st: ZooGameState) => (
      <MemoryRouter>
        <RefineBacklog state={st} onSetSprintDays={noop} onSetDod={noop} onAgreeDod={noop}
          onEstimate={noop} onAddPbi={noop} onRefinePbi={noop} onReorder={noop} onMoveZone={noop}
          onMoveBefore={noop} onSetUseStories={noop} onSplitEpic={noop} onDeletePbi={noop}
          onDuplicatePbi={noop} onPlan={noop} />
      </MemoryRouter>
    );
    const r = render(tree(s));
    expect(r.container.querySelector('[data-part="just-split"]')).toBeNull();
    const piece = { ...s.backlog[0], id: 'piece-1', name: 'Snow Leopard', category: 'exhibit', unsized: true } as ZooGameState['backlog'][number];
    r.rerender(tree({ ...s, backlog: [piece, ...s.backlog] } as ZooGameState));
    const chip = r.container.querySelector('[data-part="just-split"]');
    expect(chip, 'nothing marks what the split made').toBeTruthy();
    expect(chip!.closest('[aria-label]')?.getAttribute('aria-label')).toBe('Refine Snow Leopard');
    r.rerender(tree({ ...s, backlog: [{ ...piece, unsized: false, estimate: 3 }, ...s.backlog] } as ZooGameState));
    expect(r.container.querySelector('[data-part="just-split"]'), 'it is still new once sized').toBeNull();
  });
});
