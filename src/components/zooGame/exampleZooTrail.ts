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
  {"type":"SET_GOAL_FORM","shape":"outcome","goal":"Open a zoo that visitors love and come back to.","measures":[]},
  {"type":"SET_PRODUCT_GOAL","goal":"Open a zoo big cats zone that visitors love and come back to."},
  {"type":"START"},
  {"type":"START_ITEM","id":"lion-enc"},
  {"type":"SET_POS","id":"lion-enc","pos":{"x":227.5501754183579,"y":861.7363840093137}},
  {"type":"CHOOSE_STRUCTURE","id":"lion-enc","key":"paddock"},
  {"type":"SET_ENCLOSURE","id":"lion-enc","size":"large"},
  {"type":"SET_DRAFT_DESIGN","id":"lion-enc","design":{"parts":{"structure":"paddock","ground":"land","barrier":"high"},"colors":{"ground":"#43a047"}}},
  {"type":"ADD_INSIDE","id":"lion-enc","kind":"water"},
  {"type":"MOVE_INSIDE","id":"lion-enc","kind":"water","index":0,"spot":{"x":0.7081064594051555,"y":0.6545414676832284}},
  {"type":"ADD_INSIDE","id":"lion-enc","kind":"rocks"},
  {"type":"ADD_INSIDE","id":"lion-enc","kind":"rocks"},
  {"type":"ADD_INSIDE","id":"lion-enc","kind":"rocks"},
  {"type":"ADD_INSIDE","id":"lion-enc","kind":"rocks"},
  {"type":"ADD_INSIDE","id":"lion-enc","kind":"tree"},
  {"type":"ADD_INSIDE","id":"lion-enc","kind":"tree"},
  {"type":"MOVE_INSIDE","id":"lion-enc","kind":"flora","index":2,"spot":{"x":0.5377383989805038,"y":0.7825573384434132}},
  {"type":"SET_POS","id":"lion-enc","pos":{"x":227.5501754183579,"y":873.8964634863495}},
  {"type":"MOVE_INSIDE","id":"lion-enc","kind":"flora","index":3,"spot":{"x":0.7931783889782195,"y":0.5938034620612508}},
  {"type":"MOVE_INSIDE","id":"lion-enc","kind":"flora","index":5,"spot":{"x":0.7996553148022301,"y":0.1355998565305973}},
  {"type":"MOVE_INSIDE","id":"lion-enc","kind":"flora","index":4,"spot":{"x":0.16180267740301915,"y":0.8367178991496449}},
  {"type":"SET_DRAFT_DESIGN","id":"lion-enc","design":{"parts":{"structure":"paddock","ground":"land","barrier":"high","thickness":"thick"},"colors":{"ground":"#43a047","path":"#c9a86a"},"water":[{"x":0.5481064594051555,"y":0.5145414676832284,"w":0.32,"h":0.28}],"flora":[{"x":0.12,"y":0.3,"s":1,"type":"rocks","foliage":"#9aa1a8","trunk":"#6f757b"},{"x":0.348,"y":0.3,"s":1,"type":"rocks","foliage":"#9aa1a8","trunk":"#6f757b"},{"x":0.5377383989805038,"y":0.7825573384434132,"s":1,"type":"rocks","foliage":"#9aa1a8","trunk":"#6f757b"},{"x":0.7931783889782195,"y":0.5938034620612508,"s":1,"type":"rocks","foliage":"#9aa1a8","trunk":"#6f757b"},{"x":0.16180267740301915,"y":0.8367178991496449,"s":1,"type":"tree","foliage":"#43a047","trunk":"#7a5230"},{"x":0.7996553148022301,"y":0.1355998565305973,"s":1,"type":"tree","foliage":"#43a047","trunk":"#7a5230"}]}},
  {"type":"ADD_CONNECTOR","connector":{"id":"run-237-233-1022","itemId":"lion-enc","a":{"x":236.80054973405845,"y":948.3854856925462},"b":{"x":233.41132391787266,"y":1021.9286865888965},"bends":[],"thickness":9,"color":"#c9a86a"}},
  {"type":"UPDATE_CONNECTOR","id":"run-237-233-1022","patch":{"bends":[{"x":233.41132391787266,"y":1021.9286865888965}],"b":{"x":888.5688124436505,"y":1018.4923182612864}}},
  {"type":"ADD_CONNECTOR","connector":{"id":"run-331-442-873","itemId":"lion-enc","a":{"x":331.4246495123736,"y":870.6560877481907},"b":{"x":442.3350290976701,"y":873.1755122487182},"bends":[],"thickness":14,"color":"#c9a86a"}},
  {"type":"ADD_CONNECTOR","connector":{"id":"run-441-442-522","itemId":"lion-enc","a":{"x":441.2252825914853,"y":1023.1369715921908},"b":{"x":442.2407649156776,"y":522.4741926166173},"bends":[],"thickness":14,"color":"#c9a86a"}},
  {"type":"ASK_TO_CHECK","id":"lion-enc"},
  {"type":"ANSWER_QUESTION","id":"check-lion-enc","choice":"accept"},
  {"type":"FINISH_ITEM","id":"lion-enc"},
  {"type":"START_ITEM","id":"lion"},
  {"type":"CHOOSE_STRUCTURE","id":"lion","key":"lion"},
  {"type":"SET_DRAFT_DESIGN","id":"lion","design":{"parts":{"body":"round","head":"maned","ears":"round","tail":"tufted","markings":"none","structure":"lion","type":"lion"},"colors":{"body":"#c9963f","head":"#a9702c","ears":"#7a4d1c","tail":"#7a4d1c","coat":"#f0efe9"},"group":{"males":1,"females":2,"juveniles":1,"cubs":2}}},
  {"type":"PLAN_ITEM_SHAPE","id":"lion","patch":{"enclosureId":"lion-enc"}},
  {"type":"PLACE_ON_PARK","id":"lion"},
  {"type":"ASK_TO_CHECK","id":"lion"},
  {"type":"ANSWER_QUESTION","id":"check-lion","choice":"accept"},
  {"type":"FINISH_ITEM","id":"lion"},
  {"type":"PULL_ITEM","id":"bridge"},
  {"type":"MOVE_SPRINT_ITEM","id":"bridge","dir":"up"},
  {"type":"START_ITEM","id":"paths"},
  {"type":"START_ITEM","id":"bridge"},
  {"type":"SET_POS","id":"bridge","pos":{"x":468.1876752073182,"y":494}},
  {"type":"SET_ROT","id":"bridge","rot":90},
  {"type":"SET_POS","id":"bridge","pos":{"x":441.1249604187161,"y":498}},
  {"type":"SET_ITEM_SIZE","id":"bridge","size":{"w":169.06210446260502,"h":177.32244708457165}},
  {"type":"SET_POS","id":"bridge","pos":{"x":443.4458588389866,"y":496}},
  {"type":"SET_ITEM_SIZE","id":"bridge","size":{"w":117.60397605496541,"h":141.83253366504368}},
  {"type":"SET_ROT","id":"bridge","rot":180},
  {"type":"SET_DRAFT_DESIGN","id":"bridge","design":{"parts":{"type":"bridge"},"colors":{"foliage":"#c8965a","trunk":"#8a6134"}}},
  {"type":"ANSWER_IMPEDIMENT","how":"around"},
  {"type":"RUN_DAILY_SCRUM"},
  {"type":"ASK_TO_CHECK","id":"bridge"},
  {"type":"ANSWER_QUESTION","id":"check-bridge","choice":"accept"},
  {"type":"FINISH_ITEM","id":"bridge"},
] as unknown as Trail["actions"] };
