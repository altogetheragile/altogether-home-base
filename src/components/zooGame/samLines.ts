import type { ZooGameState } from './types';

// What to do on this screen, said by the Scrum Master.
//
// Asked for with a mock-up (19 Nov 2026): "Can we add prompts to each screen ... These should give
// guidance on what to do ... it would be better if they were from the Scrum Master. They should
// explain what a user needs to do and have a don't show again checkbox."
//
// Sam rather than the game's own voice because that is the Scrum Master's job in the Guide - "coaching
// the team members in self-management" and "helping everyone understand Scrum theory and practice" -
// and because Priya speaking for the screen read as the Product Owner telling the Developers how to
// work. These are about the GAME: which buttons, in which order. What Scrum says lives in the
// teaching cards behind "What is this?", and these point at that rather than repeating it.
//
// Every line is editable copy (`copy.ts`, group "Sam's prompts"), like the rest of the teaching.

/** The screens Sam speaks on, in the order a solo game meets them. */
export type SamScreen =
  | 'before-start' | 'product-goal' | 'meet-team' | 'refine'
  | 'planning-why' | 'planning-what' | 'planning-how'
  | 'sprint' | 'building' | 'daily-scrum' | 'review' | 'retro';

export interface SamLine {
  /** Where it shows, for the copy editor. */
  where: string;
  /** The game phase it belongs to, so the in-game editor lists it on that screen. */
  phase: string;
  text: string;
}

export const SAM_SAYS: Record<SamScreen, SamLine> = {
  'before-start': {
    where: 'Before you start', phase: 'intro',
    text: "I'm Sam, your Scrum Master. This page shows how the zoo works and how Scrum fits on one page. Read as much as you like, then press Write your Product Goal. All of it is in Learn later.",
  },
  'product-goal': {
    where: 'Your Product Goal', phase: 'intro',
    text: "First, the Product Goal: the future state of the zoo the Scrum Team is working towards. Write it in your own words, or start from one of the shapes, then press Start. Priya, our Product Owner, turns it into a starter Product Backlog.",
  },
  'meet-team': {
    where: 'Meet the Scrum Team', phase: 'brief',
    text: "This is the Scrum Team. Playing alone, you hold every seat except Priya's: you are me, the Scrum Master, and all three Developers. The game plays Priya, the Product Owner. Rename your Developer if you like, then press Next.",
  },
  refine: {
    where: 'Refinement, before the first Sprint', phase: 'refine',
    text: "Priya has written a starter Product Backlog, one epic for each area. We need enough at the top split and sized to start a Sprint. Press Split it up on the top epic, size what comes out, and read and agree the Definition of Done. Then go to Sprint Planning.",
  },
  'planning-why': {
    where: 'Sprint Planning, topic one', phase: 'planning',
    text: "Sprint Planning has three topics, and the first is why. Priya has suggested a Sprint Goal. Read it, change it if it does not say why this Sprint is worth doing, and agree it as a team. Then press Next: what to build.",
  },
  'planning-what': {
    where: 'Sprint Planning, topic two', phase: 'planning',
    text: "Topic two: what can be Done this Sprint. Add the sized items that serve the Sprint Goal from the Product Backlog. Watch the forecast against what the team has managed before, then press Next: how.",
  },
  'planning-how': {
    where: 'Sprint Planning, topic three', phase: 'planning',
    text: "Topic three: how. Give each item a plan of steps. Steps the park can see, like the size or the fence, tick themselves as you build. Any you write in your own words, you tick on the item's card when they are done. Then start the Sprint.",
  },
  sprint: {
    where: 'The Sprint board', phase: 'sprint',
    text: "The Sprint has started and the day's clock is running. Pull an item into Doing and build it on the park. When everything is met, ask Priya to check it, and move it to Done once every step of its plan is ticked. End the day when you are ready.",
  },
  building: {
    where: 'Building an item on the park', phase: 'sprint',
    text: "You are building on the park. The buttons along the top are the parts of the item: size, shape, perimeter, interior, paths. Each acceptance criterion says which one it is waiting on, and the park ticks it when it sees it.",
  },
  'daily-scrum': {
    where: 'The Daily Scrum', phase: 'sprint',
    text: "The Daily Scrum: the Developers check progress toward the Sprint Goal and change today's plan. Say where you are, then decide what to do about anything in the way. If it is beyond the Developers, removing it is my job, so you can ask me.",
  },
  review: {
    where: 'The Sprint Review', phase: 'review',
    text: "The Sprint Review is a working session with the stakeholders, not a sign-off. Go through the three tabs: what is Done, what the visitors made of it, and what we do next. Then on to the Retrospective.",
  },
  retro: {
    where: 'The Retrospective', phase: 'retro',
    text: "The Retrospective is how we improve the way we work. First inspect: read back what happened this Sprint. Then adapt: pick one improvement to carry into the next Sprint, and check the Definition of Done still fits. Then start the next Sprint.",
  },
};

/** Which screen is in front of the player, for Sam. `beforeStart` and `building` are the page's,
 *  not the game's, so they are passed in. Null where Sam has nothing to say. */
export function samScreen(state: ZooGameState, ui: { beforeStart: boolean; building: string | null; metTeam: boolean }): SamScreen | null {
  switch (state.phase) {
    case 'intro': return ui.beforeStart ? 'before-start' : 'product-goal';
    case 'brief': return ui.metTeam ? null : 'meet-team';
    case 'refine': return 'refine';
    case 'planning': return state.planningTopic === 'what' ? 'planning-what' : state.planningTopic === 'how' ? 'planning-how' : 'planning-why';
    case 'sprint':
      if (state.dayStage === 'dailyScrum') return 'daily-scrum';
      return ui.building ? 'building' : 'sprint';
    case 'review': return 'review';
    case 'retro': return 'retro';
    default: return null;
  }
}

// ---- "Don't show this again", remembered by this browser ----
//
// Per browser, like the teaching already read (`whatYouHaveRead.ts`), and for the same reasons: most
// people play without signing in, and storage can refuse. A browser that cannot remember shows the
// prompt again, which is the safe way round.

const KEY = 'aa.zoo.samQuiet';

export function readQuiet(): SamScreen[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const list = JSON.parse(localStorage.getItem(KEY) ?? '[]') as unknown;
    return Array.isArray(list) ? list.filter((k): k is SamScreen => typeof k === 'string' && k in SAM_SAYS) : [];
  } catch {
    return [];
  }
}

export function writeQuiet(list: SamScreen[]): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // Not remembered: Sam says it again next time.
  }
}

/** Bring every prompt back, with the teaching, when a trainer asks for it from the start. */
export function forgetQuiet(): void {
  try {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(KEY);
  } catch {
    // Nothing stored, or nothing we may touch.
  }
}
