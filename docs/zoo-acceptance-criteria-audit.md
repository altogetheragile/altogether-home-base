# Zoo game: acceptance-criteria consistency audit

Goal: every item has appropriate acceptance criteria (ACs), split correctly across
**build** (appearance/quality, confirmed in the studio) and **deploy**
(placement/sizing, confirmed on the park when placed). `isDeployAcceptance(label)`
classifies an AC as deploy-time by phrasing (`sized` / `fit the space` / `placed` /
`position`).

## Findings (before)

Only sizable landscape scenery had a deploy AC. Everything else was placed on the
park with **no** placement AC, and the pathway's routing ACs were mis-classified.

| Category / type | ACs (before) | Build | Deploy | Problem |
|---|---|---|---|---|
| enclosure | Fenced; Big enough; Ground/shelter/water | 3 | 0 | no placement AC |
| exhibit (animal) | Recognisable; ≥2 colours; No bare patches | 3 | 0 | no placement AC |
| amenity (building) | Clearly signed; Serves… | 2 | 0 | no placement AC |
| flora tree/bush/flowers | Fits the planting; Coloured | 2 | 0 | no placement AC |
| flora signpost | Clearly readable; Coloured | 2 | 0 | no placement AC |
| flora entrance | Clearly marks the way in; Coloured | 2 | 0 | no placement AC |
| flora river/pond/fountain/rocks/hedge/carpark | …; Sized to fit the space | 1 | 1 | correct |
| **path** | Connects features into the network; Clearly routed | 2 (mis-tag) | 0 | routing is a **deploy** action, but neither AC is recognised as deploy — so you'd tick "routed" in the studio before drawing the route (the same bug the river originally had) |

Secondary issue: enclosure/exhibit AC lists were duplicated inline in three places
(config, splitEpic, toolbox), so they could drift.

## Changes

Centralised AC generation in `design.ts` and gave **every** category a build +
placement split. Deploy ACs are phrased as `Placed …` or `Sized to fit the space`
so `isDeployAcceptance` catches them; no build AC matches (no false positives).

| Category / type | Build ACs (studio) | Deploy AC (park) |
|---|---|---|
| enclosure | Securely fenced; Big enough; Ground/shelter/water | **Placed in its zone with room around it** |
| exhibit | Recognisable as …; ≥2 colours; No bare patches | **Placed in its enclosure** |
| amenity | Clearly signed; Serves…/Cubicles/Souvenirs/Seating | **Placed where visitors can reach it** |
| path | The right width and colour | **Placed to link the right features** |
| tree/bush/flowers | Fits the planting; Coloured, no bare patches | **Placed where it looks right** |
| signpost | Clearly readable; Coloured | **Placed where visitors will see it** |
| entrance | Clearly marks the way in; Coloured | **Placed at the way in** |
| river/pond/fountain | Reads as water | Sized to fit the space |
| rocks | Reads as rock | Sized to fit the space |
| hedge | Reads as a hedge | Sized to fit the space |
| carpark | Clearly marked out | Sized to fit the space |

New/updated helpers: `enclosureAcceptance()`, `exhibitAcceptance(name)`,
`pathAcceptance()`, `amenityAcceptance()` (+ placement), `floraAcceptance()`
(+ placement for signpost/entrance/planting). Used in `config.ts`, `engine.ts`
(splitEpic, visitor-signal amenities) and `toolboxItems.ts`.

## Guardrail

A test iterates every toolbox item and asserts it has ≥1 build AC and exactly one
deploy AC, so the split stays consistent as items are added.
