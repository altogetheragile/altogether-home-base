import type { ComponentProps } from 'react';
import { Check } from 'lucide-react';
import type { BacklogItem } from './types';
import { ICONS, iconKey } from './itemIcons';
import { Chip } from './ui/Chip';
import { itemKind, KIND_LABEL } from './itemKinds';
import { PbiCardShell, type PbiState } from '@/components/pbi/PbiCardShell';

// ============= One card for one Product Backlog item =============
//
// A Product Backlog item used to be drawn by six different pieces of code - two card components,
// the Product Backlog sidebar row, and three hand-rolled rows on Planning and the Review - each with its
// own padding, icon size and badges. It is the most repeated object in the game, so its
// inconsistency was the game's inconsistency, multiplied.
//
// It is also the thing the game is teaching. An item travelling from the Product Backlog into a
// forecast, into Doing, to Done and out to visitors IS the Scrum loop. When it changes appearance
// at every step, the learner is quietly told these are different things. One card that visibly
// picks up state says the opposite, and says it without a word of explanation.

export type { PbiState };

// The layout lives in the shared shell; the zoo supplies what is the zoo's: the icon for what the
// item becomes in the park, its estimate, and "Live" for an item released to visitors.
export function PbiCard({ item, state = 'backlog', badges, ...rest }: {
  item: BacklogItem;
} & Omit<ComponentProps<typeof PbiCardShell>, 'icon' | 'name' | 'points'>) {
  return (
    <PbiCardShell icon={ICONS[iconKey(item)]} name={item.name} points={item.unsized ? null : item.estimate}
      state={state} {...rest}
      badges={<>{badges}{state === 'live' && <Chip tone="done" icon={<Check className="h-2.5 w-2.5" />}>Live</Chip>}</>} />
  );
}

/** The item's kind, as a chip - used where a list mixes habitats, animals and facilities. */
export function CategoryChip({ item }: { item: BacklogItem }) {
  // What KIND of thing it is, not what class renders it. `flora` was one word covering planting,
  // water, rock, bridges, signposts and the car park, so a bridge went about labelled "Planting".
  return <Chip tone={item.category === 'epic' ? 'teach' : 'quiet'}>{KIND_LABEL[itemKind(item)]}</Chip>;
}
