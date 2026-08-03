import { useReducer, useCallback } from 'react';
import type { ZooGameState, ZooAction, ZooPhase, PbiDraft, SprintTask } from './types';
import type { ItemDesign } from './design';
import { initialZooState } from './config';
import {
  planSprint, pullIntoSprint, estimateItem, setItemTasks, toggleItemTask, startItem, toggleGoalCritical, setSprintDays, setLearnMode, addPbi, refinePbi, moveItem, moveItemBefore, setUseUserStories, moveToZone, addZone, renameZone, reorderInZone, buildItem, editItem, addAnother, openItem, acceptSignal, setProductGoal, setSprintGoal, setDefinitionOfDone,
  reviewSprint, startNextSprint, endGame, endDay, runDailyScrum, skipDailyScrum, startDay,
} from './engine';

// The zoo game's Sprint loop, built slice by slice on the same reducer shape as the
// /scrum-game. This slice is the core loop: plan, build, open (release), review
// (with the visitor simulation), retro, next Sprint.
function reducer(state: ZooGameState, action: ZooAction): ZooGameState {
  switch (action.type) {
    case 'START':
      // Sprint 1 begins with a one-time Product Backlog refinement (order + estimate);
      // from Sprint 2 on, refinement is ongoing on the board, so it goes to planning.
      return { ...initialZooState(action.gameSeed ?? state.gameSeed), phase: 'refine' };
    case 'SET_PHASE':
      return { ...state, phase: action.phase };
    case 'SET_PRODUCT_GOAL':
      return setProductGoal(state, action.goal);
    case 'SET_SPRINT_GOAL':
      return setSprintGoal(state, action.goal);
    case 'SET_DOD':
      return setDefinitionOfDone(state, action.dod);
    case 'ACCEPT_SIGNAL':
      return acceptSignal(state, action.index);
    case 'PLAN_SPRINT':
      return planSprint(state, action.ids);
    case 'ESTIMATE_ITEM':
      return estimateItem(state, action.id, action.points);
    case 'SET_TASKS':
      return setItemTasks(state, action.id, action.tasks);
    case 'TOGGLE_TASK':
      return toggleItemTask(state, action.id, action.taskId);
    case 'START_ITEM':
      return startItem(state, action.id);
    case 'TOGGLE_GOAL_CRITICAL':
      return toggleGoalCritical(state, action.id);
    case 'SET_SPRINT_DAYS':
      return setSprintDays(state, action.days);
    case 'SET_LEARN_MODE':
      return setLearnMode(state, action.on);
    case 'ADD_PBI':
      return addPbi(state, action.draft);
    case 'REFINE_PBI':
      return refinePbi(state, action.id, action.draft);
    case 'MOVE_ITEM':
      return moveItem(state, action.id, action.dir);
    case 'MOVE_ITEM_BEFORE':
      return moveItemBefore(state, action.id, action.beforeId);
    case 'SET_USE_USER_STORIES':
      return setUseUserStories(state, action.on);
    case 'MOVE_TO_ZONE':
      return moveToZone(state, action.id, action.zone);
    case 'ADD_ZONE':
      return addZone(state, action.name);
    case 'RENAME_ZONE':
      return renameZone(state, action.oldName, action.newName);
    case 'REORDER_IN_ZONE':
      return reorderInZone(state, action.id, action.dir);
    case 'PULL_ITEM':
      return pullIntoSprint(state, action.id);
    case 'BUILD_ITEM':
      return buildItem(state, action.id, action.design);
    case 'EDIT_ITEM':
      return editItem(state, action.id, action.design);
    case 'ADD_ANOTHER':
      return addAnother(state, action.id);
    case 'OPEN_ITEM':
      return openItem(state, action.id);
    case 'END_DAY':
      return endDay(state);
    case 'RUN_DAILY_SCRUM':
      return runDailyScrum(state);
    case 'SKIP_DAILY_SCRUM':
      return skipDailyScrum(state);
    case 'START_DAY':
      return startDay(state);
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
  const setPhase = useCallback((phase: ZooPhase) => dispatch({ type: 'SET_PHASE', phase }), []);
  const setGoal = useCallback((goal: string) => dispatch({ type: 'SET_PRODUCT_GOAL', goal }), []);
  const setSprintGoalCb = useCallback((goal: string) => dispatch({ type: 'SET_SPRINT_GOAL', goal }), []);
  const setDod = useCallback((dod: string[]) => dispatch({ type: 'SET_DOD', dod }), []);
  const takeSignal = useCallback((index: number) => dispatch({ type: 'ACCEPT_SIGNAL', index }), []);
  const plan = useCallback((ids: string[]) => dispatch({ type: 'PLAN_SPRINT', ids }), []);
  const estimate = useCallback((id: string, points: number) => dispatch({ type: 'ESTIMATE_ITEM', id, points }), []);
  const setTasks = useCallback((id: string, tasks: SprintTask[]) => dispatch({ type: 'SET_TASKS', id, tasks }), []);
  const toggleTask = useCallback((id: string, taskId: string) => dispatch({ type: 'TOGGLE_TASK', id, taskId }), []);
  const startWork = useCallback((id: string) => dispatch({ type: 'START_ITEM', id }), []);
  const markGoalCritical = useCallback((id: string) => dispatch({ type: 'TOGGLE_GOAL_CRITICAL', id }), []);
  const chooseSprintDays = useCallback((days: number) => dispatch({ type: 'SET_SPRINT_DAYS', days }), []);
  const setLearn = useCallback((on: boolean) => dispatch({ type: 'SET_LEARN_MODE', on }), []);
  const createPbi = useCallback((draft: PbiDraft) => dispatch({ type: 'ADD_PBI', draft }), []);
  const refinePbiCb = useCallback((id: string, draft: PbiDraft) => dispatch({ type: 'REFINE_PBI', id, draft }), []);
  const reorder = useCallback((id: string, dir: 'up' | 'down') => dispatch({ type: 'MOVE_ITEM', id, dir }), []);
  const moveBefore = useCallback((id: string, beforeId: string) => dispatch({ type: 'MOVE_ITEM_BEFORE', id, beforeId }), []);
  const setUserStories = useCallback((on: boolean) => dispatch({ type: 'SET_USE_USER_STORIES', on }), []);
  const pull = useCallback((id: string) => dispatch({ type: 'PULL_ITEM', id }), []);
  const moveZone = useCallback((id: string, zone: string) => dispatch({ type: 'MOVE_TO_ZONE', id, zone }), []);
  const createZone = useCallback((name: string) => dispatch({ type: 'ADD_ZONE', name }), []);
  const renameZoneCb = useCallback((oldName: string, newName: string) => dispatch({ type: 'RENAME_ZONE', oldName, newName }), []);
  const reorderZone = useCallback((id: string, dir: 'up' | 'down') => dispatch({ type: 'REORDER_IN_ZONE', id, dir }), []);
  const build = useCallback((id: string, design?: ItemDesign) => dispatch({ type: 'BUILD_ITEM', id, design }), []);
  const editBuild = useCallback((id: string, design: ItemDesign) => dispatch({ type: 'EDIT_ITEM', id, design }), []);
  const addAnotherPbi = useCallback((id: string) => dispatch({ type: 'ADD_ANOTHER', id }), []);
  const open = useCallback((id: string) => dispatch({ type: 'OPEN_ITEM', id }), []);
  const closeDay = useCallback(() => dispatch({ type: 'END_DAY' }), []);
  const holdDailyScrum = useCallback(() => dispatch({ type: 'RUN_DAILY_SCRUM' }), []);
  const skipDailyScrumCb = useCallback(() => dispatch({ type: 'SKIP_DAILY_SCRUM' }), []);
  const beginDay = useCallback(() => dispatch({ type: 'START_DAY' }), []);
  const review = useCallback(() => dispatch({ type: 'REVIEW_SPRINT' }), []);
  const nextSprint = useCallback((improvement: string) => dispatch({ type: 'NEXT_SPRINT', improvement }), []);
  const finish = useCallback(() => dispatch({ type: 'END_GAME' }), []);
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  return {
    state, start, setPhase, setGoal, setSprintGoal: setSprintGoalCb, setDod, takeSignal, plan, estimate, setTasks, toggleTask, startItem: startWork, toggleGoalCritical: markGoalCritical, setSprintDays: chooseSprintDays, setLearnMode: setLearn, createPbi, refinePbi: refinePbiCb, reorder, moveBefore, setUserStories, pull, build, editBuild, addAnotherPbi, open,
    moveZone, createZone, renameZone: renameZoneCb, reorderZone,
    closeDay, holdDailyScrum, skipDailyScrum: skipDailyScrumCb, beginDay, review, nextSprint, finish, reset,
  };
}
