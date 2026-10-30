import type { Seat, SeatName } from './useZooSessions';

/** The seats the lobby shows: the Product Owner, a row for each player, and one empty chair for the
 *  next to arrive - not nine cards waiting to be filled. Taken seats in seat order, so the table
 *  reads in the order people sat down. */
export function tableSeats(seats: Seat[], observing: boolean): Seat[] {
  const byKind = (k: SeatName) => seats.filter((x) => x.seat === k).sort((a, b) => a.seat_no - b.seat_no);
  const developers = byKind('developer');
  const nextChair = developers.find((x) => !x.participant_id);
  return [
    ...byKind('product_owner'),
    // A Scrum Master seat only survives in a game from before the hat, and only while somebody is in
    // it: there is nothing to sit down in.
    ...byKind('scrum_master').filter((x) => x.participant_id),
    ...developers.filter((x) => x.participant_id),
    ...(nextChair && !observing ? [nextChair] : []),
  ];
}
