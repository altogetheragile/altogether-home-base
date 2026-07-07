// User Story Map (see VISION_TO_VALUE.md Appendix C, C.4). A true Jeff Patton
// story map and the authoring surface that feeds a right-sized backlog: a
// backbone of activities (the user's flow, left to right), story cards stacked
// beneath each activity, and horizontal release slices (the first slice is the
// walking skeleton). Distinct from the single-story User Story Canvas, and from
// the read-only Story Map VIEW over the backlog (6.13): this authors the map,
// then pushes cards to the backlog one way, with provenance.
// Technique: user story mapping (Jeff Patton). KB slug: story-mapping.
// Standing stretch: "What is the smallest slice that still tells the whole story?"

export const STORY_MAP_STRETCH =
  'What is the smallest slice that still tells the whole story end to end?';

// The coach config for a story card. Right-sizing is the point of the map, so
// the card coach pushes toward the thinnest useful slice.
export const CARD_COACH = {
  tag: 'STORY',
  question: 'What does this card let the user do, in their words?',
  stretch: 'Could this be smaller and still be useful on its own?',
};

export interface StoryCard {
  id: string;
  title: string;
  /** The release slice this card sits in; null means Unscheduled. */
  releaseId: string | null;
}

export interface Activity {
  id: string;
  name: string;
  cards: StoryCard[];
}

export interface Release {
  id: string;
  name: string;
}

export interface StoryMap {
  /** The product goal / vision anchoring the whole map. */
  productGoal: string;
  /** Backbone: activities in narrative order, left to right. */
  activities: Activity[];
  /** Horizontal slices, top to bottom; the first is the walking skeleton. */
  releases: Release[];
}

const newId = () => crypto.randomUUID();

export const newCard = (releaseId: string | null = null, title = ''): StoryCard => ({
  id: newId(),
  title,
  releaseId,
});

export const newActivity = (name = ''): Activity => ({
  id: newId(),
  name,
  cards: [],
});

export const newRelease = (name = ''): Release => ({
  id: newId(),
  name,
});

export const emptyStoryMap = (): StoryMap => ({
  productGoal: '',
  activities: [newActivity()],
  releases: [newRelease('Release 1')],
});

export const exampleStoryMap = (): StoryMap => {
  const r1: Release = { id: newId(), name: 'Release 1 (walking skeleton)' };
  const r2: Release = { id: newId(), name: 'Release 2' };
  const mk = (title: string, releaseId: string | null): StoryCard => ({ id: newId(), title, releaseId });
  return {
    productGoal: 'Help busy people plan and run their day without dropping things.',
    releases: [r1, r2],
    activities: [
      {
        id: newId(),
        name: 'Capture tasks',
        cards: [
          mk('Add a task in one line', r1.id),
          mk('Capture from my phone', r1.id),
          mk('Add a task by email', r2.id),
        ],
      },
      {
        id: newId(),
        name: 'Organise and prioritise',
        cards: [
          mk('Mark what matters most today', r1.id),
          mk('Group tasks into a project', r2.id),
          mk('Set a due date', r2.id),
        ],
      },
      {
        id: newId(),
        name: 'Do the work',
        cards: [
          mk('See just today’s list', r1.id),
          mk('Tick a task off', r1.id),
          mk('Reschedule what I did not finish', r2.id),
        ],
      },
      {
        id: newId(),
        name: 'Review the day',
        cards: [
          mk('See what I completed', r1.id),
          mk('Carry the rest into tomorrow', r2.id),
        ],
      },
    ],
  };
};

export const parseStoryMap = (raw: unknown): StoryMap | null => {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;

  const releases: Release[] = Array.isArray(o.releases)
    ? o.releases.map((r) => {
        const x = (r ?? {}) as Record<string, unknown>;
        return { id: typeof x.id === 'string' ? x.id : newId(), name: String(x.name ?? '') };
      })
    : [];
  const releaseIds = new Set(releases.map((r) => r.id));

  const activities: Activity[] = Array.isArray(o.activities)
    ? o.activities.map((a) => {
        const x = (a ?? {}) as Record<string, unknown>;
        const cards: StoryCard[] = Array.isArray(x.cards)
          ? x.cards.map((c) => {
              const y = (c ?? {}) as Record<string, unknown>;
              // Drop a card's release ref if that release no longer exists.
              const rid = typeof y.releaseId === 'string' && releaseIds.has(y.releaseId) ? y.releaseId : null;
              return { id: typeof y.id === 'string' ? y.id : newId(), title: String(y.title ?? ''), releaseId: rid };
            })
          : [];
        return { id: typeof x.id === 'string' ? x.id : newId(), name: String(x.name ?? ''), cards };
      })
    : [];

  return {
    productGoal: String(o.productGoal ?? ''),
    releases: releases.length > 0 ? releases : [newRelease('Release 1')],
    activities: activities.length > 0 ? activities : [newActivity()],
  };
};

export const storyMapHasContent = (m: StoryMap): boolean =>
  m.productGoal.trim() !== '' ||
  m.activities.some((a) => a.name.trim() !== '' || a.cards.some((c) => c.title.trim() !== ''));
