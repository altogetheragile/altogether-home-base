import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ZooShell } from './ZooShell';
import { eventPill, clocks, whoDoesWhatNow, seatLines } from './header';
import { initialZooState, DAY_SECONDS } from './config';
import type { ZooGameState } from './types';

// The header, on every screen: strip, tabs, band.
//
// From the screen flow of 7 September. The strip says where you are (the event pill), how much time
// is left (one big clock, dead centre), and whether the Goal is safe. The band says who does what
// now, and what each of the five people is doing. What went: the seat chip, the phase label, the
// day counter, the "drag a Developer" instruction, the help and settings icons - each of them said
// something already said, or said it in the wrong weight.

const sprint = (over: Partial<ZooGameState> = {}): ZooGameState => ({
  ...initialZooState(3), phase: 'sprint', dayStage: 'building', sprintNumber: 1, dayNumber: 1,
  daySecondsLeft: 88, sprintGoal: 'Deliver the Big Cats zone', ...over,
} as ZooGameState);

const shell = (state: ZooGameState) => render(
  <MemoryRouter><ZooShell state={state}><div>the screen</div></ZooShell></MemoryRouter>,
);

describe('where you are, in the words the event uses', () => {
  it('names the day while you are building, and the event while one runs', () => {
    expect(eventPill(sprint()).text).toBe('Day 1 · Building');
    expect(eventPill(sprint()).event, 'a working day was dressed as an event').toBe(false);

    const scrum = eventPill(sprint({ dayStage: 'dailyScrum' }));
    expect(scrum.text).toBe('Daily Scrum · Day 1');
    expect(scrum.event, 'an event was not marked as one').toBe(true);

    expect(eventPill({ ...sprint(), phase: 'planning', planningTopic: 'what' } as ZooGameState).text)
      .toBe('Sprint Planning · What');
    expect(eventPill({ ...sprint(), phase: 'refine' } as ZooGameState).text).toBe('Before Sprint 1');
  });
});

describe('two clocks, one big', () => {
  it('counts the day while it is being worked', () => {
    const { big, small } = clocks(sprint());
    expect(big!.seconds).toBe(88);
    expect(big!.label).toBe('left today');
    expect(small, 'a working day had a second clock under it').toBeUndefined();
  });

  it('makes the timebox big during an event, with the day small beneath it', () => {
    // Every event is inside the Sprint, so the day keeps running through the Daily Scrum - that is
    // the lesson. But only one number is big at a time.
    const { big, small } = clocks(sprint({ dayStage: 'dailyScrum', scrumSecondsLeft: 12, daySecondsLeft: 45 }));
    expect(big!.seconds, 'the timebox is not the number being watched').toBe(12);
    expect(big!.label).toMatch(/timebox/);
    expect(small, 'the day stopped being counted during the event').toMatch(/day 1 · 0:45 left/);
  });

  it('says there is no clock before the first Sprint, rather than showing a zero', () => {
    expect(clocks({ ...initialZooState(3), phase: 'refine' } as ZooGameState).big).toBeNull();
    const { container } = shell({ ...initialZooState(3), phase: 'refine' } as ZooGameState);
    expect(container.querySelector('[data-part="day-clock"]')!.textContent).toMatch(/—|no Sprint yet/);
  });

  it('draws it big, in the strip, and nowhere else', () => {
    const { container } = shell(sprint({ daySecondsLeft: DAY_SECONDS }));
    const clock = container.querySelector('.zoo-band [data-part="day-clock"]');
    expect(clock, 'the clock is off the strip again').toBeTruthy();
    expect(clock!.innerHTML, 'the clock is chip-sized').toMatch(/text-\[2\.75rem\]/);
    expect(container.querySelectorAll('[data-part="day-clock"]').length, 'the clock is on the screen twice').toBe(1);
  });
});

describe('the band', () => {
  it('says who does what now, in one sentence that changes with the screen', () => {
    expect(whoDoesWhatNow(sprint())).toMatch(/Developers pull and build/);
    expect(whoDoesWhatNow(sprint({ dayStage: 'dailyScrum' })), 'the Daily Scrum is anybody’s').toMatch(/not in the room/);
    expect(whoDoesWhatNow({ ...sprint(), phase: 'planning', planningTopic: 'what' } as ZooGameState))
      .toMatch(/Developers select/);
  });

  it('shows five people and what each of them is doing', () => {
    const { container } = shell(sprint());
    const band = container.querySelector('[data-part="seat-band"]')!;
    expect(band, 'the accountabilities are invisible again').toBeTruthy();
    expect(band.querySelectorAll('[data-part="seat"]').length, 'five seats, three accountabilities').toBe(5);
    for (const line of seatLines(sprint())) {
      expect(band.textContent, `${line.name} is on the band with nothing to do`).toContain(line.doing);
    }
  });

  it('greys the two who are not in the room at the Daily Scrum', () => {
    const lines = seatLines(sprint({ dayStage: 'dailyScrum' }));
    const away = lines.filter((l) => !l.present).map((l) => l.role);
    expect(away, 'the Daily Scrum is the Developers’ - and the screen does not say so').toEqual(['product_owner', 'scrum_master']);
    expect(lines.filter((l) => l.role === 'developer').every((l) => l.present)).toBe(true);
  });

  it('says what a Developer is building, by name', () => {
    const base = sprint();
    const item = base.backlog.find((it) => !it.unsized)!;
    const dev = base.team.developers[0];
    const building = {
      ...base,
      backlog: base.backlog.map((it) => (it.id === item.id
        ? { ...it, status: 'committed' as const, sprintNumber: 1, started: true, assignedDevs: [dev.id] } : it)),
    } as ZooGameState;
    const line = seatLines(building).find((l) => l.id === dev.id)!;
    expect(line.doing, 'the band says "available" while they are building something').toMatch(/^building /);
  });
});

describe('the band in a shared game', () => {
  it('outlines the seat you hold, and says which empty ones fall to you', () => {
    // The seat chip used to say both, and it went with the old strip. In a shared game they still
    // have to be said: a covered seat is work you did not think was yours.
    const { container } = render(
      <MemoryRouter>
        <ZooShell state={sprint()} seat="product_owner" covering={['scrum_master']}><div /></ZooShell>
      </MemoryRouter>,
    );
    const seats = [...container.querySelectorAll('[data-part="seat"]')];
    const mine = seats.find((s) => /you$/i.test((s.textContent ?? '').split('\n')[0].trim()) || /you/.test(s.textContent ?? ''))!;
    expect(mine.textContent, 'nothing says which seat is yours').toMatch(/Priya|you/i);
    expect(container.textContent, 'nothing says the empty seat’s work falls to you').toMatch(/covering/i);
  });

  it('says an observer is watching, and outlines nothing', () => {
    const { container } = render(
      <MemoryRouter>
        <ZooShell state={sprint()} seat="developer" observer><div /></ZooShell>
      </MemoryRouter>,
    );
    expect(container.querySelector('[data-part="seat-band"]')!.textContent).toMatch(/watching/i);
    expect(container.textContent, 'a watcher was given a seat of their own').not.toMatch(/\bcovering\b/i);
  });
});
