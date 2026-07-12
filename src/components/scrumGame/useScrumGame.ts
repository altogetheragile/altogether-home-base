import { useReducer, useCallback } from 'react';
import type { ScrumState, ScrumAction } from './types';
import { initialScrumState } from './config';
import { planSprint, startStory, runSprintDay, completeSprint } from './engine';

// The Sprint loop is built out slice by slice. Planning is live; daily execution,
// Review and Retro follow.
function reducer(state: ScrumState, action: ScrumAction): ScrumState {
  switch (action.type) {
    case 'START':
      return { ...state, phase: 'planning' };
    case 'SET_PHASE':
      return { ...state, phase: action.phase };
    case 'PLAN_SPRINT':
      return planSprint(state, action.goal, action.storyIds);
    case 'START_STORY':
      return startStory(state, action.storyId);
    case 'RUN_SPRINT_DAY':
      return runSprintDay(state);
    case 'COMPLETE_SPRINT':
      return completeSprint(state);
    case 'RESET':
      return initialScrumState();
    default:
      return state;
  }
}

export function useScrumGame() {
  const [state, dispatch] = useReducer(reducer, undefined, initialScrumState);

  const start = useCallback(() => dispatch({ type: 'START' }), []);
  const setPhase = useCallback((phase: ScrumState['phase']) => dispatch({ type: 'SET_PHASE', phase }), []);
  const planSprintAction = useCallback(
    (goal: string, storyIds: string[]) => dispatch({ type: 'PLAN_SPRINT', goal, storyIds }),
    [],
  );
  const startStoryAction = useCallback((storyId: string) => dispatch({ type: 'START_STORY', storyId }), []);
  const runDay = useCallback(() => dispatch({ type: 'RUN_SPRINT_DAY' }), []);
  const completeSprintAction = useCallback(() => dispatch({ type: 'COMPLETE_SPRINT' }), []);
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  return {
    state,
    start,
    setPhase,
    planSprint: planSprintAction,
    startStory: startStoryAction,
    runDay,
    completeSprint: completeSprintAction,
    reset,
  };
}
