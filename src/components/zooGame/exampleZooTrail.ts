import type { Trail } from './trail';

// The zoo on the orientation screen, as somebody actually built it.
//
// Asked after the labelled example went in: "can the orientation zoo images be based upon actual
// zoo footage? We record steps so can the example view be based upon how a player actually places
// and builds features?"
//
// They can, and this is where the footage goes. The game already keeps its own account of what was
// pressed - the seed it started from and the actions in order - and replays it, because the reducer
// is pure. A trail dropped in here is replayed on the orientation screen, so the example is not a
// zoo somebody described: it is the zoo somebody built, with their placements, their sizes, their
// colours and the route they actually walked the path along.
//
// ## Recording one
//
// 1. Open the game with `?record=1` on the URL. That tells the trail to keep the WHOLE game rather
//    than the last eighty actions, which is a window on the end of a build and replays to a zoo
//    with no beginning.
// 2. Play the zoo you want people to see. Take your time over it - every press is kept, and the
//    slow careful build is exactly what makes a better example than a fast one.
// 3. Press the footprints button in the game menu (admin only). It puts the trail on the clipboard.
// 4. Paste it as `RECORDED` below.
//
// ## What happens if this is empty
//
// The screen builds its own zoo by driving the engine, which is what it did before there was a way
// to record one. That fallback is the reason this file can sit empty without breaking a screen, and
// the reason a bad recording is not a crash: the invariants are checked either way.

/** The recording. `null` until somebody records one, and the screen falls back to building its own.
 *
 *  A trail is `{ seed, actions }` and nothing else - no timestamps, no snapshots, nothing about who
 *  was signed in - so it is small enough to read in a diff and it replays the same way every time. */
export const RECORDED: Trail | null = null;
