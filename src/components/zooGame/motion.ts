/** Whether anything in the park may move.
 *
 *  One answer for the whole game: the visitors walking, the animals pacing in their pens, and the
 *  line in the Increment's caption that says so when the answer is no.
 *
 *  Its own module because the isometric view is loaded lazily - it is the heaviest thing in the
 *  game - and the caption that has to say "nothing is moving" is drawn by the pane around it, which
 *  loads first. Asking the same question in two places with two answers is how this project's worst
 *  faults have all started.
 *
 *  Somebody with motion turned down used to get a zoo that had quietly stopped, with nothing
 *  anywhere saying why. The first person to ask about it was sent to look in their system settings,
 *  which is the game failing to say what it already knows.
 */
export const motionWanted = (): boolean => !(typeof window !== 'undefined'
  && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
