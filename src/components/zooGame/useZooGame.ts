import { useReducer, useCallback } from 'react';
import type { ZooGameState, ZooAction, ZooPhase, PbiDraft, SprintTask, PoDecisions } from './types';
import type { ItemDesign } from './design';
import { initialZooState } from './config';
import {
  planSprint, pullIntoSprint, estimateItem, setItemTasks, toggleItemTask, startItem, toggleGoalCritical, setSprintDays, setLearnMode, setDailyScrumAt, setEnclosureSize, setItemPos, setItemSpot, splitEpic, applyPoRefinements, addPbi, refinePbi, moveItem, moveItemBefore, setUseUserStories, moveToZone, addZone, renameZone, reorderInZone, moveZone, deletePbi, duplicatePbi, assignDev, renameMember, setPathStyle, setPathRoute, addZooPath, deleteZooPath, clearZooPaths, buildItem, editItem, addAnother, improveItem, openItem, acceptSignal, setProductGoal, setSprintGoal, setDefinitionOfDone,
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
    case 'SET_SCRUM_AT':
      return setDailyScrumAt(state, action.at);
    case 'SET_ENCLOSURE':
      return setEnclosureSize(state, action.id, action.size);
    case 'SET_POS':
      return setItemPos(state, action.id, action.pos);
    case 'SPLIT_EPIC':
      return splitEpic(state, action.id, action.memberIds);
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
    case 'DELETE_PBI':
      return deletePbi(state, action.id);
    case 'DUPLICATE_PBI':
      return duplicatePbi(state, action.id);
    case 'ASSIGN_DEV':
      return assignDev(state, action.itemId, action.devId);
    case 'RENAME_MEMBER':
      return renameMember(state, action.memberId, action.name);
    case 'MOVE_ZONE':
      return moveZone(state, action.zone, action.dir);
    case 'SET_PATH_STYLE':
      return setPathStyle(state, action.style);
    case 'SET_PATH_ROUTE':
      return setPathRoute(state, action.route);
    case 'ADD_PATH':
      return addZooPath(state, action.points);
    case 'DELETE_PATH':
      return deleteZooPath(state, action.id);
    case 'CLEAR_PATHS':
      return clearZooPaths(state);
    case 'PULL_ITEM':
      return pullIntoSprint(state, action.id);
    case 'BUILD_ITEM':
      return buildItem(state, action.id, action.design);
    case 'EDIT_ITEM':
      return editItem(state, action.id, action.design);
    case 'ADD_ANOTHER':
      return addAnother(state, action.id);
    case 'IMPROVE_ITEM':
      return improveItem(state, action.id);
    case 'SET_ITEM_SPOT':
      return setItemSpot(state, action.id, action.spot);
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
    case 'LOAD_GAME':
      // Resume a saved game: replace the whole state with the loaded snapshot. Merge over a
      // fresh state so any fields added since the save get sensible defaults.
      return { ...initialZooState(action.state.gameSeed ?? state.gameSeed), ...action.state };
    case 'PO_REFINE':
      return applyPoRefinements(state, action.decisions);
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
  const chooseScrumAt = useCallback((at: 'start' | 'end') => dispatch({ type: 'SET_SCRUM_AT', at }), []);
  const chooseEnclosure = useCallback((id: string, size: 'small' | 'medium' | 'large') => dispatch({ type: 'SET_ENCLOSURE', id, size }), []);
  const placeItem = useCallback((id: string, pos: { x: number; y: number }) => dispatch({ type: 'SET_POS', id, pos }), []);
  const splitEpicCb = useCallback((id: string, memberIds: string[]) => dispatch({ type: 'SPLIT_EPIC', id, memberIds }), []);
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
  const deletePbiCb = useCallback((id: string) => dispatch({ type: 'DELETE_PBI', id }), []);
  const duplicatePbiCb = useCallback((id: string) => dispatch({ type: 'DUPLICATE_PBI', id }), []);
  const assignDevCb = useCallback((itemId: string, devId: string) => dispatch({ type: 'ASSIGN_DEV', itemId, devId }), []);
  const renameMemberCb = useCallback((memberId: string, name: string) => dispatch({ type: 'RENAME_MEMBER', memberId, name }), []);
  const moveZoneOrder = useCallback((zone: string, dir: 'up' | 'down') => dispatch({ type: 'MOVE_ZONE', zone, dir }), []);
  const setPathStyleCb = useCallback((style: string) => dispatch({ type: 'SET_PATH_STYLE', style }), []);
  const setPathRouteCb = useCallback((route: 'straight' | 'elbow' | 'spine' | 'none') => dispatch({ type: 'SET_PATH_ROUTE', route }), []);
  const addPathCb = useCallback((points: { x: number; y: number }[]) => dispatch({ type: 'ADD_PATH', points }), []);
  const deletePathCb = useCallback((id: string) => dispatch({ type: 'DELETE_PATH', id }), []);
  const clearPathsCb = useCallback(() => dispatch({ type: 'CLEAR_PATHS' }), []);
  const build = useCallback((id: string, design?: ItemDesign) => dispatch({ type: 'BUILD_ITEM', id, design }), []);
  const editBuild = useCallback((id: string, design: ItemDesign) => dispatch({ type: 'EDIT_ITEM', id, design }), []);
  const addAnotherPbi = useCallback((id: string) => dispatch({ type: 'ADD_ANOTHER', id }), []);
  const improve = useCallback((id: string) => dispatch({ type: 'IMPROVE_ITEM', id }), []);
  const setSpot = useCallback((id: string, spot: { x: number; y: number }) => dispatch({ type: 'SET_ITEM_SPOT', id, spot }), []);
  const open = useCallback((id: string) => dispatch({ type: 'OPEN_ITEM', id }), []);
  const closeDay = useCallback(() => dispatch({ type: 'END_DAY' }), []);
  const holdDailyScrum = useCallback(() => dispatch({ type: 'RUN_DAILY_SCRUM' }), []);
  const skipDailyScrumCb = useCallback(() => dispatch({ type: 'SKIP_DAILY_SCRUM' }), []);
  const beginDay = useCallback(() => dispatch({ type: 'START_DAY' }), []);
  const review = useCallback(() => dispatch({ type: 'REVIEW_SPRINT' }), []);
  const nextSprint = useCallback((improvement: string) => dispatch({ type: 'NEXT_SPRINT', improvement }), []);
  const finish = useCallback(() => dispatch({ type: 'END_GAME' }), []);
  const loadGame = useCallback((loaded: ZooGameState) => dispatch({ type: 'LOAD_GAME', state: loaded }), []);
  const poRefine = useCallback((decisions: PoDecisions) => dispatch({ type: 'PO_REFINE', decisions }), []);
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  return {
    state, start, setPhase, setGoal, setSprintGoal: setSprintGoalCb, setDod, takeSignal, plan, estimate, setTasks, toggleTask, startItem: startWork, toggleGoalCritical: markGoalCritical, setSprintDays: chooseSprintDays, setLearnMode: setLearn, setDailyScrumAt: chooseScrumAt, setEnclosureSize: chooseEnclosure, setItemPos: placeItem, setItemSpot: setSpot, splitEpic: splitEpicCb, createPbi, refinePbi: refinePbiCb, reorder, moveBefore, setUserStories, pull, build, editBuild, addAnotherPbi, improve, open, loadGame, poRefine,
    moveZone, createZone, renameZone: renameZoneCb, reorderZone, moveZoneOrder, deletePbi: deletePbiCb, duplicatePbi: duplicatePbiCb, assignDev: assignDevCb, renameMember: renameMemberCb, setPathStyle: setPathStyleCb, setPathRoute: setPathRouteCb, addPath: addPathCb, deletePath: deletePathCb, clearPaths: clearPathsCb,
    closeDay, holdDailyScrum, skipDailyScrum: skipDailyScrumCb, beginDay, review, nextSprint, finish, reset,
  };
}
