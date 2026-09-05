import { useReducer, useCallback, useEffect, useMemo } from 'react';
import type { ZooGameState, ZooAction } from './types';
import { zooActions } from './zooActions';
import { initialZooState } from './config';
import {
  dropFromSprint,
  planSprint, holdPlannedRefinement, askPlacement, answerPlacement, setSprintBet, agreeDefinitionOfDone, writeBacklog, setGoalForm, planItemShape, startItemAt, pullIntoSprint, estimateItem, setItemTasks, toggleItemTask, confirmAcceptance, setDraftDesign, placeOnPark, startItem, toggleGoalCritical, setSprintDays, setLearnMode, setWipLimit, setTeaching, markTaught, setDailyScrumAt, setEnclosureSize, setItemPos, setItemSpot, setMemberSpot, setItemSize, setItemRot, addItemCopy, setItemCopyPiece, moveItemCopy, removeItemCopy, nestItem, unnestItem, renameItem, splitEpic, applyPoRefinements, addPbi, refinePbi, moveItem, moveItemBefore, moveSprintItem, moveForecastItem, setUseUserStories, moveToZone, addZone, renameZone, reorderInZone, moveZone, deletePbi, duplicatePbi, assignDev, renameMember, setPathStyle, setPathRoute, addZooPath, deleteZooPath, clearZooPaths, addConnector, updateConnector, deleteConnector, buildItem, editItem, addAnother, improveItem, openItem, acceptSignal, setProductGoal, setSprintGoal, setDefinitionOfDone, setDefinitionOfReady,
  agreeSprintGoal, setForecast, spendDay, reviewSprint, startNextSprint, cancelSprint, endGame, endDay, runDailyScrum, skipDailyScrum, startDay, tickDay, tickScrum,
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
/** The whole game, as a pure function of state and one action. Exported because a shared
 *  session replays it: an action is applied locally for instant feedback, and if the write
 *  loses a race the pending actions are re-applied onto whatever the server actually has.
 *  That re-application is only sound because this is pure - no clock, no randomness that
 *  is not seeded, no I/O. */
export function reducer(state: ZooGameState, action: ZooAction): ZooGameState {
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
      return setDefinitionOfDone(state, action.dod, action.by);
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
      // Who chose the work, not who pressed the button. The Product Owner starting the Sprint is
      // not the Product Owner selecting the Sprint Backlog, and telling a team it was would be
      // worse than saying nothing: the whole point of the record is that it is accurate.
      return planSprint({ ...state, forecastBy: state.forecastBy ?? action.by }, action.ids, action.refinementPoints);
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
      return startItem(state, action.id, action.by);
    case 'TOGGLE_GOAL_CRITICAL':
      return toggleGoalCritical(state, action.id);
    case 'SET_SPRINT_DAYS':
      return setSprintDays(state, action.days);
    case 'SET_WIP_LIMIT':
      return setWipLimit(state, action.limit, action.by);
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
      return addItemCopy(state, action.id, action.at, action.piece);
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
      return pullIntoSprint(state, action.id, action.by);
    case 'DROP_FROM_SPRINT':
      return dropFromSprint(state, action.id, action.by);
    case 'BUILD_ITEM':
      return buildItem(state, action.id, action.design);
    case 'EDIT_ITEM':
      return editItem(state, action.id, action.design);
    case 'ADD_ANOTHER':
      return addAnother(state, action.id);
    case 'IMPROVE_ITEM':
      return improveItem(state, action.id);
    case 'SET_MEMBER_SPOT':
      return setMemberSpot(state, action.id, action.member, action.spot);
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
      return openItem(state, action.id, action.by);
    case 'SET_SPRINT_BET':
      return setSprintBet(state, action.bet);
    case 'ASK_PLACEMENT':
      return askPlacement(state, action.id);
    case 'ANSWER_PLACEMENT':
      return answerPlacement(state, action.id, action.choice);
    case 'SET_PLANNING_TOPIC':
      // Sprint Planning is one event. Whoever moves the agenda on moves it for everybody.
      return { ...state, planningTopic: action.topic };
    case 'AGREE_SPRINT_GOAL':
      return agreeSprintGoal(state, action.seat);
    case 'SET_FORECAST':
      // Remembered rather than noted: a forecast is built item by item, and what matters is who
      // chose the one that got committed.
      return setForecast({ ...state, forecastBy: action.by ?? state.forecastBy }, action.ids);
    case 'SPEND_DAY':
      return spendDay(state, action.seconds);
    case 'TICK_DAY':
      return tickDay(state);
    case 'TICK_SCRUM':
      return tickScrum(state);
    case 'END_DAY':
      return endDay(state);
    case 'RUN_DAILY_SCRUM':
      return runDailyScrum(state, action.by);
    case 'SKIP_DAILY_SCRUM':
      return skipDailyScrum(state, action.by);
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

export function useZooGame(gameSeed?: number, runClock = true) {
  const [state, dispatch] = useReducer(reducer, gameSeed, initialZooState);

  // The one clock. It used to live in DayTimer and DailyScrum, one countdown per component,
  // which meant it could not be saved, shared or paused - and in a shared session every
  // browser would have run its own and every one of them would have ended the day. The
  // reducer decides whether a tick means anything, so this stays a dumb heartbeat.
  // `runClock` is how a shared session will let a single owner drive it.
  const ticking = runClock && state.phase === 'sprint' && !state.learnMode;
  useEffect(() => {
    if (!ticking) return;
    const id = setInterval(() => dispatch(
      { type: state.dayStage === 'dailyScrum' ? 'TICK_SCRUM' : 'TICK_DAY' }), 1000);
    return () => clearInterval(id);
  }, [ticking, state.dayStage]);

  // Every action lives in zooActions, built around a carrier, so a shared game and a solo
  // game offer the screens exactly the same surface and there is only one list to maintain.
  const send = useCallback((action: ZooAction) => dispatch(action), []);
  const actions = useMemo(() => zooActions(send), [send]);

  return { state, ...actions };
}
