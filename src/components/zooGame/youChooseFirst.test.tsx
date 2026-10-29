import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { initialZooState, DAY_SECONDS } from './config';
import { yourDev } from './engine';
import { SeatBand } from './SeatBand';
import type { ZooGameState } from './types';

// Which of the three Developers is you, and who reaches for a card first.
//
// Two reports, one cause. "Three Devs are mentioned. Which is the human player?" - you hold Ada
// and nothing on the screen said so, because the band marks the seat you took and a solo player
// takes no seat. And: "The AI Dev's start building stuff straight away. They have picked the
// interesting items i.e. an enclosure. A human player should pull first and the AIs follow with
// other items like the toilet."
//
// Both rules here are the game making room for the person at the table rather than anything the
// Guide says. The Sprint Backlog belongs to the Developers and a real team would take the top of
// it; what a real team would also do is ask the person standing there what they want to pick up.

const sprint = (over: Partial<ZooGameState> = {}): ZooGameState => {
  const base = initialZooState(3);
  const ready = base.backlog
    .filter((it) => !it.unsized && !['epic', 'exhibit'].includes(it.category)).slice(0, 4);
  return {
    ...base, phase: 'sprint', dayStage: 'building', sprintNumber: 1, dayNumber: 1,
    daySecondsLeft: DAY_SECONDS, wipLimit: 0,
    committedIds: ready.map((it) => it.id),
    backlog: base.backlog.map((it) => (ready.some((r) => r.id === it.id)
      ? { ...it, status: 'committed' as const, sprintNumber: 1, pos: { x: 200, y: 300 } } : it)),
    ...over,
  } as ZooGameState;
};

describe('you are one of the three', () => {
  it('and the band says which', () => {
    const s = sprint();
    const c = render(<MemoryRouter><SeatBand state={s} /></MemoryRouter>).container;
    // By the marker rather than by the words: the band's spans run together in `textContent`,
    // so "Ada" + "you" reads as "Adayou" and a word boundary finds nothing.
    const yours = [...c.querySelectorAll('[data-part="seat-you"]')]
      .map((n) => n.closest('[data-part="seat"]')!);
    // Your Developer and the Scrum Master: alone you are both, and only the Product Owner is played.
    expect(yours.length, 'the band does not say which of them you are').toBe(2);
    expect(yours[0].textContent + yours[1].textContent, 'your Developer is not marked as you').toContain(yourDev(s)!.name);
    expect(yours.map((y) => y.textContent).join(' '), 'the Scrum Master is not marked as you').toMatch(/^SM/m);
  });

  it('and never the Product Owner', () => {
    // Priya is played by the game in a solo match. Marking her as you would be the opposite of
    // what the seat band is for.
    const s = sprint();
    const c = render(<MemoryRouter><SeatBand state={s} /></MemoryRouter>).container;
    for (const n of c.querySelectorAll('[data-part="seat-you"]')) {
      expect(n.closest('[data-part="seat"]')!.textContent, 'the Product Owner is marked as you').not.toMatch(/\bPO\b/);
    }
  });

  it('and in a shared game it is still the seat you took', () => {
    // The band's older job. A Product Owner sitting with real Developers is marked at their own
    // seat, and no Developer is marked at all.
    const s = sprint();
    const c = render(<MemoryRouter><SeatBand state={s} seat="product_owner" /></MemoryRouter>).container;
    const yours = [...c.querySelectorAll('[data-part="seat-you"]')]
      .map((n) => n.closest('[data-part="seat"]')!);
    expect(yours.length, 'the seat you took is not marked, or something else is').toBe(1);
    // The band writes the person's short name beside the accountability's initials, so match on
    // what it draws rather than on the full "Priya (PO)" the state carries.
    expect(yours[0].textContent).toMatch(/PO/);
    expect(yours[0].textContent, 'a Developer is marked as you as well')
      .not.toContain(yourDev(s)!.name);
  });
});

describe('and you can say what to call you', () => {
  // "Maybe people do not want to be called Ada. Can we add the ability to add a name?" The engine
  // has had `renameMember` for months; nothing in the game reached it.
  //
  // On the BAND rather than only on Meet the Team, because the band is on every screen and most
  // players never see Meet the Team: it is reached from the long way round, and "Start building"
  // goes straight to a planned Sprint 1.
  const band = (over: Partial<ZooGameState> = {}, onRename = () => {}) => render(
    <MemoryRouter><SeatBand state={sprint(over)} onRename={onRename} /></MemoryRouter>,
  ).container;

  it('offers it on your own seat and nobody else\u2019s', () => {
    const c = band();
    const pencils = [...c.querySelectorAll('[data-part="rename-me"]')];
    expect(pencils.length, 'you cannot change your name, or everybody\u2019s is changeable').toBe(1);
    expect(pencils[0].closest('[data-part="seat"]')!.textContent)
      .toContain(yourDev(sprint())!.name);
  });

  it('takes a name and keeps it', () => {
    const named: [string, string][] = [];
    const s = sprint();
    const c = render(
      <MemoryRouter><SeatBand state={s} onRename={(id, name) => { named.push([id, name]); }} /></MemoryRouter>,
    ).container;
    fireEvent.click(c.querySelector('[data-part="rename-me"]')!);
    const field = c.querySelector('[data-part="your-name"]')!;
    expect(field, 'pressing it offered nothing to type into').toBeTruthy();
    fireEvent.change(field, { target: { value: 'Al' } });
    expect(named, 'typing a name changed nothing').toEqual([[yourDev(s)!.id, 'Al']]);
  });

  it('is a button until you press it, so the band stays a band', () => {
    const c = band();
    expect(c.querySelector('[data-part="your-name"]'),
      'there is a text box on the band at all times').toBeNull();
  });

  it('and says nothing about renaming when nobody can', () => {
    const c = render(<MemoryRouter><SeatBand state={sprint()} /></MemoryRouter>).container;
    expect(c.querySelector('[data-part="rename-me"]'),
      'it offers a rename with nothing to carry it').toBeNull();
  });
});

