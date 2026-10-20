// User Story Map, taught the way Al teaches it (Mike Cohn's three tiers; Scrum Master Exercises
// deck, slides 21 to 23; docs/ZOO_PO_ROUTE.md, The Story Map):
//
//   BACKBONE        the user's journey, left to right: "Plan the visit", "Arrive at park"
//   STORIES         a row under each backbone step: "Purchase tickets & passes"
//   SMALLER STORIES stacked under each story; down a column priority falls and detail rises
//
// Horizontal slices cut across the smaller stories only, never the two rows above: the narrative
// is not prioritised, and every step of the journey keeps something in the first slice (the
// walking skeleton). The slices are the roadmap - Now, Next, Later - and each carries its own
// Product Goal; it is written here, on the slice, and the Product Backlog shows it (Al, 20 Oct 2026).
// Sending to the backlog sends the Now slice. Technique KB slug: story-mapping.

export const STORY_MAP_STRETCH =
  'Does the Now slice still let a user get from one end of the journey to the other?';

// The coach config for a smaller story. Right-sizing is the point of the map, so the coach pushes
// toward the thinnest useful slice.
export const CARD_COACH = {
  tag: 'STORY',
  question: 'What does this card let the user do, in their words?',
  stretch: 'Could this be smaller and still be useful on its own?',
};

/** The Product Goal of a slice, in the hypothesis format the route teaches. */
export const PRODUCT_GOAL_PROMPT =
  'We believe [this slice] for [whom] will [outcome]. We will know when [measure].';

export interface SmallStory {
  id: string;
  title: string;
  /** The slice this sits in; null means not sliced yet. */
  sliceId: string | null;
}

/** The middle tier: a story under a backbone step, with its smaller stories in priority order. */
export interface MapStory {
  id: string;
  title: string;
  smaller: SmallStory[];
}

/** A backbone step of the journey. */
export interface BackboneStep {
  id: string;
  name: string;
  stories: MapStory[];
}

export interface Slice {
  id: string;
  name: string;
  productGoal: string;
}

export interface StoryMap {
  version: 2;
  /** The journey, left to right. */
  backbone: BackboneStep[];
  /** Top to bottom: Now first. */
  slices: Slice[];
}

const newId = () => crypto.randomUUID();

export const newSmallStory = (sliceId: string | null = null, title = ''): SmallStory => ({ id: newId(), title, sliceId });
export const newMapStory = (title = ''): MapStory => ({ id: newId(), title, smaller: [] });
export const newBackboneStep = (name = ''): BackboneStep => ({ id: newId(), name, stories: [newMapStory()] });
export const newSlice = (name = '', productGoal = ''): Slice => ({ id: newId(), name, productGoal });

export const SLICE_NAMES = ['Now', 'Next', 'Later'];

export const emptyStoryMap = (): StoryMap => ({
  version: 2,
  backbone: [newBackboneStep()],
  slices: SLICE_NAMES.map((n) => newSlice(n)),
});

/** The theme park from the deck's example (slide 23), sliced. */
export const exampleStoryMap = (): StoryMap => {
  const [now, next, later] = SLICE_NAMES.map((n) => newSlice(n));
  now.productGoal = 'We believe buying tickets online for families will fill the park on opening weekend. We will know when 500 tickets sell in advance.';
  const s = (title: string, ...smaller: Array<[string, Slice]>): MapStory => ({
    id: newId(), title, smaller: smaller.map(([t, sl]) => newSmallStory(sl.id, t)),
  });
  return {
    version: 2,
    slices: [now, next, later],
    backbone: [
      { id: newId(), name: 'Plan the visit', stories: [
        s('Research & discover the park', ['Read about park attractions', now], ['Read reviews & ratings', later]),
        s('Purchase tickets & passes', ['Select ticket or package', now], ['Check out securely', now], ['Receive digital ticket', now], ['Compare ticket & package prices', next]),
      ] },
      { id: newId(), name: 'Arrive at park', stories: [
        s('Park & Ride', ['Park car', now], ['Ride courtesy bus', later]),
        s('Verify ticket & enter', ['Enter secure gatehouse', now]),
      ] },
      { id: newId(), name: 'Experience attractions', stories: [
        s('Choose and ride attractions', ['Ride rollercoaster', now], ['Ride roundabout', next]),
        s('Attend shows & parades', ['Attend clown parade', next]),
      ] },
      { id: newId(), name: 'Dine & Shop', stories: [
        s('Find & reserve restaurants', ['Find somewhere to eat', now]),
        s('Visit gift shop', ['Buy a souvenir', later]),
      ] },
    ],
  };
};

