import type { SeatName } from './useZooSessions';

// ============= Who is actually at the table =============
//
// A seat has a holder and it has an occupant, and they are not the same thing. Somebody claims the
// Product Owner seat, then their laptop sleeps, or they close the tab without leaving - and the seat
// is still theirs, so it is neither played by AI nor free for anybody else. The board waits on a
// person who has gone home, and nothing on screen says so.
//
// Presence answers it: a live list of who is connected to this session right now. A seat with a
// holder who is not in that list is AWAY - still theirs when they come back, and in the meantime not
// something the team should be waiting on.
//
// One definition, because three things ask the question: the lobby (who is here, which seats to
// show as away), the gate (whose work falls to the team), and the host (which seats are worth
// covering with AI).

export interface SeatLike { seat: SeatName; participant_id: string | null; is_ai: boolean }
export interface ParticipantLike { id: string; user_id: string }

/** Whether the person holding this seat is connected right now. */
export function holderHere(seat: SeatLike, participants: ParticipantLike[], present: string[]): boolean {
  if (!seat.participant_id) return false;
  const who = participants.find((p) => p.id === seat.participant_id);
  return !!who && present.includes(who.user_id);
}

/** Whether this seat is held by somebody who is not here.
 *
 *  Held and empty are different states and this is a third: taken, and nobody in it. It is the one
 *  the game had no word for. */
export function seatIsAway(seat: SeatLike, participants: ParticipantLike[], present: string[]): boolean {
  return !!seat.participant_id && !seat.is_ai && !holderHere(seat, participants, present);
}

/** The seats the team has to cover between them: nobody in them, or nobody there.
 *
 *  This is what the gate means by an empty seat. It used to mean "no participant and no AI", which
 *  left a held-but-absent seat looking staffed - so its work fell to nobody, and a Sprint could sit
 *  waiting on somebody who had shut their laptop an hour ago.
 *
 *  While presence is unknown - before the channel has synced, which includes this browser itself -
 *  nothing is called away. Guessing "everybody is absent" for a second would open every gate in the
 *  game, and a rule that is briefly wrong in the loosest possible direction is worse than one that
 *  waits. */
export function unmannedSeats(seats: SeatLike[], participants: ParticipantLike[], present: string[]): SeatName[] {
  if (!present.length) return seats.filter((s) => !s.participant_id && !s.is_ai).map((s) => s.seat);
  return seats
    .filter((s) => !s.is_ai && !holderHere(s, participants, present))
    .map((s) => s.seat);
}

/** How many people are actually at the table, rather than how many have ever joined it. */
export function hereCount(participants: ParticipantLike[], present: string[]): number {
  if (!present.length) return participants.length;
  return participants.filter((p) => present.includes(p.user_id)).length;
}
