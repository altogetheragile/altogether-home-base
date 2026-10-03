import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ParkOptions } from './ParkOptions';
import { initialZooState, DAY_SECONDS, DEFAULT_DOD } from './config';
import { startItem, suggestTasks } from './engine';
import type { ZooGameState } from './types';

// The bar you are building to, on the screen you build from.
//
// Asked while drawing a path: "I have no visibility of the DoD - where is it on the screen?" It was
// on the Increment tab and in the Learn drawer, and nowhere here. The game's own strapline is "Run
// a zoo in Sprints, and learn Scrum by doing it: forecast, build to your Definition of Done" - and
// you cannot build to something you cannot see.

const api = { onDesign: () => {}, onSetEnclosure: () => {}, onOpenCard: () => {} };

const building = (dod?: string[]): ZooGameState => {
  const s = initialZooState(3) as ZooGameState;
  const h = s.backlog.find((it) => it.category === 'enclosure' && !it.unsized)!;
  const g = {
    ...s, phase: 'sprint', dayStage: 'building', sprintNumber: 1, daySecondsLeft: DAY_SECONDS,
    ...(dod === undefined ? {} : { definitionOfDone: dod }),
    backlog: s.backlog.map((it) => (it.id === h.id
      ? { ...it, status: 'committed' as const, sprintNumber: 1, tasks: suggestTasks(it) } : it)),
  } as ZooGameState;
  return startItem(g, h.id, 'developer');
};

const strip = (state: ZooGameState) => {
  const item = state.backlog.find((b) => b.status === 'committed')!;
  return render(<MemoryRouter><ParkOptions state={state} item={item} api={api} /></MemoryRouter>).container;
};

const open = (c: HTMLElement) => {
  const trigger = c.querySelector('[data-part="group-dod"]');
  expect(trigger, 'there is no Definition of Done on the build strip').toBeTruthy();
  fireEvent.click(trigger!);
  return document.body.querySelector('[data-part="dod-panel"]');
};

describe('the Definition of Done, while building', () => {
  it('is reachable from the strip', () => {
    expect(strip(building()).querySelector('[data-part="group-dod"]'),
      'the bar is still only on another tab').toBeTruthy();
  });

  it('shows the lines the team agreed', () => {
    const panel = open(strip(building([...DEFAULT_DOD])));
    expect(panel, 'the menu opens on nothing').toBeTruthy();
    for (const line of DEFAULT_DOD) {
      expect(panel!.textContent, `the bar does not mention "${line}"`).toContain(line);
    }
  });

  it('says so plainly when nothing was agreed, which is where this game starts you', () => {
    // START empties it on purpose: the Retrospective asks "what did Done mean?" and the answer is
    // meant to be "we never said". An empty panel would lose the lesson.
    const panel = open(strip(building([])));
    expect(panel!.textContent, 'an empty bar is shown as empty space').toMatch(/No Definition of Done/i);
    expect(panel!.textContent, 'it does not say what to do about it').toMatch(/Retrospective/i);
  });

  it('does not offer to edit it here', () => {
    // Agreeing the Definition of Done is the whole Scrum Team's act, and this game has them do it
    // at the Retrospective. A text box on the build strip would make it one Developer's.
    const panel = open(strip(building([...DEFAULT_DOD])));
    expect(panel!.querySelectorAll('input, textarea').length,
      'the bar can be edited from the build strip').toBe(0);
  });

  it('says whose bar it is, so it is not read as this item\'s criteria', () => {
    // The distinction COURSE-AND-BOARD.md insists on: acceptance criteria belong to an item, the
    // Definition of Done is the team-wide bar, and merging them is the mistake.
    const panel = open(strip(building([...DEFAULT_DOD])));
    expect(panel!.textContent, 'nothing says this applies to every item').toMatch(/every item/i);
    expect(panel!.textContent, 'nothing points at where this item\'s own criteria live').toMatch(/its own card/i);
  });
});
