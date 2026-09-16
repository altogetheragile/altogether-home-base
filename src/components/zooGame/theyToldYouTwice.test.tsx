import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SprintReview } from './SprintReview';
import { acceptSignal, declineSignal, saidBefore } from './engine';
import { initialZooState } from './config';
import type { ZooGameState, BacklogItem } from './types';

// The loop the game exists to teach, said out loud.
//
// Visitors tell you something, you change the Product Backlog, the next Review tells you whether it
// worked. The Review had the two halves of that on two different steps and no line between them: a
// player read "we left at lunchtime, nowhere to eat" in one, pressed "add somewhere to eat" in
// another, and nothing said those were the same fact. The join was in the data the whole time -
// quotes carry a `cause`, signals carry a `drivenBy`, and they are drawn from one vocabulary.
//
// The second half matters more. A complaint arriving for the third time is not news, and the reason
// it came back is the lesson: you said no, or you agreed and never forecast it, or you built it and
// never opened it. Those are different mistakes and they were all presented as a fresh suggestion.

const withSignal = (over: Partial<ZooGameState> = {}): ZooGameState => ({
  ...initialZooState(3),
  phase: 'review', sprintNumber: 2,
  signals: [{ suggestion: 'Add somewhere to eat (a cafe or kiosk)', drivenBy: 'unmet:food', estimatedValue: 'medium' }],
  signalAge: { 'unmet:food': 1 },
  lastReview: {
    overallHappiness: 55, totalAttendance: 400,
    segments: [{ segmentId: 'families', happiness: 55, attendance: 400 }],
    quotes: [
      { segmentId: 'families', cause: 'unmet:food', severity: 'gripe', text: 'Lovely morning, but we left at lunchtime. Nowhere to eat.' },
      { segmentId: 'enthusiasts', cause: 'crowding', severity: 'warning', text: 'The queues rather spoiled it.' },
    ],
    signals: [], nextAttendance: {},
  },
  ...over,
} as unknown as ZooGameState);

const review = (state: ZooGameState) => render(
  <MemoryRouter>
    <SprintReview state={state} onTakeSignal={() => {}} onDeclineSignal={() => {}}
      onContinue={() => {}} onWrapUp={() => {}} onOpen={() => {}} onConfirmAc={() => {}}
      onToggleTask={() => {}} onSendBack={() => {}} />
  </MemoryRouter>,
);

/** The Review walks: What was Done, what the visitors made of it, what we do about it. The calls
 *  are on the last step, reached by its name on the step track. */
const goToWhatNext = () => {
  // Walked rather than jumped: the step track only lets you back to a step you have been to, which
  // is the Review being an agenda rather than a set of tabs.
  fireEvent.click(screen.getByRole('button', { name: /Next: the visitors/i }));
  fireEvent.click(screen.getByRole('button', { name: /Next: what we do about it/i }));
};

describe('a complaint and its call, in one place', () => {
  it('quotes the complaint on the row that decides about it', () => {
    const { container } = review(withSignal());
    goToWhatNext();
    const row = container.querySelector('[data-part="signal-call"][data-cause="unmet:food"]');
    expect(row, 'there is no call to make about what the visitors said').toBeTruthy();
    expect(row!.textContent, 'the decision is offered without the complaint that drove it')
      .toMatch(/left at lunchtime/);
  });

  it('brings only the complaints that drove this call', () => {
    const { container } = review(withSignal());
    goToWhatNext();
    const row = container.querySelector('[data-part="signal-call"][data-cause="unmet:food"]')!;
    expect(row.textContent, 'an unrelated quote was attached to this decision').not.toMatch(/queues/);
  });
});

