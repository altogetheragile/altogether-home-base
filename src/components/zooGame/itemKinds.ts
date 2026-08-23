import type { BacklogItem, PbiDraft } from './types';

// ============= What kind of thing this is =============
//
// The Product Backlog item's `category` says how a thing BEHAVES: what renders it, what can be
// dragged into it, what it blocks on. That is an engine concern and it stays as it is.
//
// This is the taxonomy the PLAYER sees, and it is not the same list. `flora` had quietly become a
// bin for everything that was not an animal, a habitat, a building or a path - so the river, the
// bridge, the signposts and the car park were all filed as planting. A bridge is not planting. It
// is the thing that lets a path cross water, which the visitors' pathfinding already knows.
//
// Six kinds, each with something true about it that none of the others has:
//
//   Habitat         a footprint you size, that contains other things
//   Fauna           blocked on its habitat; what visitors come for
//   Flora           plantable inside a habitat, and put down many times over
//   Landscape       a footprint you resize and rotate; changes where visitors can walk
//   Facility        serves a visitor need - food, rest, a lavatory
//   Infrastructure  how visitors get about and find their way
//
// "Utilities" is not a seventh: a bridge and a signpost ARE the utilities of a park, and they
// belong beside the paths they serve.

export type ItemKind = 'epic' | 'habitat' | 'fauna' | 'flora' | 'landscape' | 'facility' | 'infrastructure';

/** Scenery types by the kind they really are. Everything not named here is planting. */
const LANDSCAPE_SCENERY = ['river', 'pond', 'rocks', 'fountain'];
const INFRASTRUCTURE_SCENERY = ['bridge', 'signpost', 'entrance', 'carpark'];

/** What the player calls it. */
export const KIND_LABEL: Record<ItemKind, string> = {
  epic: 'Epic',
  habitat: 'Habitat',
  fauna: 'Animal',
  flora: 'Planting',
  landscape: 'Landscape',
  facility: 'Facility',
  infrastructure: 'Infrastructure',
};

/** The scenery type an item is - its chosen type, or the template it came from. */
export function sceneryType(item: Pick<BacklogItem, 'template' | 'design'> & { draftDesign?: BacklogItem['draftDesign'] }): string | undefined {
  return item.design?.parts.type ?? item.draftDesign?.parts.type ?? item.template;
}

export function itemKind(item: Pick<BacklogItem, 'category' | 'template' | 'design'> & { draftDesign?: BacklogItem['draftDesign'] }): ItemKind {
  switch (item.category) {
    case 'epic': return 'epic';
    case 'enclosure': return 'habitat';
    case 'exhibit': return 'fauna';
    case 'amenity': return 'facility';
    case 'path': return 'infrastructure';
    default: {
      const t = sceneryType(item);
      if (t && LANDSCAPE_SCENERY.includes(t)) return 'landscape';
      if (t && INFRASTRUCTURE_SCENERY.includes(t)) return 'infrastructure';
      return 'flora';
    }
  }
}

/** The same question for something that is not a Backlog item yet - a draft in the editor. */
export function draftKind(draft: Pick<PbiDraft, 'category' | 'template'>): ItemKind {
  return itemKind({ category: draft.category, template: draft.template });
}
