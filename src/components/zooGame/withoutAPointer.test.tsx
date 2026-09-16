import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { ParkPlan } from './ParkPlan';
import { SplitEpicPanel } from './Board';
import { ScrumOnePager } from './ScrumTeaching';
import { SCRUM_INTRO, SCRUM_CARDS } from './scrumContent';
import { initialZooState } from './config';
import { startOnTheBoard } from './engine';
import type { ZooGameState, BacklogItem } from './types';

// The park, without a pointer.
//
// Every move on the board has a keyboard path through the card - "Start it", "Move it to Done",
// "Hand it back", and the last of those says so in its own comment: "for anybody not using a
// pointer". The park had none at all: a thing could be picked up, dragged and dropped, and there was
// no other way to do any of it. That locks a keyboard user out of the half of the game where the
// building happens.

const park = (): ZooGameState => startOnTheBoard(initialZooState(1) as ZooGameState);
const first = (s: ZooGameState) => s.backlog.find((it) => it.status === 'committed')!;

describe('moving something that is standing', () => {
  const standing = (): ZooGameState => {
    const s = park();
    const it0 = first(s);
    return { ...s, backlog: s.backlog.map((x) => (x.id === it0.id
      ? { ...x, started: true, pos: { x: 500, y: 800 } } : x)) } as ZooGameState;
  };

  it('can be reached by keyboard at all', () => {
    const s = standing();
    const { container } = render(<ParkPlan state={s} onPlaceItem={() => {}} />);
    const g = container.querySelector(`[data-plan-item="${first(s).id}"]`)!;
    expect(g.getAttribute('tabindex'), 'nothing on the park can be focused').toBe('0');
    expect(g.getAttribute('aria-label'), 'it is focusable and announces nothing').toMatch(first(s).name);
  });

  it('opens on Enter, the way a press does', () => {
    const s = standing();
    let opened: string | null = null;
    const { container } = render(<ParkPlan state={s} onSelect={(id) => { opened = id; }} onPlaceItem={() => {}} />);
    fireEvent.keyDown(container.querySelector(`[data-plan-item="${first(s).id}"]`)!, { key: 'Enter' });
    expect(opened, 'Enter on a thing did not pick it up').toBe(first(s).id);
  });

  it('moves a pace at a time with the arrows, and ten with Shift', () => {
    const s = standing();
    const moves: { x: number; y: number }[] = [];
    const { container } = render(<ParkPlan state={s} onPlaceItem={(_id, pos) => moves.push(pos)} />);
    const g = container.querySelector(`[data-plan-item="${first(s).id}"]`)!;
    fireEvent.keyDown(g, { key: 'ArrowRight' });
    expect(moves.length, 'the arrows move nothing').toBe(1);
    const pace = moves[0].x - 500;
    expect(pace, 'a pace is backwards or nothing').toBeGreaterThan(0);
    fireEvent.keyDown(g, { key: 'ArrowRight', shiftKey: true });
    expect(moves[1].x - 500, 'Shift does not stride').toBeGreaterThan(pace);
  });

  it('is refused by the same rule a drag is refused by', () => {
    // Off the park is off the park, however you got there.
    const s = { ...standing(), backlog: park().backlog.map((x) => (x.id === first(park()).id
      ? { ...x, started: true, pos: { x: 12, y: 800 } } : x)) } as ZooGameState;
    const moves: unknown[] = [];
    const { container } = render(<ParkPlan state={s} onPlaceItem={(...a) => moves.push(a)} />);
    fireEvent.keyDown(container.querySelector(`[data-plan-item="${first(s).id}"]`)!, { key: 'ArrowLeft', shiftKey: true });
    expect(moves, 'a keyboard move walked a habitat off the park').toEqual([]);
  });
});

describe('putting something down', () => {
  it('takes focus and says how, while something is in hand', () => {
    const s = park();
    const { container } = render(
      <ParkPlan state={s} placing={{ id: first(s).id, w: 120, h: 90 }} onPlace={() => {}} />,
    );
    const svg = container.querySelector('[data-part="park-plan"]')!;
    expect(svg.getAttribute('tabindex'), 'the park cannot be focused with something in hand').toBe('0');
    expect(svg.getAttribute('aria-label'), 'it does not say how to put it down').toMatch(/arrow keys|Enter/i);
  });

  it('puts it down on Enter', () => {
    const s = park();
    const put: { x: number; y: number }[] = [];
    const { container } = render(
      <ParkPlan state={s} placing={{ id: first(s).id, w: 120, h: 90 }}
        onPlace={(_id, pos) => put.push(pos)} />,
    );
    const svg = container.querySelector('[data-part="park-plan"]')!;
    fireEvent.keyDown(svg, { key: 'ArrowRight' });
    fireEvent.keyDown(svg, { key: 'Enter' });
    expect(put.length, 'Enter put nothing down').toBe(1);
  });

  it('is an image again once nothing is in hand', () => {
    const { container } = render(<ParkPlan state={park()} />);
    const svg = container.querySelector('[data-part="park-plan"]')!;
    expect(svg.getAttribute('tabindex'), 'the park is a tab stop with nothing to put down').toBeNull();
    expect(svg.getAttribute('role')).toBe('img');
  });
});

