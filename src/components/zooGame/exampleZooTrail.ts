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
export const RECORDED: Trail | null = { seed: 1, actions: [
  {"type":"SET_GOAL_FORM","shape":"outcome","goal":"Open a zoo the whole family remembers so that visitors love it and come back.","measures":[]},
  {"type":"SET_PRODUCT_GOAL","goal":"Open a zoo the whole family remembers so that visitors love it and come back."},
  {"type":"START"},
  {"type":"START_ITEM","id":"lion-enc"},
  {"type":"CHOOSE_STRUCTURE","id":"lion-enc","key":"paddock"},
  {"type":"SET_ENCLOSURE","id":"lion-enc","size":"large"},
  {"type":"SET_DRAFT_DESIGN","id":"lion-enc","design":{"parts":{"structure":"paddock","ground":"land","barrier":"high"},"colors":{"ground":"#e0a642"}}},
  {"type":"ADD_INSIDE","id":"lion-enc","kind":"water"},
  {"type":"ADD_INSIDE","id":"lion-enc","kind":"rocks"},
  {"type":"ADD_INSIDE","id":"lion-enc","kind":"rocks"},
  {"type":"ADD_INSIDE","id":"lion-enc","kind":"tree"},
  {"type":"ADD_INSIDE","id":"lion-enc","kind":"tree"},
  {"type":"SET_CLOCK_PAUSED","paused":true},
  {"type":"SET_DRAFT_DESIGN","id":"lion-enc","design":{"parts":{"structure":"paddock","ground":"land","barrier":"high","thickness":"medium"},"colors":{"ground":"#e0a642","path":"#c9a86a"},"water":[{"x":0.02,"y":0.15999999999999998,"w":0.32,"h":0.28}],"flora":[{"x":0.424,"y":0.3,"s":1,"type":"rocks","foliage":"#9aa1a8","trunk":"#6f757b"},{"x":0.652,"y":0.3,"s":1,"type":"rocks","foliage":"#9aa1a8","trunk":"#6f757b"},{"x":0.842,"y":0.42,"s":1,"type":"tree","foliage":"#43a047","trunk":"#7a5230"},{"x":0.12,"y":0.5,"s":1,"type":"tree","foliage":"#43a047","trunk":"#7a5230"}]}},
  {"type":"ADD_CONNECTOR","connector":{"id":"run-878-447-947","itemId":"lion-enc","a":{"x":877.5503843255464,"y":1004.3335644310475},"b":{"x":446.616850037679,"y":947.4178146194424},"bends":[],"thickness":9,"color":"#c9a86a"}},
  {"type":"UPDATE_CONNECTOR","id":"run-878-447-947","patch":{"bends":[{"x":446.616850037679,"y":947.4178146194424}],"b":{"featureId":"lion-enc","x":202.69220798794277,"y":670.9698869630746}}},
  {"type":"ASK_TO_CHECK","id":"lion-enc"},
  {"type":"ANSWER_QUESTION","id":"check-lion-enc","choice":"accept"},
  {"type":"FINISH_ITEM","id":"lion-enc"},
  {"type":"OPEN_ITEM","id":"lion-enc"},
  {"type":"START_ITEM","id":"lion"},
  {"type":"CHOOSE_STRUCTURE","id":"lion","key":"lion"},
  {"type":"SET_DRAFT_DESIGN","id":"lion","design":{"parts":{"body":"round","head":"maned","ears":"round","tail":"tufted","markings":"none","structure":"lion","type":"lion"},"colors":{"body":"#c9963f","head":"#a9702c","ears":"#7a4d1c","tail":"#7a4d1c","coat":"#c9963f"},"group":{"males":1,"females":2,"juveniles":1,"cubs":2}}},
  {"type":"PLAN_ITEM_SHAPE","id":"lion","patch":{"enclosureId":"lion-enc"}},
  {"type":"PLACE_ON_PARK","id":"lion"},
  {"type":"ASK_TO_CHECK","id":"lion"},
  {"type":"ANSWER_QUESTION","id":"check-lion","choice":"accept"},
  {"type":"FINISH_ITEM","id":"lion"},
  {"type":"OPEN_ITEM","id":"lion"},
  {"type":"START_ITEM","id":"paths"},
  {"type":"SET_DRAFT_DESIGN","id":"paths","design":{"parts":{"thickness":"thick"},"colors":{"path":"#b9b3ab"}}},
  {"type":"ADD_CONNECTOR","connector":{"id":"run-880-476-898","itemId":"paths","a":{"x":880.3686832740215,"y":953.0150604982207},"b":{"x":476.43063345195736,"y":897.7231601423488},"bends":[],"thickness":14,"color":"#c9a86a"}},
  {"type":"UPDATE_CONNECTOR","id":"run-880-476-898","patch":{"bends":[{"x":476.43063345195736,"y":897.7231601423488}],"b":{"x":273.69366548042706,"y":805.5699928825622}}},
  {"type":"ASK_TO_CHECK","id":"paths"},
  {"type":"ANSWER_QUESTION","id":"check-paths","choice":"accept"},
  {"type":"FINISH_ITEM","id":"paths"},
  {"type":"OPEN_ITEM","id":"paths"},
  {"type":"START_ITEM","id":"main-wc"},
  {"type":"CHOOSE_STRUCTURE","id":"main-wc","key":"toilets"},
  {"type":"SET_SERVICES","id":"main-wc","services":"toilet"},
  {"type":"SET_DRAFT_DESIGN","id":"main-wc","design":{"parts":{"sign":"on","structure":"toilets","type":"toilets"},"colors":{"walls":"#e6ddcf","roof":"#a4623a","sign":"#3f6f4f"}}},
  {"type":"ASK_TO_CHECK","id":"main-wc"},
  {"type":"ANSWER_QUESTION","id":"check-main-wc","choice":"accept"},
  {"type":"FINISH_ITEM","id":"main-wc"},
  {"type":"OPEN_ITEM","id":"main-wc"},
] as unknown as Trail["actions"] };
