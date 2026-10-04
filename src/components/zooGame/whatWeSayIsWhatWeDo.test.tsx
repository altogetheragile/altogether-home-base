import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DailyScrum } from './DailyScrum';
import { ORIENTATION, SCRUM_CARDS, CARDS_BY_PHASE, cardFor } from './scrumContent';
import { initialZooState, DAILY_SCRUM_SECONDS } from './config';
import { startOnTheBoard, runDailyScrum, dayTotalSeconds } from './engine';
import type { ZooGameState } from './types';

// Two bugs, one shape: a sentence that was true when it was written, and a mechanic that moved
// underneath it.
//
//   #874 - orientation said three Definition of Done lines arrived with the game. They used to.
//          `startOnTheBoard` now empties them on purpose, and the line went on saying it.
//   #875 - the Daily Scrum told a disciplined team the event cost them nothing. It used to be free
//          for them. The engine now charges its timebox whoever holds it, and the line stayed.
//
// Pinning the new wording would catch neither of them again: both sentences were correct the day
// they were written. So these ask the ENGINE what happens and hold the copy against it. Move the
// mechanic and the test fails, naming the sentence that now lies.

const game = () => startOnTheBoard(initialZooState(1) as never) as ZooGameState;
/** Every surprise orientation lists that mentions the Definition of Done, as one piece of text.
 *
 *  All of them, not the first match: two rows mention it - what Done means, and what you were
 *  handed - and a test that picked one picked the wrong one and passed on it. */
const aboutDone = (): string => {
  const rows = ORIENTATION.gotchas.rows.filter((r) => /definition of done/i.test(`${r.name} ${r.text}`));
  expect(rows.length, 'orientation says nothing about the Definition of Done at all').toBeGreaterThan(0);
  return rows.map((r) => `${r.name} ${r.text}`).join(' \u00b7 ');
};

describe('what orientation says about the Definition of Done', () => {
  it('is what the game actually starts you with', () => {
    const lines = game().definitionOfDone.length;
    const said = aboutDone();
    if (lines === 0) {
      expect(said, 'the game hands over no Definition of Done, and orientation says lines arrived')
        .not.toMatch(/were given|arrived with the game|three lines/i);
      expect(said, 'orientation never says you have none').toMatch(/no definition of done|have none/i);
    } else {
      expect(said, `the game hands over ${lines} lines, and orientation says you have none`)
        .not.toMatch(/you have no definition of done/i);
    }
  });

  it('still makes the point, which is that somebody else decided', () => {
    // The lesson survived the correction: noticing what you were handed, or not handed, is the
    // exercise. A row that only states a fact teaches nothing.
    expect(aboutDone(), 'nobody is said to have asked you').toMatch(/asked you|nobody/i);
  });
});

describe('what the Daily Scrum says it costs', () => {
  const screen = (scrumDiscipline: boolean) => {
    const state = { ...game(), dayStage: 'dailyScrum', scrumDiscipline, pendingImpediment: null } as ZooGameState;
    return render(<MemoryRouter><DailyScrum state={state} onHold={() => {}} onSkip={() => {}} /></MemoryRouter>).container;
  };

  it('never tells a team the event is free, while the engine charges for it', () => {
    // `scrumDiscipline` buys a cheaper carried blocker, not a cheaper event. The event itself is
    // charged in the seconds it takes, and a team that sits through the box pays all of it.
    const held = runDailyScrum({ ...game(), dayStage: 'dailyScrum', pendingImpediment: null } as ZooGameState);
    expect(held.daySecondsLeft, 'the event is free again, so this test is the stale one')
      .toBeLessThan(dayTotalSeconds(1));
    for (const disciplined of [true, false]) {
      const said = screen(disciplined).textContent ?? '';
      expect(said, 'the Daily Scrum claims to cost nothing').not.toMatch(/no time lost|costs nothing|free/i);
      expect(said, 'the Daily Scrum does not say what it costs').toMatch(/costs the time you spend/i);
    }
  });

  it('says what holding it every day does buy', () => {
    expect(screen(true).textContent ?? '', 'the habit buys nothing anybody is told about')
      .toMatch(/carried blocker/i);
  });
});

describe('the Daily Scrum is the Developers’ event', () => {
  it('runs for the timebox the config sets', () => {
    expect(DAILY_SCRUM_SECONDS).toBe(30);
  });

  it('is ended by the Developers saying so', () => {
    const state = { ...game(), dayStage: 'dailyScrum', pendingImpediment: null } as ZooGameState;
    const c = render(<MemoryRouter><DailyScrum state={state} onHold={() => {}} onSkip={() => {}} /></MemoryRouter>).container;
    expect(c.textContent, 'nothing on the screen ends the event early').toMatch(/We’re done/);
  });
});

describe('the Definition of Ready', () => {
  it('is taught where it is used, and flagged as not the Guide’s', () => {
    const card = cardFor('definition-of-ready');
    expect(card, 'the Definition of Ready gates Planning and is taught nowhere').toBeTruthy();
    expect(card!.notScrum, 'it is taught as though the Guide asked for it').toBeTruthy();
    expect(CARDS_BY_PHASE.planning, 'it is not offered at the event that applies it')
      .toContain('definition-of-ready');
  });

  it('is one of the cards that keep the line visible', () => {
    // The field exists so a learner is never taught a convention as a rule. Four carried it before
    // this one; a card claiming to be Scrum when it is not is the fault it guards.
    const flagged = SCRUM_CARDS.filter((c) => c.notScrum).map((c) => c.id);
    expect(flagged, 'nothing is flagged any more').toContain('definition-of-ready');
    expect(flagged.length, 'the notScrum flag has stopped being used').toBeGreaterThan(4);
  });
});
