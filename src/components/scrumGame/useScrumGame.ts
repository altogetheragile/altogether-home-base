import { useReducer, useCallback } from 'react';
import type { ScrumState, ScrumAction } from './types';
import { initialScrumState } from './config';
import { planSprint, moveBacklogStory, startStory, addToSprint, assignDev, unassignDev, setTeam, clearImpediment, acceptChange, declineChange, runSprintDay, runRemainingDays, reviewSprint, acceptStory, rejectStory, finishReview, startNextSprint, endGame } from './engine';

// The Sprint loop is built out slice by slice. Planning is live; daily execution,
// Review and Retro follow.
function reducer(state: ScrumState, action: ScrumAction): ScrumState {
  switch (action.type) {
    case 'START':
      return { ...state, phase: 'planning' };
    case 'SET_PHASE':
      return { ...state, phase: action.phase };
    case 'SET_TEAM':
      return setTeam(state, action.team);
    case 'MOVE_STORY':
      return moveBacklogStory(state, action.storyId, action.dir);
    case 'PLAN_SPRINT':
      return planSprint(state, action.goal, action.storyIds, action.length);
    case 'START_STORY':
      return startStory(state, action.storyId);
    case 'ADD_TO_SPRINT':
      return addToSprint(state, action.storyId);
    case 'ASSIGN_DEV':
      return assignDev(state, action.devId, action.storyId);
    case 'UNASSIGN_DEV':
      return unassignDev(state, action.devId);
    case 'CLEAR_IMPEDIMENT':
      return clearImpediment(state);
    case 'ACCEPT_CHANGE':
      return acceptChange(state);
    case 'DECLINE_CHANGE':
      return declineChange(state);
    case 'RUN_SPRINT_DAY':
      return runSprintDay(state);
    case 'RUN_TO_END':
      return runRemainingDays(state);
    case 'REVIEW_SPRINT':
      return reviewSprint(state);
    case 'ACCEPT_STORY':
      return acceptStory(state, action.storyId);
    case 'REJECT_STORY':
      return rejectStory(state, action.storyId);
    case 'FINISH_REVIEW':
      return finishReview(state);
    case 'NEXT_SPRINT':
      return startNextSprint(state, action.improvement);
    case 'END_GAME':
      return endGame(state);
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
    (goal: string, storyIds: string[], length: number) => dispatch({ type: 'PLAN_SPRINT', goal, storyIds, length }),
    [],
  );
  const moveStoryAction = useCallback((storyId: string, dir: 'up' | 'down') => dispatch({ type: 'MOVE_STORY', storyId, dir }), []);
  const startStoryAction = useCallback((storyId: string) => dispatch({ type: 'START_STORY', storyId }), []);
  const addToSprintAction = useCallback((storyId: string) => dispatch({ type: 'ADD_TO_SPRINT', storyId }), []);
  const setTeamAction = useCallback((team: ScrumState['team']) => dispatch({ type: 'SET_TEAM', team }), []);
  const assignDevAction = useCallback((devId: string, storyId: string) => dispatch({ type: 'ASSIGN_DEV', devId, storyId }), []);
  const unassignDevAction = useCallback((devId: string) => dispatch({ type: 'UNASSIGN_DEV', devId }), []);
  const clearImpedimentAction = useCallback(() => dispatch({ type: 'CLEAR_IMPEDIMENT' }), []);
  const acceptChangeAction = useCallback(() => dispatch({ type: 'ACCEPT_CHANGE' }), []);
  const declineChangeAction = useCallback(() => dispatch({ type: 'DECLINE_CHANGE' }), []);
  const runDay = useCallback(() => dispatch({ type: 'RUN_SPRINT_DAY' }), []);
  const runToEnd = useCallback(() => dispatch({ type: 'RUN_TO_END' }), []);
  const reviewSprintAction = useCallback(() => dispatch({ type: 'REVIEW_SPRINT' }), []);
  const acceptStoryAction = useCallback((storyId: string) => dispatch({ type: 'ACCEPT_STORY', storyId }), []);
  const rejectStoryAction = useCallback((storyId: string) => dispatch({ type: 'REJECT_STORY', storyId }), []);
  const finishReviewAction = useCallback(() => dispatch({ type: 'FINISH_REVIEW' }), []);
  const nextSprint = useCallback((improvement: string) => dispatch({ type: 'NEXT_SPRINT', improvement }), []);
  const endGameAction = useCallback(() => dispatch({ type: 'END_GAME' }), []);
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  return {
    state,
    start,
    setPhase,
    planSprint: planSprintAction,
    startStory: startStoryAction,
    addToSprint: addToSprintAction,
    setTeam: setTeamAction,
    moveStory: moveStoryAction,
    assignDev: assignDevAction,
    unassignDev: unassignDevAction,
    clearImpediment: clearImpedimentAction,
    acceptChange: acceptChangeAction,
    declineChange: declineChangeAction,
    runDay,
    runToEnd,
    reviewSprint: reviewSprintAction,
    acceptStory: acceptStoryAction,
    rejectStory: rejectStoryAction,
    finishReview: finishReviewAction,
    nextSprint,
    endGame: endGameAction,
    reset,
  };
}