const str = (v: unknown) => String(v ?? '');
const idOf = (v: unknown) => (typeof v === 'string' && v ? v : newId());
const rec = (v: unknown) => (v ?? {}) as Record<string, unknown>;
const atLeastOne = (stories: MapStory[]): MapStory[] => (stories.length > 0 ? stories : [newMapStory()]);

const parseSlices = (raw: unknown): Slice[] =>
  Array.isArray(raw) ? raw.map((r) => ({ id: idOf(rec(r).id), name: str(rec(r).name), productGoal: str(rec(r).productGoal) })) : [];

/** Reads a saved map, including the two-tier shape maps were saved in before (Patton's activities,
 *  cards and releases). An old activity becomes a backbone step with ONE story whose title is left
 *  empty, so the team sees the missing middle tier and names it; its cards become that story's
 *  smaller stories and keep their release as their slice; the old single Product Goal goes on the
 *  first slice. Nothing a team wrote is dropped (Al, 20 Oct 2026). */
export const parseStoryMap = (raw: unknown): StoryMap | null => {
  if (!raw || typeof raw !== 'object') return null;
  const o = rec(raw);

  if (Array.isArray(o.backbone)) {
    const slices = parseSlices(o.slices);
    const ids = new Set(slices.map((s) => s.id));
    const backbone: BackboneStep[] = o.backbone.map((b) => ({
      id: idOf(rec(b).id),
      name: str(rec(b).name),
      // Every step keeps at least one story, so each step owns a column on the map
      stories: atLeastOne((Array.isArray(rec(b).stories) ? (rec(b).stories as unknown[]) : []).map((st) => ({
        id: idOf(rec(st).id),
        title: str(rec(st).title),
        smaller: (Array.isArray(rec(st).smaller) ? (rec(st).smaller as unknown[]) : []).map((c) => {
          const sid = rec(c).sliceId;
          return { id: idOf(rec(c).id), title: str(rec(c).title), sliceId: typeof sid === 'string' && ids.has(sid) ? sid : null };
        }),
      }))),
    }));
    return {
      version: 2,
      slices: slices.length > 0 ? slices : SLICE_NAMES.map((n) => newSlice(n)),
      backbone: backbone.length > 0 ? backbone : [newBackboneStep()],
    };
  }

  // The old two-tier shape
  const releases = parseSlices(o.releases);
  const ids = new Set(releases.map((r) => r.id));
  const goal = str(o.productGoal);
  const slices = releases.length > 0 ? releases : SLICE_NAMES.map((n) => newSlice(n));
  if (goal && !slices[0].productGoal) slices[0] = { ...slices[0], productGoal: goal };
  const activities = Array.isArray(o.activities) ? o.activities : [];
  const backbone: BackboneStep[] = activities.map((a) => {
    const cards = Array.isArray(rec(a).cards) ? (rec(a).cards as unknown[]) : [];
    return {
      id: idOf(rec(a).id),
      name: str(rec(a).name),
      stories: [{
        id: newId(),
        title: '',
        smaller: cards.map((c) => {
          const rid = rec(c).releaseId;
          return { id: idOf(rec(c).id), title: str(rec(c).title), sliceId: typeof rid === 'string' && ids.has(rid) ? rid : null };
        }),
      }],
    };
  });
  return { version: 2, slices, backbone: backbone.length > 0 ? backbone : [newBackboneStep()] };
};

export const storyMapHasContent = (m: StoryMap): boolean =>
  m.slices.some((s) => s.productGoal.trim() !== '') ||
  m.backbone.some((b) => b.name.trim() !== '' ||
    b.stories.some((s) => s.title.trim() !== '' || s.smaller.some((c) => c.title.trim() !== '')));

/** What "Send to backlog" sends: the Now slice's titled smaller stories, kept with the backbone step
 *  and story they sit under, in priority order - the top of every column first, left to right (the
 *  walking skeleton), then the next row down. */
export const nowSlice = (m: StoryMap) => {
  const now = m.slices[0];
  const cells = m.backbone.flatMap((step) => step.stories.map((story) => ({
    step, story, items: story.smaller.filter((c) => now && c.sliceId === now.id && c.title.trim()),
  })));
  const depth = Math.max(0, ...cells.map((c) => c.items.length));
  const ordered: Array<{ step: BackboneStep; story: MapStory; item: SmallStory }> = [];
  for (let row = 0; row < depth; row++) {
    for (const c of cells) if (c.items[row]) ordered.push({ step: c.step, story: c.story, item: c.items[row] });
  }
  return { slice: now, ordered };
};
