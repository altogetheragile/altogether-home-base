import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { SeatCard } from './ZooLobby';
import { mayTake } from './seatRules';
import type { Seat, Participant } from './useZooSessions';

// Watching, and the seat you were in.
//
// An observer is refused every action by the seat rules - that is the whole of what watching is. So
// a player who switches to watching WHILE SEATED holds the one seat nobody can act from, and the
// table waits on them for ever. Standing up gives the seat away in the same act now; this is the
// other half, for a session that predates it: leaving your own seat is always yours, watching or
// not. It was hidden along with every other control on the card.

const seat = (over: Partial<Seat> = {}): Seat => ({
  id: 's1', game_id: 'g1', seat: 'product_owner', seat_no: 1,
  participant_id: 'p1', is_ai: false, claimed_at: null, ...over,
} as Seat);

const holder = (): Participant => ({
  id: 'p1', session_id: 'x', user_id: 'u1', display_name: 'Al', role: 'observer', can_facilitate: false,
} as Participant);

const card = (props: Partial<Parameters<typeof SeatCard>[0]> = {}) => render(
  <SeatCard seat={seat()} holder={holder()} mine canAct={false} canLeave
    onClaim={() => {}} onLeave={() => {}} onAi={() => {}} {...props} />,
).container;

describe('watching', () => {
  it('means taking no part in the work', () => {
    expect(mayTake('FINISH_ITEM', { seat: 'developer', observer: true }).allowed,
      'an observer acted on the work').toBe(false);
  });

  it('never strands somebody in the seat the table is waiting on', () => {
    const onLeave = vi.fn();
    const leave = [...card({ onLeave }).querySelectorAll('button')]
      .find((b) => /Leave/.test(b.textContent ?? ''));
    expect(leave, 'a seated observer had no way out of the seat').toBeTruthy();
    fireEvent.click(leave!);
    expect(onLeave).toHaveBeenCalled();
  });

  it('does not let a watcher take or clear anybody else’s seat', () => {
    const text = card({ mine: false, canLeave: false, seat: seat({ participant_id: null, is_ai: true }) }).textContent ?? '';
    expect(text, 'watching still offered to take a seat').not.toMatch(/Take it|Sit here|Clear/);
  });
});
