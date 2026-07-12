import type { ScrumState, Sprint, Story } from './types';

/** Commit the planned stories into a new Sprint and open it for play. The chosen
 *  stories move from the Product Backlog onto the Sprint board (status 'todo',
 *  tagged with the Sprint number); the Sprint Goal is set. Pure and deterministic. */
export function planSprint(state: ScrumState, goal: string, storyIds: string[]): ScrumState {
  const number = (state.currentSprint?.number ?? state.sprints.length) + 1;
  const committed = new Set(storyIds);
  const sprint: Sprint = {
    number,
    goal: goal.trim(),
    length: state.sprintLength,
    day: 1,
    committedStoryIds: storyIds,
    status: 'active',
  };
  const productBacklog: Story[] = state.productBacklog.map((s) =>
    committed.has(s.id) ? { ...s, status: 'todo', sprintNumber: number } : s,
  );
  return { ...state, phase: 'sprint', currentSprint: sprint, productBacklog };
}

/** The stories committed to a given Sprint (the Sprint Backlog). */
export const sprintStories = (state: ScrumState, sprintNumber: number): Story[] =>
  state.productBacklog.filter((s) => s.sprintNumber === sprintNumber);

/** The stories still available to plan (not yet pulled into any Sprint). */
export const availableStories = (state: ScrumState): Story[] =>
  state.productBacklog.filter((s) => s.status === 'backlog');
