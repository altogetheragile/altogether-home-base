import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { SeatCard } from './ZooLobby';
import { seatIsAway, unmannedSeats, hereCount, type SeatLike, type ParticipantLike } from './seatPresence';
import type { Seat, Participant } from './useZooSessions';

// A seat's holder and its occupant are not the same thing.
//
// Somebody claims the Product Owner seat, then their laptop sleeps or they close the tab without
// leaving. The seat is still theirs, so it is neither played by AI nor free for anybody else - and
// the gate counted it as staffed, so its work fell to nobody. The board waited on a person who had
// gone home, with nothing on screen to say so and no way in the game to recover it.

const seats: SeatLike[] = [
  { seat: 'product_owner', participant_id: 'p-al', is_ai: false },
  { seat: 'scrum_master', participant_id: 'p-sam', is_ai: false },
  { seat: 'developer', participant_id: null, is_ai: true },
  { seat: 'developer', participant_id: null, is_ai: false },
];
const people: ParticipantLike[] = [
  { id: 'p-al', user_id: 'u-al' },
  { id: 'p-sam', user_id: 'u-sam' },
];

describe('away', () => {
  it('is a third state: taken, and nobody in it', () => {
    const here = ['u-al'];        // Sam's laptop is asleep
    expect(seatIsAway(seats[0], people, here), 'somebody present was called away').toBe(false);
    expect(seatIsAway(seats[1], people, here), 'a holder who is not here read as present').toBe(true);
    expect(seatIsAway(seats[2], people, here), 'an AI seat was called away').toBe(false);
    expect(seatIsAway(seats[3], people, here), 'an empty seat was called away').toBe(false);
  });

  it('means the team covers that work, the way an empty seat does', () => {
    // The gate's question is "is anybody doing this?", and the answer is the same either way.
    expect(unmannedSeats(seats, people, ['u-al'])).toEqual(['scrum_master', 'developer']);
    expect(unmannedSeats(seats, people, ['u-al', 'u-sam']),
      'a full table still had work falling to nobody').toEqual(['developer']);
  });

  it('is never guessed before presence is known', () => {
    // Empty presence means the channel has not synced - not that the room is deserted. Calling
    // everybody absent for a second would open every gate in the game.
    expect(unmannedSeats(seats, people, []), 'an unsynced channel emptied the table').toEqual(['developer']);
    expect(hereCount(people, []), 'nobody was counted before presence arrived').toBe(2);
  });
});

describe('how many are here', () => {
  it('counts who is at the table, not who has ever joined it', () => {
    expect(hereCount(people, ['u-al'])).toBe(1);
    expect(hereCount(people, ['u-al', 'u-sam'])).toBe(2);
  });
});

const seat = (over: Partial<Seat> = {}): Seat => ({
  id: 's1', game_id: 'g1', seat: 'product_owner', seat_no: 1,
  participant_id: 'p-sam', is_ai: false, claimed_at: null, ...over,
} as Seat);
const sam = (): Participant => ({
  id: 'p-sam', session_id: 'x', user_id: 'u-sam', display_name: 'Sam', role: 'player', can_facilitate: false,
} as Participant);

describe('an away seat on the table', () => {
  it('says so, and says whose it is', () => {
    const { container } = render(
      <SeatCard seat={seat()} holder={sam()} away mine={false} canAct onClaim={() => {}} onLeave={() => {}} onAi={() => {}} />,
    );
    expect(container.querySelector('[data-part="seat-away"]'), 'an absent holder looked present').toBeTruthy();
    expect(container.textContent, 'the seat did not say who is missing from it').toMatch(/Sam - not here/);
  });

  it('can be covered by the host, so a closed laptop does not stop the Sprint', () => {
    const onAi = vi.fn();
    const { container } = render(
      <SeatCard seat={seat()} holder={sam()} away canCover mine={false} canAct
        onClaim={() => {}} onLeave={() => {}} onAi={onAi} />,
    );
    fireEvent.click(container.querySelector('[data-part="cover-away"]')!);
    expect(onAi, 'the host could not cover a seat nobody was in').toHaveBeenCalledWith(true);
  });

  it('is not somebody else’s to give away', () => {
    const { container } = render(
      <SeatCard seat={seat()} holder={sam()} away mine={false} canAct
        onClaim={() => {}} onLeave={() => {}} onAi={() => {}} />,
    );
    expect(container.querySelector('[data-part="cover-away"]'),
      'any player could hand another player’s seat to AI').toBeNull();
  });
});
