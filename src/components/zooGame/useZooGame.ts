import { useReducer, useCallback } from 'react';
import type { ZooGameState, ZooAction, ZooPhase, PbiDraft, SprintTask, PoDecisions, ZooConnector, ZooBrief, GoalShape, GoalMeasure } from './types';
import type { ItemDesign } from './design';
import { initialZooState } from './config';
import {
  planSprint, holdPlannedRefinement, agreeDefinitionOfDone, writeBacklog, setGoalForm, planItemShape, startItemAt, pullIntoSprint, estimateItem, setItemTasks, toggleItemTask, confirmAcceptance, setDraftDesign, placeOnPark, startItem, toggleGoalCritical, setSprintDays, setLearnMode, setWipLimit, setTeaching, markTaught, setDailyScrumAt, setEnclosureSize, setItemPos, setItemSpot, setItemSize, setItemRot, addItemCopy, setItemCopyPiece, moveItemCopy, removeItemCopy, nestItem, unnestItem, renameItem, splitEpic, applyPoRefinements, addPbi, refinePbi, moveItem, moveItemBefore, moveSprintItem, moveForecastItem, setUseUserStories, moveToZone, addZone, renameZone, reorderInZone, moveZone, deletePbi, duplicatePbi, assignDev, renameMember, setPathStyle, setPathRoute, addZooPath, deleteZooPath, clearZooPaths, addConnector, updateConnector, deleteConnector, buildItem, editItem, addAnother, improveItem, openItem, acceptSignal, setProductGoal, setSprintGoal, setDefinitionOfDone, setDefinitionOfReady,
  reviewSprint, startNextSprint, cancelSprint, endGame, endDay, runDailyScrum, skipDailyScrum, startDay,
} from './engine';
import { applyParkChecks } from './parkChecks';

// The zoo game's Sprint loop, built slice by slice on the same reducer shape as the
// /scrum-game. This slice is the core loop: plan, build, open (release), review
// (with the visitor simulation), retro, next Sprint.
/** Every action, and then the park's own answers laid over the result.
 *
 *  Half the acceptance criteria are facts rather than opinions now - whether a path reaches a zone,
 *  whether the animals fit the habitat - and a fact has to be recomputed whenever anything that
 *  could change it changes. Doing that here rather than in each reducer means there is no action
 *  that can forget to: drag the last path away and the criterion unticks itself, the sign-off comes
 *  off, and the card cannot go to Done, the way a build reruns its tests rather than trusting the
 *  last green.
 */
function reducer(state: ZooGameState, action: ZooAction): ZooGameState {
  return applyParkChecks(step(state, action));
}

