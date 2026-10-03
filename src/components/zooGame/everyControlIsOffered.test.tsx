import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ParkOptions } from './ParkOptions';
import { initialZooState, DAY_SECONDS } from './config';
import { startItem, suggestTasks } from './engine';
import { groupsFor } from './buildGroups';
import type { ZooGameState } from './types';

// Every control a thing has, offered.
//
// There was a "Needs only" tick box, on by default, that hid the controls this item's criteria
// were not about. Asked while playing: "what is the 'Needs' check box? Who asked for that?"
//
// Nobody did. It arrived inside #645, a commit about making the strip one row, and it is the wrong
// shape for this screen: the Product Owner says what is needed and the Developers decide HOW, and a
// strip that quietly withholds half the hows is answering that for them. What it was for is done
// better by the dots - a lit group is one that would finish this item - which points without hiding.

const api = { onDesign: () => {}, onSetEnclosure: () => {}, onOpenCard: () => {} };

const building = (): ZooGameState => {
  const s = initialZooState(3) as ZooGameState;
  const h = s.backlog.find((it) => it.category === 'enclosure' && !it.unsized)!;
  const g = {
    ...s, phase: 'sprint', dayStage: 'building', sprintNumber: 1, daySecondsLeft: DAY_SECONDS,
    backlog: s.backlog.map((it) => (it.id === h.id
      ? { ...it, status: 'committed' as const, sprintNumber: 1, tasks: suggestTasks(it) } : it)),
  } as ZooGameState;
  return startItem(g, h.id, 'developer');
};

const strip = () => {
  const state = building();
  const item = state.backlog.find((b) => b.status === 'committed')!;
  return { c: render(<MemoryRouter><ParkOptions state={state} item={item} api={api} /></MemoryRouter>).container, item };
};

describe('the build strip', () => {
  it('offers no way to hide half of itself', () => {
    expect(strip().c.querySelector('[data-part="needs-only"]'),
      'the Needs-only tick box is back').toBeNull();
  });

  it('shows every group this thing has', () => {
    const { c, item } = strip();
    const want = groupsFor(item);
    expect(want.length, 'this item has no controls, so the test checks nothing').toBeGreaterThan(3);
    for (const g of want) {
      expect(c.querySelector(`[data-part="group-${g.id}"]`),
        `${g.label} (${g.id}) is not on the strip`).toBeTruthy();
    }
  });

  it('keeps the dots, which point without hiding', () => {
    // The thing the filter was for. A lit group is one that would finish this item.
    const { c } = strip();
    expect(c.querySelectorAll('[data-lit]').length, 'nothing says which press matters')
      .toBeGreaterThan(3);
  });
});

describe('the item chip', () => {
  it('holds its width whether or not the Product Owner is being asked', () => {
    // Sixty pixels appearing mid-row is what moved the menus, and the fix for that used to be a
    // row of the park's height. The room is kept instead.
    const { c } = strip();
    const slot = [...c.querySelectorAll('[data-part="pbi-chip"] span')]
      .find((n) => /^Ask /.test(n.textContent ?? ''));
    expect(slot, 'the chip no longer reserves room for the ask').toBeTruthy();
  });
});