describe('what splitting an epic actually does', () => {
  // The review asked for a confirm because splitting "can delete the epic". The engine says
  // otherwise: what is left unticked stays ON the epic, which stays on the Product Backlog. So the
  // missing thing was a sentence, not a dialog - a confirm over a safe act teaches somebody to fear
  // it.
  const epic = (): BacklogItem => initialZooState(1).backlog.find((it) => it.category === 'epic')!;

  it('says what stays behind, before the press', () => {
    // Everything starts ticked, so untick one to leave something behind.
    const e = epic();
    const { container } = render(<SplitEpicPanel epic={e} onSplit={() => {}} />);
    fireEvent.click(container.querySelectorAll('input[type="checkbox"]')[0]);
    const said = container.querySelector('[data-part="split-leaves"]')!;
    expect(said, 'splitting says nothing about what happens to the rest').toBeTruthy();
    expect(said.textContent, 'it does not say the epic survives').toMatch(/stays?\s+on/i);
    expect(said.textContent).toMatch(new RegExp(e.name));
    expect(said.textContent, 'a part-split epic is announced as leaving the Backlog').not.toMatch(/fully split/i);
  });

  it('says when the epic is fully split and goes', () => {
    const e = epic();
    const { container } = render(<SplitEpicPanel epic={e} onSplit={() => {}} />);
    expect(container.querySelector('[data-part="split-leaves"]')!.textContent,
      'taking everything out of an epic says the same thing as taking some').toMatch(/fully split/i);
  });

  it('counts the items coming out separately from the members going', () => {
    // An animal makes two items, an enclosure and the animal that lives in it. The two numbers were
    // the same number, so unticking a member could still claim the epic was fully split.
    const e = epic();
    const { container } = render(<SplitEpicPanel epic={e} onSplit={() => {}} />);
    fireEvent.click(container.querySelectorAll('input[type="checkbox"]')[0]);
    const said = container.querySelector('[data-part="split-leaves"]')!.textContent ?? '';
    const stillTicked = e.epicMembers!.slice(1);
    const items = stillTicked.reduce((n, m) => n + (m.kind === 'exhibit' ? 2 : 1), 0);
    expect(said, 'one member was unticked and the panel counted something else')
      .toMatch(new RegExp(`^${items} items? comes? out\\. The other 1 stays on`));
    expect(said, 'the panel claims the epic is gone with a member still on it').not.toMatch(/fully split/i);
  });
});

describe('what the game says is Scrum', () => {
  it('names two foundations, not three', () => {
    // Scrum is founded on empiricism and lean thinking; it EMPLOYS an iterative, incremental
    // approach. A small thing to get wrong on the page that exists to be right about this.
    expect(SCRUM_INTRO.foundations.map((f) => f.name)).toEqual(['Empiricism', 'Lean thinking']);
    expect(SCRUM_INTRO.approach.name, 'the approach went missing with the third foundation')
      .toMatch(/iterative/i);
  });

  it('shows the approach under the two, saying it is not one of them', () => {
    const { container } = render(<ScrumOnePager onDone={() => {}} onSkipTeaching={() => {}} />);
    expect(container.textContent, 'the one-pager does not place the approach').toMatch(/not a third foundation/i);
  });

  it('does not assert the Product Owner decides when an Increment is released', () => {
    const inc = SCRUM_INTRO.artifacts.find((a) => /Increment/i.test(a.name));
    const card = SCRUM_CARDS.find((c) => c.id === 'increment');
    expect(`${inc?.text ?? ''} ${card?.who ?? ''}`, 'release timing is asserted as Guide fact')
      .not.toMatch(/decides when it is released/i);
  });

  it('labels the shapes a Product Goal can be written in as a practice', () => {
    const card = SCRUM_CARDS.find((c) => c.id === 'product-goal');
    expect(card?.notScrum, 'OKRs and epic stories are taught as though the Guide asked for them')
      .toBeTruthy();
  });
});