describe('what the team already did about it', () => {
  const food = { suggestion: 'Add somewhere to eat (a cafe or kiosk)', drivenBy: 'unmet:food', estimatedValue: 'medium' as const };

  /** Sprint 1: the call. Sprint 2: they say it again. */
  const afterCall = (call: 'took' | 'declined', then: (s: ZooGameState) => ZooGameState = (x) => x) => {
    const s1 = { ...initialZooState(3), sprintNumber: 1, signals: [food] } as ZooGameState;
    const decided = call === 'took' ? acceptSignal(s1, 0) : declineSignal(s1, 0);
    return then({ ...decided, sprintNumber: 2, signals: [food] } as ZooGameState);
  };

  it('says nothing at all the first time they say it', () => {
    expect(saidBefore(withSignal(), 'unmet:food'),
      'a complaint nobody has been asked about yet comes with a history').toBeNull();
  });

  it('remembers turning it down, and that the cause did not go away', () => {
    const said = saidBefore(afterCall('declined'), 'unmet:food')!;
    expect(said.call).toBe('declined');
    expect(said.sprint).toBe(1);
    expect(said.said, 'the refusal is not named').toMatch(/turned this down in Sprint 1/i);
    expect(said.said).toMatch(/saying it again/i);
  });

  it('tells taking it into the Backlog from doing anything about it', () => {
    // The item exists and has never been forecast. Agreeing that something matters is the cheapest
    // thing a Product Owner can do, and the game used to let it read as having dealt with it.
    const said = saidBefore(afterCall('took'), 'unmet:food')!;
    expect(said.became).toBe('backlog');
    expect(said.said).toMatch(/not been forecast/i);
    expect(said.said, 'the difference between agreeing and doing is not drawn').toMatch(/not the same as doing it/i);
  });

  it('says when it is in this Sprint, so they are describing a zoo without it', () => {
    const said = saidBefore(afterCall('took', (s) => ({
      ...s, backlog: s.backlog.map((it) => (it.id.startsWith('sig-')
        ? { ...it, status: 'committed' as const, sprintNumber: 2 } : it)),
    })), 'unmet:food')!;
    expect(said.became).toBe('committed');
    expect(said.said).toMatch(/in this Sprint/i);
  });

  it('is loudest when it was built and never opened', () => {
    // Done is built and accepted; open is what a visitor can walk into. A team that built the cafe
    // and never opened it has spent the Sprint and delivered nothing, and the visitors saying it
    // again is the evidence. The one a player is least likely to work out alone.
    const said = saidBefore(afterCall('took', (s) => ({
      ...s, backlog: s.backlog.map((it) => (it.id.startsWith('sig-')
        ? { ...it, status: 'done' as const, sprintNumber: 2 } : it)),
    })), 'unmet:food')!;
    expect(said.became).toBe('done');
    expect(said.said, 'built-and-never-opened reads the same as never built').toMatch(/never been opened/i);
    expect(said.said).toMatch(/no visitor has been near it/i);
  });

  it('says one was not enough when it was built and opened', () => {
    const said = saidBefore(afterCall('took', (s) => ({
      ...s, backlog: s.backlog.map((it) => (it.id.startsWith('sig-')
        ? { ...it, status: 'open' as const, openedIn: 1 } : it)),
    })), 'unmet:food')!;
    expect(said.became).toBe('open');
    expect(said.said).toMatch(/one was not enough/i);
  });

  it('counts how many times they have raised it', () => {
    const once = afterCall('declined');
    const twice = { ...declineSignal({ ...once, signals: [food] } as ZooGameState, 0), sprintNumber: 3, signals: [food] } as ZooGameState;
    const said = saidBefore(twice, 'unmet:food')!;
    expect(said.times).toBe(2);
    expect(said.said, 'the third telling reads like the first').toMatch(/raised it 3 times/i);
  });

  it('shows it on the row, not only in the data', () => {
    const state = { ...afterCall('declined'),
      lastReview: withSignal().lastReview, signalAge: { 'unmet:food': 2 } } as ZooGameState;
    const { container } = review(state);
    goToWhatNext();
    const row = container.querySelector('[data-part="signal-call"][data-cause="unmet:food"]')!;
    expect(row.querySelector('[data-part="signal-before"]'), 'the row says nothing about the last call').toBeTruthy();
    expect(row.textContent).toMatch(/turned this down in Sprint 1/i);
    expect(row.querySelector('[data-part="signal-age"]')!.textContent, 'how long it has run is not said')
      .toMatch(/2nd Review running/i);
  });
});

describe('what the log keeps', () => {
  it('writes the call down as a fact as well as a sentence', () => {
    // The decision log is prose for the Retrospective. This is what the next Review reads.
    const s = { ...initialZooState(3), sprintNumber: 1,
      signals: [{ suggestion: 'Build more toilets', drivenBy: 'unmet:toilet', estimatedValue: 'high' as const }] } as ZooGameState;
    const after = acceptSignal(s, 0);
    expect(after.signalLog).toHaveLength(1);
    expect(after.signalLog![0]).toMatchObject({ sprint: 1, cause: 'unmet:toilet', call: 'took' });
    expect(after.signalLog![0].itemId, 'nothing connects the call to what it created').toBeTruthy();
    expect(after.backlog.some((it: BacklogItem) => it.id === after.signalLog![0].itemId)).toBe(true);
    // ...and the sentence is still there for the Retrospective.
    expect((after.decisions ?? []).some((d) => d.kind === 'signal')).toBe(true);
  });

  it('keeps a declined call, which creates nothing', () => {
    const s = { ...initialZooState(3), sprintNumber: 2,
      signals: [{ suggestion: 'Ease crowding', drivenBy: 'crowding', estimatedValue: 'low' as const }] } as ZooGameState;
    const after = declineSignal(s, 0);
    expect(after.signalLog![0]).toMatchObject({ sprint: 2, cause: 'crowding', call: 'declined' });
    expect(after.signalLog![0].itemId).toBeUndefined();
  });

  it('survives a game saved before any of this existed', () => {
    // signalLog is optional: an older save has none, and reads as nothing decided yet.
    const old = { ...initialZooState(3), signalLog: undefined } as unknown as ZooGameState;
    expect(saidBefore(old, 'unmet:food')).toBeNull();
    expect(declineSignal({ ...old, signals: [{ suggestion: 'x', drivenBy: 'unmet:rest', estimatedValue: 'low' }] } as ZooGameState, 0).signalLog)
      .toHaveLength(1);
  });
});
