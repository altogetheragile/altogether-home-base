import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SprintBoard } from './SprintBoard';
import { DailyScrum } from './DailyScrum';
import { todaysDecision } from './engine';
import { initialZooState } from './config';
import type { ZooGameState } from './types';

// The Daily Scrum is an event, and every event in this game runs over the artifact it is about.
//
// This one replaced the board instead: a short conversation about the Sprint Backlog, on a screen
// with no Sprint Backlog on it, with the decision that is the whole point of the event eight hundred
// pixels down. And nothing said whose event it is.

const noop = () => {};

/** A Sprint the day cannot pay for, so there is a decision to make. */
const scrum = (over: Partial<ZooGameState> = {}): ZooGameState => {
  const base = initialZooState(3);
  const take = base.backlog.filter((it) => !it.unsized && it.category !== 'epic').slice(0, 3);
  return {
    ...base, phase: 'sprint', dayStage: 'dailyScrum', dayNumber: 3, sprintDays: 3,
    sprintGoal: 'Deliver the Big Cats zone so visitors have more to enjoy',
    scrumSecondsLeft: 17, daySecondsLeft: 10,
    committedIds: take.map((it) => it.id),
    forecastPoints: take.reduce((s, it) => s + it.estimate, 0),
    backlog: base.backlog.map((it) => (take.some((t) => t.id === it.id)
      ? { ...it, status: 'committed' as const, sprintNumber: 1 } : it)),
    ...over,
  } as ZooGameState;
};

const board = (state: ZooGameState, props: Record<string, unknown> = {}) => render(
  <MemoryRouter>
    <SprintBoard state={state}
      onEstimate={noop} onToggleTask={noop} onConfirmAc={noop} onFinishItem={noop}
      onStartItem={noop} onSetLearnMode={noop} onSetScrumAt={noop} onPull={noop} onSplitEpic={noop}
      onAssignDev={noop} onRenameMember={noop} onOpen={noop} onEndDay={noop}
      onHoldDailyScrum={noop} onSkipDailyScrum={noop} onStartDay={noop} onBuilding={noop}
      onDropFromSprint={noop} {...props} />
  </MemoryRouter>,
);

describe('the Daily Scrum as an event', () => {
  it('is held in front of the board, and the board stays live', () => {
    // An event that hides the artifact it is about teaches that the event is paperwork. The
    // Developers adapt the Sprint Backlog while they talk - reorder it, swap who is on what, hand
    // something back - so the board is beside the conversation, not behind it.
    const { container } = board(scrum());
    const event = container.querySelector('[data-part="daily-scrum"]');
    expect(event, 'the Daily Scrum is not on the screen').toBeTruthy();
    expect(event!.className, 'the event is covering the board again').not.toMatch(/absolute|backdrop-blur/);
    expect(container.textContent, 'the board vanished for the length of the event').toMatch(/To Do|Doing/);
    expect(container.querySelector('[data-part="hand-it-back"]'),
      'there is no way to hand work back during the event').toBeTruthy();
  });

  it('hands work back to the Product Backlog when it is dropped there', () => {
    const onDropFromSprint = vi.fn();
    const s = scrum();
    const item = s.backlog.find((it) => it.status === 'committed' && !it.started)!;
    const { container } = board(s, { onDropFromSprint });
    const card = [...container.querySelectorAll('[draggable="true"]')]
      .find((el) => (el.textContent ?? '').trim().startsWith(item.name))!;
    const dt = { types: ['text/plain'], getData: () => item.id, setData: () => {}, effectAllowed: '' };
    fireEvent.dragStart(card, { dataTransfer: dt });
    const back = container.querySelector('[data-part="hand-it-back"]')!;
    fireEvent.dragOver(back, { dataTransfer: dt });
    fireEvent.drop(back, { dataTransfer: dt });
    expect(onDropFromSprint, 'dropping work on "hand it back" did nothing').toHaveBeenCalledWith(item.id);
  });

  it('offers no way round itself', () => {
    // The event is the way on. A floating "End day" beside it is a second way out of a conversation
    // the game is asking you to have.
    const { container } = board(scrum());
    expect(container.textContent).not.toMatch(/End Day \d/);
    expect(document.body.textContent, 'the dock still ends the day mid-event').not.toMatch(/End Day \d/);
  });
});

describe('what the Daily Scrum puts above the fold', () => {
  const screen = (state = scrum()) => render(
    <MemoryRouter><DailyScrum state={state} onHold={noop} onSkip={noop} onDrop={noop} /></MemoryRouter>,
  ).container;

  it('puts the decision beside the burndown, not below it', () => {
    const c = screen();
    const decision = c.querySelector('[data-part="decision"]');
    expect(decision, 'there is no decision on the screen the decision is for').toBeTruthy();
    expect(decision!.textContent).toMatch(/points left/);
    expect(decision!.textContent, 'the decision offers nothing to decide').toMatch(/Drop .+, (protect the Goal|finish the rest)/);
    expect(decision!.textContent).toMatch(/Keep the plan/);
    // Side by side: one grid, two children, no scrolling between them.
    expect(decision!.parentElement!.className).toMatch(/grid/);
    expect(decision!.parentElement!.className).toMatch(/lg:grid-cols-2/);
  });

  it('names who is in the room', () => {
    const c = screen();
    const line = c.querySelector('[data-part="in-the-room"]');
    expect(line, 'nothing says whose event this is').toBeTruthy();
    expect(line!.textContent).toMatch(/the Developers/);
    expect(line!.textContent).toMatch(/Ada/);
    expect(line!.textContent, 'it does not say what the others are doing there').toMatch(/Product Owner/);
  });

  it('says what the game actually does about skipping it', () => {
    // The copy said the Daily Scrum "always happens" on a screen with a button that skips it.
    const c = screen(scrum({ pendingImpediment: { id: 'imp1', title: 'A blocker', detail: 'in the way' } as unknown as ZooGameState['pendingImpediment'] }));
    expect(c.textContent, 'the copy still claims what the game does not do').not.toMatch(/It always happens/i);
    expect(c.textContent).toMatch(/carry on regardless/i);
  });

  it('counts items until essentials can be marked', () => {
    // "none ⭐" read as a fault rather than as something not met yet.
    const c = screen();
    expect(c.textContent, 'the essentials figure is still a shrug').not.toMatch(/none/);
    expect(c.textContent).toMatch(/Items done/);
  });
});

describe('what the decision may claim', () => {
  it('does not say the Goal is safe without something to be safe about', () => {
    // Nothing is marked essential in the first Sprint, so a decision that says "X is not what the
    // Goal depends on" is the game asserting something nobody has told it.
    const s = scrum();
    const d = todaysDecision(s)!;
    expect(d, 'there is no decision to make in a Sprint that cannot fit').toBeTruthy();
    expect(d.essentialsKnown).toBe(false);
    expect(d.ifKept, 'it claimed the Goal was at risk with no essentials marked').not.toMatch(/Goal is at risk/);

    // ...and once the team has marked them, it may say exactly that.
    const marked = { ...s, backlog: s.backlog.map((it) => (it.status === 'committed' && it.estimate <= 3 ? { ...it, goalCritical: true } : it)) } as ZooGameState;
    const known = todaysDecision(marked)!;
    expect(known.essentialsKnown).toBe(true);
    expect(known.ifKept).toMatch(/Goal is at risk/);
  });
});
