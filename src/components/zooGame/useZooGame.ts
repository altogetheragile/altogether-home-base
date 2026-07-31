import { useReducer, useCallback } from 'react';
import type { ZooGameState, ZooAction } from './types';
import { initialZooState } from './config';
import {
  planSprint, buildItem, openItem, acceptSignal, setProductGoal, setDefinitionOfDone,
  reviewSprint, startNextSprint, endGame,
} from './engine';

// The zoo game's Sprint loop, built slice by slice on the same reducer shape as the
// /scrum-game. This slice is the core loop: plan, build, open (release), review
// (with the visitor simulation), retro, next Sprint.
function reducer(state: ZooGameState, action: ZooAction): ZooGameState {
  switch (action.type) {
    case 'START':
      return { ...initialZooState(action.gameSeed ?? state.gameSeed), phase: 'planning' };
    case 'SET_PRODUCT_GOAL':
      return setProductGoal(state, action.goal);
    case 'SET_DOD':
      return setDefinitionOfDone(state, action.dod);
    case 'ACCEPT_SIGNAL':
      return acceptSignal(state, action.index);
    case 'PLAN_SPRINT':
      return planSprint(state, action.ids);
    case 'BUILD_ITEM':
      return buildItem(state, action.id);
    case 'OPEN_ITEM':
      return openItem(state, action.id);
    case 'REVIEW_SPRINT':
      return reviewSprint(state);
    case 'NEXT_SPRINT':
      return startNextSprint(state, action.improvement);
    case 'END_GAME':
      return endGame(state);
    case 'RESET':
      return initialZooState(state.gameSeed);
    default:
      return state;
  }
}

export function useZooGame(gameSeed?: number) {
  const [state, dispatch] = useReducer(reducer, gameSeed, initialZooState);

  const start = useCallback((seed?: number) => dispatch({ type: 'START', gameSeed: seed }), []);
  const setGoal = useCallback((goal: string) => dispatch({ type: 'SET_PRODUCT_GOAL', goal }), []);
  const setDod = useCallback((dod: string[]) => dispatch({ type: 'SET_DOD', dod }), []);
  const takeSignal = useCallback((index: number) => dispatch({ type: 'ACCEPT_SIGNAL', index }), []);
  const plan = useCallback((ids: string[]) => dispatch({ type: 'PLAN_SPRINT', ids }), []);
  const build = useCallback((id: string) => dispatch({ type: 'BUILD_ITEM', id }), []);
  const open = useCallback((id: string) => dispatch({ type: 'OPEN_ITEM', id }), []);
  const review = useCallback(() => dispatch({ type: 'REVIEW_SPRINT' }), []);
  const nextSprint = useCallback((improvement: string) => dispatch({ type: 'NEXT_SPRINT', improvement }), []);
  const finish = useCallback(() => dispatch({ type: 'END_GAME' }), []);
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  return { state, start, setGoal, setDod, takeSignal, plan, build, open, review, nextSprint, finish, reset };
}
