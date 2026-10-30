import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { SeatCard } from './ZooLobby';
import { tableSeats } from './lobbyTable';
import { STARTING_SEATS, MAX_DEVELOPERS, type Seat } from './useZooSessions';
import { SeatBand } from './SeatBand';
import { YouContext } from './you';
import { initialZooState } from './config';
import { joinTeam } from './engine';
import type { ZooGameState } from './types';

// The lobby, now every player is a Developer: one Product Owner seat and a row per player, up to
// nine; no Scrum Master seat, because the Scrum Master is a hat; and nothing to rotate between games
// (docs/ZOO_EVERYONE_A_DEVELOPER.md).

const seat = (over: Partial<Seat>): Seat => ({ id: `${over.seat}-${over.seat_no}`, seat: 'developer', seat_no: 1, participant_id: null, is_ai: false, ...over });

describe('the seats a game starts with', () => {
  it('are one Product Owner and nine Developers, and no Scrum Master', () => {
    expect(STARTING_SEATS.filter((c) => c.seat === 'product_owner')).toHaveLength(1);
    expect(STARTING_SEATS.filter((c) => c.seat === 'developer')).toHaveLength(MAX_DEVELOPERS);
    expect(MAX_DEVELOPERS).toBe(9);
    expect(STARTING_SEATS.some((c) => c.seat === 'scrum_master')).toBe(false);
  });
});

describe('the table in the lobby', () => {
  const seats = [
    seat({ seat: 'product_owner', is_ai: true }),
    ...Array.from({ length: 9 }, (_, i) => seat({ seat_no: i + 1, participant_id: i < 2 ? `p-${i}` : null })),
  ];

  it('shows the Product Owner, a row for each player, and one empty chair', () => {
    expect(tableSeats(seats, false).map((x) => [x.seat, x.participant_id])).toEqual([
      ['product_owner', null], ['developer', 'p-0'], ['developer', 'p-1'], ['developer', null]]);
  });

  it('offers no empty chair to somebody watching', () => {
    expect(tableSeats(seats, true).filter((x) => !x.participant_id && x.seat === 'developer')).toHaveLength(0);
  });

  it('shows an old game’s Scrum Master seat only while somebody is in it', () => {
    expect(tableSeats([...seats, seat({ seat: 'scrum_master', participant_id: null })], false).some((x) => x.seat === 'scrum_master')).toBe(false);
    expect(tableSeats([...seats, seat({ seat: 'scrum_master', participant_id: 'p-9' })], false).some((x) => x.seat === 'scrum_master')).toBe(true);
  });

  it('never offers AI for a Developer seat, only for the Product Owner', () => {
    const card = (x: Seat) => render(<SeatCard seat={x} holder={null} mine={false} canAct onClaim={() => {}} onLeave={() => {}} onAi={() => {}} />).container;
    const labels = (c: HTMLElement) => [...c.querySelectorAll('button')].map((b) => b.textContent);
    expect(labels(card(seat({ seat: 'developer' })))).toEqual(['Sit here']);
    expect(labels(card(seat({ seat: 'product_owner' })))).toEqual(['Sit here', 'AI']);
  });
});

describe('a player who is away', () => {
  it('is away on their own, not every Developer with them', () => {
    const base = initialZooState(5);
    const s = { ...joinTeam(joinTeam({ ...base, team: { ...base.team, developers: [] } } as ZooGameState, 'p-ann', 'Ann'), 'p-bo', 'Bo'),
      phase: 'sprint', dayStage: 'building' } as ZooGameState;
    const band = render(<YouContext.Provider value="p-bo"><SeatBand state={s} seat="developer" away={['p-ann']} /></YouContext.Provider>).container;
    const away = [...band.querySelectorAll('[data-part="seat"]')].filter((el) => el.querySelector('[data-part="seat-away"]'));
    expect(away.map((el) => el.textContent)).toEqual([expect.stringMatching(/^Ann/)]);
  });
});
