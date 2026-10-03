import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ParkOptions } from './ParkOptions';
import { initialZooState, DAY_SECONDS } from './config';
import { startItem, suggestTasks } from './engine';
import type { ZooGameState } from './types';

// The build controls do not move while you are using them.
//
// Reported while drawing a path, with the pen out and the Paths menu open: "the studio menu shifts
// down as the PO approval kicks in. Confusing for a user."
//
// The item chip, the six menus, the sentence about what is left and the Needs-only filter were one
// wrapping row. So the moment the last measurable criterion was met, "Everything the park can check
// is met - Priya judges the rest" appeared, took the width it needed, moved where the row wrapped,
// and slid the menus down from under the menu that was open.
//
// What is held here is the SHAPE: the controls have a row of their own and the progress line is not
// in it. Reaching the state where that line appears needs an item with every park-checkable
// criterion met - for a habitat that means paths drawn to it and around it - and a test that built
// all of that would be testing the park checks rather than the layout. The behaviour itself was
// measured in a browser, before and after, and the numbers are in the commit.

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
  const s = building();
  const item = s.backlog.find((b) => b.status === 'committed')!;
  return render(<MemoryRouter><ParkOptions state={s} item={item} api={api} /></MemoryRouter>).container;
};

describe('the row the menus wrap in', () => {
  it('is theirs alone', () => {
    const c = strip();
    const menus = c.querySelector('[data-part="park-menus"]');
    expect(menus, 'the menus share a wrapping row with something else again').toBeTruthy();
    expect(menus!.querySelectorAll('button').length, 'the menus are not in it').toBeGreaterThan(3);
    // The item chip is the thing that grows by sixty pixels when "Ask Priya" appears on it.
    expect(menus!.querySelector('[data-part="pbi-chip"]'),
      'the item chip is back in with the menus, and it changes width').toBeNull();
  });

  it('is not where the progress line is written', () => {
    // Read off the source, because the line only renders once every park-checkable criterion is met
    // and building that state is a test of the park checks, not of this row. What matters is which
    // element it is written inside, and that is decided here rather than at runtime.
    const src = readFileSync('src/components/zooGame/ParkOptions.tsx', 'utf8');
    const open = src.indexOf('data-part="park-controls"');
    const shut = src.indexOf('</div>', src.indexOf('Needs only'));
    const line = src.indexOf('data-part="nothing-open"');
    expect(open, 'the controls row is gone').toBeGreaterThan(-1);
    expect(line, 'the strip no longer says when the measurable part is done').toBeGreaterThan(-1);
    expect(line > shut,
      'the progress line is inside the controls row again, where it moves the menus when it appears')
      .toBe(true);
  });
});