function step(state: ZooGameState, action: ZooAction): ZooGameState {
  switch (action.type) {
    case 'START':
      // There is no Product Backlog yet. The Scrum Team answers three questions about the zoo and
      // writes one - because a Backlog that is simply there teaches that a Product Backlog is
      // something you are handed rather than the Product Owner's to create and order.
      return { ...initialZooState(action.gameSeed ?? state.gameSeed), phase: 'brief', backlog: [] };
    case 'SET_PHASE':
      return { ...state, phase: action.phase };
    case 'SET_PRODUCT_GOAL':
      return setProductGoal(state, action.goal);
    case 'SET_SPRINT_GOAL':
      return setSprintGoal(state, action.goal);
    case 'SET_DOR':
      return setDefinitionOfReady(state, action.dor);
    case 'SET_DOD':
      return setDefinitionOfDone(state, action.dod);
    case 'ACCEPT_SIGNAL':
      return acceptSignal(state, action.index);
    case 'START_ITEM_AT':
      return startItemAt(state, action.id, action.pos);
    case 'PLAN_ITEM_SHAPE':
      return planItemShape(state, action.id, action.patch);
    case 'HOLD_REFINEMENT':
      return holdPlannedRefinement(state);
    case 'AGREE_DOD':
      return agreeDefinitionOfDone(state);
    case 'SET_GOAL_FORM':
      return setGoalForm(state, action.shape, action.goal, action.measures);
    case 'WRITE_BACKLOG':
      return writeBacklog(state, action.brief);
    case 'PLAN_SPRINT':
      return planSprint(state, action.ids, action.refinementPoints);
    case 'ESTIMATE_ITEM':
      return estimateItem(state, action.id, action.points);
    case 'SET_TASKS':
      return setItemTasks(state, action.id, action.tasks);
    case 'TOGGLE_TASK':
      return toggleItemTask(state, action.id, action.taskId);
    case 'CONFIRM_AC':
      return confirmAcceptance(state, action.id, action.index, action.value);
    case 'SET_DRAFT_DESIGN':
      return setDraftDesign(state, action.id, action.design);
    case 'PLACE_ON_PARK':
      return placeOnPark(state, action.id);
    case 'START_ITEM':
      return startItem(state, action.id);
    case 'TOGGLE_GOAL_CRITICAL':
      return toggleGoalCritical(state, action.id);
    case 'SET_SPRINT_DAYS':
      return setSprintDays(state, action.days);
    case 'SET_WIP_LIMIT':
      return setWipLimit(state, action.limit);
    case 'SET_TEACHING':
      return setTeaching(state, action.on);
    case 'MARK_TAUGHT':
      return markTaught(state, action.id);
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
    case 'MOVE_SPRINT_ITEM':
      return moveSprintItem(state, action.id, action.dir);
    case 'DECLINE_PROPOSAL':
      return { ...state, declinedProposals: [...(state.declinedProposals ?? []), action.proposalId] };
    case 'ADD_COPY':
      return addItemCopy(state, action.id, action.pos, action.piece);
    case 'SET_COPY_PIECE':
      return setItemCopyPiece(state, action.id, action.index, action.piece);
    case 'MOVE_COPY':
      return moveItemCopy(state, action.id, action.index, action.pos);
    case 'REMOVE_COPY':
      return removeItemCopy(state, action.id, action.index);
    case 'SET_ROT':
      return setItemRot(state, action.id, action.rot);
    case 'MOVE_FORECAST_ITEM':
      return moveForecastItem(state, action.id, action.dir, action.picked);
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
    case 'ADD_CONNECTOR':
      return addConnector(state, action.connector);
    case 'UPDATE_CONNECTOR':
      return updateConnector(state, action.id, action.patch);
    case 'DELETE_CONNECTOR':
      return deleteConnector(state, action.id);
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
    case 'SET_ITEM_SIZE':
      return setItemSize(state, action.id, action.size);
    case 'NEST_ITEM':
      return nestItem(state, action.id, action.enclosureId, action.spot);
    case 'UNNEST_ITEM':
      return unnestItem(state, action.id);
    case 'RENAME_ITEM':
      return renameItem(state, action.id, action.name);
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
    case 'CANCEL_SPRINT':
      return cancelSprint(state);
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
  const setDor = useCallback((dor: string[]) => dispatch({ type: 'SET_DOR', dor }), []);
  const setDod = useCallback((dod: string[]) => dispatch({ type: 'SET_DOD', dod }), []);
  const takeSignal = useCallback((index: number) => dispatch({ type: 'ACCEPT_SIGNAL', index }), []);
  const plan = useCallback((ids: string[], refinementPoints?: number) => dispatch({ type: 'PLAN_SPRINT', ids, refinementPoints }), []);
  const holdRefinement = useCallback(() => dispatch({ type: 'HOLD_REFINEMENT' }), []);
  const agreeDod = useCallback(() => dispatch({ type: 'AGREE_DOD' }), []);
  const writeTheBacklog = useCallback((brief: ZooBrief) => dispatch({ type: 'WRITE_BACKLOG', brief }), []);
  const setGoalShape = useCallback((shape: GoalShape, goal: string, measures: GoalMeasure[]) => dispatch({ type: 'SET_GOAL_FORM', shape, goal, measures }), []);
  const startHere = useCallback((id: string, pos: { x: number; y: number }) => dispatch({ type: 'START_ITEM_AT', id, pos }), []);
  const planShape = useCallback((id: string, patch: { enclosureSize?: 'small' | 'medium' | 'large'; enclosureId?: string; template?: string }) => dispatch({ type: 'PLAN_ITEM_SHAPE', id, patch }), []);
  const estimate = useCallback((id: string, points: number) => dispatch({ type: 'ESTIMATE_ITEM', id, points }), []);
  const setTasks = useCallback((id: string, tasks: SprintTask[]) => dispatch({ type: 'SET_TASKS', id, tasks }), []);
  const toggleTask = useCallback((id: string, taskId: string) => dispatch({ type: 'TOGGLE_TASK', id, taskId }), []);
  const confirmAc = useCallback((id: string, index: number, value: boolean) => dispatch({ type: 'CONFIRM_AC', id, index, value }), []);
  const placeOnParkCb = useCallback((id: string) => dispatch({ type: 'PLACE_ON_PARK', id }), []);
  const saveDraftDesign = useCallback((id: string, design: ItemDesign) => dispatch({ type: 'SET_DRAFT_DESIGN', id, design }), []);
  const startWork = useCallback((id: string) => dispatch({ type: 'START_ITEM', id }), []);
  const markGoalCritical = useCallback((id: string) => dispatch({ type: 'TOGGLE_GOAL_CRITICAL', id }), []);
  const chooseSprintDays = useCallback((days: number) => dispatch({ type: 'SET_SPRINT_DAYS', days }), []);
  const setWip = useCallback((limit: number) => dispatch({ type: 'SET_WIP_LIMIT', limit }), []);
  const teach = useCallback((on: boolean) => dispatch({ type: 'SET_TEACHING', on }), []);
  const markRead = useCallback((id: string) => dispatch({ type: 'MARK_TAUGHT', id }), []);
  const setLearn = useCallback((on: boolean) => dispatch({ type: 'SET_LEARN_MODE', on }), []);
  const chooseScrumAt = useCallback((at: 'start' | 'end') => dispatch({ type: 'SET_SCRUM_AT', at }), []);
  const chooseEnclosure = useCallback((id: string, size: 'small' | 'medium' | 'large') => dispatch({ type: 'SET_ENCLOSURE', id, size }), []);
  const placeItem = useCallback((id: string, pos: { x: number; y: number }) => dispatch({ type: 'SET_POS', id, pos }), []);
  const splitEpicCb = useCallback((id: string, memberIds: string[]) => dispatch({ type: 'SPLIT_EPIC', id, memberIds }), []);
  const createPbi = useCallback((draft: PbiDraft) => dispatch({ type: 'ADD_PBI', draft }), []);
  const declineProposal = useCallback((proposalId: string) => dispatch({ type: 'DECLINE_PROPOSAL', proposalId }), []);
  const refinePbiCb = useCallback((id: string, draft: PbiDraft) => dispatch({ type: 'REFINE_PBI', id, draft }), []);
  const reorder = useCallback((id: string, dir: 'up' | 'down') => dispatch({ type: 'MOVE_ITEM', id, dir }), []);
  const moveBefore = useCallback((id: string, beforeId: string) => dispatch({ type: 'MOVE_ITEM_BEFORE', id, beforeId }), []);
  const reorderSprint = useCallback((id: string, dir: 'up' | 'down') => dispatch({ type: 'MOVE_SPRINT_ITEM', id, dir }), []);
  const reorderForecast = useCallback((id: string, dir: 'up' | 'down', picked: string[]) => dispatch({ type: 'MOVE_FORECAST_ITEM', id, dir, picked }), []);
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
  const addConnectorCb = useCallback((connector: ZooConnector) => dispatch({ type: 'ADD_CONNECTOR', connector }), []);
  const updateConnectorCb = useCallback((id: string, patch: Partial<ZooConnector>) => dispatch({ type: 'UPDATE_CONNECTOR', id, patch }), []);
  const deleteConnectorCb = useCallback((id: string) => dispatch({ type: 'DELETE_CONNECTOR', id }), []);
  const build = useCallback((id: string, design?: ItemDesign) => dispatch({ type: 'BUILD_ITEM', id, design }), []);
  const editBuild = useCallback((id: string, design: ItemDesign) => dispatch({ type: 'EDIT_ITEM', id, design }), []);
  const addAnotherPbi = useCallback((id: string) => dispatch({ type: 'ADD_ANOTHER', id }), []);
  const improve = useCallback((id: string) => dispatch({ type: 'IMPROVE_ITEM', id }), []);
  const setSpot = useCallback((id: string, spot: { x: number; y: number }) => dispatch({ type: 'SET_ITEM_SPOT', id, spot }), []);
  const setSize = useCallback((id: string, size: { w: number; h: number }) => dispatch({ type: 'SET_ITEM_SIZE', id, size }), []);
  const addCopy = useCallback((id: string, pos?: { x: number; y: number }, piece?: string) => dispatch({ type: 'ADD_COPY', id, pos, piece }), []);
  const setCopyPiece = useCallback((id: string, index: number, piece: string) => dispatch({ type: 'SET_COPY_PIECE', id, index, piece }), []);
  const moveCopy = useCallback((id: string, index: number, pos: { x: number; y: number }) => dispatch({ type: 'MOVE_COPY', id, index, pos }), []);
  const removeCopy = useCallback((id: string, index: number) => dispatch({ type: 'REMOVE_COPY', id, index }), []);
  const setRot = useCallback((id: string, rot: number) => dispatch({ type: 'SET_ROT', id, rot }), []);
  const nest = useCallback((id: string, enclosureId: string, spot: { x: number; y: number }) => dispatch({ type: 'NEST_ITEM', id, enclosureId, spot }), []);
  const unnest = useCallback((id: string) => dispatch({ type: 'UNNEST_ITEM', id }), []);
  const renameItemCb = useCallback((id: string, name: string) => dispatch({ type: 'RENAME_ITEM', id, name }), []);
  const open = useCallback((id: string) => dispatch({ type: 'OPEN_ITEM', id }), []);
  const closeDay = useCallback(() => dispatch({ type: 'END_DAY' }), []);
  const holdDailyScrum = useCallback(() => dispatch({ type: 'RUN_DAILY_SCRUM' }), []);
  const skipDailyScrumCb = useCallback(() => dispatch({ type: 'SKIP_DAILY_SCRUM' }), []);
  const beginDay = useCallback(() => dispatch({ type: 'START_DAY' }), []);
  const cancelTheSprint = useCallback(() => dispatch({ type: 'CANCEL_SPRINT' }), []);
  const review = useCallback(() => dispatch({ type: 'REVIEW_SPRINT' }), []);
  const nextSprint = useCallback((improvement: string) => dispatch({ type: 'NEXT_SPRINT', improvement }), []);
  const finish = useCallback(() => dispatch({ type: 'END_GAME' }), []);
  const loadGame = useCallback((loaded: ZooGameState) => dispatch({ type: 'LOAD_GAME', state: loaded }), []);
  const poRefine = useCallback((decisions: PoDecisions) => dispatch({ type: 'PO_REFINE', decisions }), []);
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  return {
    state, start, setPhase, setGoal, setSprintGoal: setSprintGoalCb, setDod, setDor, takeSignal, plan, holdRefinement, agreeDod, writeBacklog: writeTheBacklog, setGoalShape, planShape, estimate, setTasks, toggleTask, confirmAc, saveDraftDesign, placeOnPark: placeOnParkCb, startItem: startWork, startHere, toggleGoalCritical: markGoalCritical, setSprintDays: chooseSprintDays, setLearnMode: setLearn, setWipLimit: setWip, setTeaching: teach, markTaught: markRead, setDailyScrumAt: chooseScrumAt, setEnclosureSize: chooseEnclosure, setItemPos: placeItem, setItemSpot: setSpot, setItemSize: setSize, setItemRot: setRot, addCopy, setCopyPiece, moveCopy, removeCopy, nestItem: nest, unnestItem: unnest, renameItem: renameItemCb, splitEpic: splitEpicCb, createPbi, declineProposal, refinePbi: refinePbiCb, reorder, moveBefore, reorderSprint, reorderForecast, setUserStories, pull, build, editBuild, addAnotherPbi, improve, open, loadGame, poRefine,
    moveZone, createZone, renameZone: renameZoneCb, reorderZone, moveZoneOrder, deletePbi: deletePbiCb, duplicatePbi: duplicatePbiCb, assignDev: assignDevCb, renameMember: renameMemberCb, setPathStyle: setPathStyleCb, setPathRoute: setPathRouteCb, addPath: addPathCb, deletePath: deletePathCb, clearPaths: clearPathsCb, addConnector: addConnectorCb, updateConnector: updateConnectorCb, deleteConnector: deleteConnectorCb,
    closeDay, cancelSprint: cancelTheSprint, holdDailyScrum, skipDailyScrum: skipDailyScrumCb, beginDay, review, nextSprint, finish, reset,
  };
}
