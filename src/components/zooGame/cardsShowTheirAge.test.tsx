import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SprintBoard } from './SprintBoard';
import { initialZooState } from './config';
import {
  planSprint, startItem, daysInProgress, ageingCards, antiPatterns, reviewSprint, availableItems,
  dropFromSprint,
} from './engine';
import type { ZooGameState, BacklogItem } from './types';

// How long a card has been in Doing.
//
// A card nobody had touched since Monday looked exactly like one picked up an hour ago, which is
// the one thing a board is supposed to make impossible. Nothing logs a card NOT moving - that is
// the whole difficulty with noticing it, and the reason the Daily Scrum exists - so the age is
// derived from the day it was picked up, which nothing recorded either.

const sprint = (): ZooGameState => {
  const s = planSprint(initialZooState(1), [availableItems(initialZooState(1))[0].id]);
  return { ...s, phase: 'sprint', dayStage: 'building', dayNumber: 1 } as ZooGameState;
};
const inSprint = (s: ZooGameState): BacklogItem =>
  s.backlog.find((it) => it.status === 'committed' && it.sprintNumber === s.sprintNumber)!;

describe('the day a card was picked up', () => {
  it('is recorded when the Developers take it into Doing', () => {
    const s = sprint();
    const item = inSprint(s);
    expect(item.startedDay, 'an item knows when it was started before anybody started it').toBeUndefined();
    const after = startItem(s, item.id);
    expect(after.backlog.find((it) => it.id === item.id)!.startedDay).toBe(s.dayNumber);
  });

  it('counts inclusively, so a card picked up today is a day old', () => {
    const started = startItem(sprint(), inSprint(sprint()).id);
    const item = started.backlog.find((it) => it.started)!;
    expect(daysInProgress(started, item)).toBe(1);
    expect(daysInProgress({ ...started, dayNumber: 2 }, item)).toBe(2);
    expect(daysInProgress({ ...started, dayNumber: 3 }, item)).toBe(3);
  });

  it('has no age before it is started, and none once it goes back', () => {
    const s = sprint();
    expect(daysInProgress(s, inSprint(s)), 'a card nobody picked up is being aged').toBeNull();
    // Unfinished work leaves at the Review, re-sized, and stops being in progress at all.
    const started = startItem(s, inSprint(s).id);
    const after = reviewSprint({ ...started, dayNumber: started.sprintDays });
    for (const it of after.backlog) {
      expect(it.startedDay, `${it.name} went back to the Product Backlog still carrying an age`)
        .toBeUndefined();
    }
  });

  it('has no age once it is dropped back out of the Sprint', () => {
    // Two things stop it: it is no longer started, and it is no longer in a Sprint. Both are
    // checked, because a card that kept the day it was picked up in a Sprint it has left is a fact
    // waiting to be read wrongly.
    const started = startItem(sprint(), inSprint(sprint()).id);
    const item = started.backlog.find((it) => it.started)!;
    const dropped = dropFromSprint(started, item.id);
    const back = dropped.backlog.find((it) => it.id === item.id)!;
    expect(back.started, 'a dropped card is still in progress').toBeFalsy();
    expect(back.startedDay, 'a dropped card kept the day it was picked up').toBeUndefined();
    expect(daysInProgress(dropped, back)).toBeNull();
    // ...and it is still not aged if it somehow kept the day.
    expect(daysInProgress(dropped, { ...back, startedDay: 1 }),
      'a card out of the Sprint is being aged').toBeNull();
    expect(daysInProgress(started, { ...item, started: false }),
      'a card that is not started is being aged').toBeNull();
  });

  it('is not counted across Sprints', () => {
    // `startedDay` is a day OF a Sprint, so day 2 of Sprint 2 must not read as a card from Sprint 1
    // that is now a Sprint old.
    const started = startItem(sprint(), inSprint(sprint()).id);
    const item = started.backlog.find((it) => it.started)!;
    expect(daysInProgress({ ...started, sprintNumber: 2, dayNumber: 2 }, item)).toBeNull();
  });
});

describe('the board says it', () => {
  const noop = () => {};
  const api = {
    onEstimate: noop, onToggleTask: noop, onFinishItem: noop, onStartItem: noop, onPull: noop,
    onSplitEpic: noop, onAssignDev: noop, onOpen: noop, onEndDay: noop, onHoldDailyScrum: noop,
    onSkipDailyScrum: noop, onStartDay: noop, onBuilding: noop,
  };
  const board = (state: ZooGameState) => render(
    <MemoryRouter><SprintBoard state={state} {...api} /></MemoryRouter>,
  ).container;
  const badge = (c: Element) => c.querySelector('[data-part="card-age"]');

  it('draws nothing on a card that has not been started', () => {
    expect(badge(board(sprint())), 'a card in To Do is wearing an age').toBeFalsy();
  });

  it('draws the days once it is in progress', () => {
    const s = startItem(sprint(), inSprint(sprint()).id);
    const b = badge(board(s));
    expect(b, 'a card in Doing shows no age').toBeTruthy();
    expect(b!.getAttribute('data-days')).toBe('1');
    expect(b!.textContent).toBe('1d');
  });

  it('changes colour at two days and again at three', () => {
    const s = startItem(sprint(), inSprint(sprint()).id);
    const at = (day: number) => badge(board({ ...s, dayNumber: day }))!.getAttribute('class') ?? '';
    expect(at(1), 'a card picked up today is already being flagged').toMatch(/bg-muted\b/);
    expect(at(2), 'two days looks the same as one').not.toMatch(/bg-muted\b/);
    expect(at(3), 'three days looks the same as two').not.toBe(at(2));
    expect(at(3), 'three days is not drawn as the worst of them').toMatch(/destructive/);
  });
});

describe('the Retrospective notices work that sat', () => {
  it('says so once a card has been in progress three days', () => {
    const s = startItem(sprint(), inSprint(sprint()).id);
    const name = s.backlog.find((it) => it.started)!.name;
    expect(ageingCards({ ...s, dayNumber: 2 }, 3), 'two days counted as sitting').toHaveLength(0);
    const late = { ...s, dayNumber: 3 };
    expect(ageingCards(late, 3)).toHaveLength(1);

    const sat = antiPatterns(late).find((p) => p.id === 'cards-sat');
    expect(sat, 'the Retrospective never mentions work that sat').toBeTruthy();
    expect(sat!.what, 'it does not name the card that sat longest').toContain(name);
    expect(sat!.instead, 'it offers nothing to do about it').toMatch(/start finishing|second Developer/i);
  });

  it('says nothing when the work moved', () => {
    const s = startItem(sprint(), inSprint(sprint()).id);
    expect(antiPatterns({ ...s, dayNumber: 1 }).find((p) => p.id === 'cards-sat'),
      'a Sprint where nothing sat was told it did').toBeFalsy();
  });
});
