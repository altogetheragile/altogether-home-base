import type { ZooGameState, ZooAction, ZooPhase, PbiDraft, SprintTask, PoDecisions, ZooConnector, ZooBrief, GoalShape, GoalMeasure } from './types';
import type { ItemDesign } from './design';

// Every action a player can take, in one list, built around whoever is going to carry it.
//
// There are two carriers. A game played alone dispatches straight into the reducer; a game
// played together sends the action to be applied locally and written to the session. The
// screens must not have to know which they were given, and there must not be two lists of
// eighty-six callbacks drifting apart - the same reason the teaching lives in one set of
// cards rather than being repeated on each screen.
//
// `send` is expected to be stable, so the object this returns can be memoised and the
// callbacks keep their identity across renders.

export function zooActions(send: (action: ZooAction) => void) {
  return {
    start: (seed?: number) => send({ type: 'START', gameSeed: seed }),
    setPhase: (phase: ZooPhase) => send({ type: 'SET_PHASE', phase }),
    setGoal: (goal: string) => send({ type: 'SET_PRODUCT_GOAL', goal }),
    setSprintGoal: (goal: string) => send({ type: 'SET_SPRINT_GOAL', goal }),
    setPlanningTopic: (topic: 'why' | 'what' | 'how') => send({ type: 'SET_PLANNING_TOPIC', topic }),
    setDor: (dor: string[]) => send({ type: 'SET_DOR', dor }),
    setDod: (dod: string[]) => send({ type: 'SET_DOD', dod }),
    takeSignal: (index: number) => send({ type: 'ACCEPT_SIGNAL', index }),
    setForecast: (ids: string[]) => send({ type: 'SET_FORECAST', ids }),
    agreeSprintGoal: (seat: string) => send({ type: 'AGREE_SPRINT_GOAL', seat }),
    spendDay: (seconds: number) => send({ type: 'SPEND_DAY', seconds }),
    plan: (ids: string[], refinementPoints?: number) => send({ type: 'PLAN_SPRINT', ids, refinementPoints }),
    holdRefinement: () => send({ type: 'HOLD_REFINEMENT' }),
    agreeDod: () => send({ type: 'AGREE_DOD' }),
    writeBacklog: (brief: ZooBrief) => send({ type: 'WRITE_BACKLOG', brief }),
    setGoalShape: (shape: GoalShape, goal: string, measures: GoalMeasure[]) => send({ type: 'SET_GOAL_FORM', shape, goal, measures }),
    startHere: (id: string, pos: { x: number; y: number }) => send({ type: 'START_ITEM_AT', id, pos }),
    planShape: (id: string, patch: { enclosureSize?: 'small' | 'medium' | 'large'; enclosureId?: string; template?: string }) => send({ type: 'PLAN_ITEM_SHAPE', id, patch }),
    estimate: (id: string, points: number) => send({ type: 'ESTIMATE_ITEM', id, points }),
    setTasks: (id: string, tasks: SprintTask[]) => send({ type: 'SET_TASKS', id, tasks }),
    toggleTask: (id: string, taskId: string) => send({ type: 'TOGGLE_TASK', id, taskId }),
    confirmAc: (id: string, index: number, value: boolean) => send({ type: 'CONFIRM_AC', id, index, value }),
    placeOnPark: (id: string) => send({ type: 'PLACE_ON_PARK', id }),
    saveDraftDesign: (id: string, design: ItemDesign) => send({ type: 'SET_DRAFT_DESIGN', id, design }),
    startItem: (id: string) => send({ type: 'START_ITEM', id }),
    toggleGoalCritical: (id: string) => send({ type: 'TOGGLE_GOAL_CRITICAL', id }),
    setSprintDays: (days: number) => send({ type: 'SET_SPRINT_DAYS', days }),
    setWipLimit: (limit: number) => send({ type: 'SET_WIP_LIMIT', limit }),
    setTeaching: (on: boolean) => send({ type: 'SET_TEACHING', on }),
    markTaught: (id: string) => send({ type: 'MARK_TAUGHT', id }),
    setLearnMode: (on: boolean) => send({ type: 'SET_LEARN_MODE', on }),
    setDailyScrumAt: (at: 'start' | 'end') => send({ type: 'SET_SCRUM_AT', at }),
    setEnclosureSize: (id: string, size: 'small' | 'medium' | 'large') => send({ type: 'SET_ENCLOSURE', id, size }),
    setItemPos: (id: string, pos: { x: number; y: number }) => send({ type: 'SET_POS', id, pos }),
    splitEpic: (id: string, memberIds: string[]) => send({ type: 'SPLIT_EPIC', id, memberIds }),
    createPbi: (draft: PbiDraft) => send({ type: 'ADD_PBI', draft }),
    declineProposal: (proposalId: string) => send({ type: 'DECLINE_PROPOSAL', proposalId }),
    refinePbi: (id: string, draft: PbiDraft) => send({ type: 'REFINE_PBI', id, draft }),
    reorder: (id: string, dir: 'up' | 'down') => send({ type: 'MOVE_ITEM', id, dir }),
    moveBefore: (id: string, beforeId: string) => send({ type: 'MOVE_ITEM_BEFORE', id, beforeId }),
    reorderSprint: (id: string, dir: 'up' | 'down') => send({ type: 'MOVE_SPRINT_ITEM', id, dir }),
    reorderForecast: (id: string, dir: 'up' | 'down', picked: string[]) => send({ type: 'MOVE_FORECAST_ITEM', id, dir, picked }),
    setUserStories: (on: boolean) => send({ type: 'SET_USE_USER_STORIES', on }),
    pull: (id: string) => send({ type: 'PULL_ITEM', id }),
    moveZone: (id: string, zone: string) => send({ type: 'MOVE_TO_ZONE', id, zone }),
    createZone: (name: string) => send({ type: 'ADD_ZONE', name }),
    renameZone: (oldName: string, newName: string) => send({ type: 'RENAME_ZONE', oldName, newName }),
    reorderZone: (id: string, dir: 'up' | 'down') => send({ type: 'REORDER_IN_ZONE', id, dir }),
    deletePbi: (id: string) => send({ type: 'DELETE_PBI', id }),
    duplicatePbi: (id: string) => send({ type: 'DUPLICATE_PBI', id }),
    assignDev: (itemId: string, devId: string) => send({ type: 'ASSIGN_DEV', itemId, devId }),
    renameMember: (memberId: string, name: string) => send({ type: 'RENAME_MEMBER', memberId, name }),
    moveZoneOrder: (zone: string, dir: 'up' | 'down') => send({ type: 'MOVE_ZONE', zone, dir }),
    setPathStyle: (style: string) => send({ type: 'SET_PATH_STYLE', style }),
    setPathRoute: (route: 'straight' | 'elbow' | 'spine' | 'none') => send({ type: 'SET_PATH_ROUTE', route }),
    addPath: (points: { x: number; y: number }[]) => send({ type: 'ADD_PATH', points }),
    deletePath: (id: string) => send({ type: 'DELETE_PATH', id }),
    clearPaths: () => send({ type: 'CLEAR_PATHS' }),
    addConnector: (connector: ZooConnector) => send({ type: 'ADD_CONNECTOR', connector }),
    updateConnector: (id: string, patch: Partial<ZooConnector>) => send({ type: 'UPDATE_CONNECTOR', id, patch }),
    deleteConnector: (id: string) => send({ type: 'DELETE_CONNECTOR', id }),
    build: (id: string, design?: ItemDesign) => send({ type: 'BUILD_ITEM', id, design }),
    editBuild: (id: string, design: ItemDesign) => send({ type: 'EDIT_ITEM', id, design }),
    addAnotherPbi: (id: string) => send({ type: 'ADD_ANOTHER', id }),
    improve: (id: string) => send({ type: 'IMPROVE_ITEM', id }),
    setItemSpot: (id: string, spot: { x: number; y: number }) => send({ type: 'SET_ITEM_SPOT', id, spot }),
    setMemberSpot: (id: string, member: number, spot: { x: number; y: number }) => send({ type: 'SET_MEMBER_SPOT', id, member, spot }),
    setItemSize: (id: string, size: { w: number; h: number }) => send({ type: 'SET_ITEM_SIZE', id, size }),
    addCopy: (id: string, at: { x: number; y: number }, piece?: string) => send({ type: 'ADD_COPY', id, at, piece }),
    setCopyPiece: (id: string, index: number, piece: string) => send({ type: 'SET_COPY_PIECE', id, index, piece }),
    moveCopy: (id: string, index: number, pos: { x: number; y: number }) => send({ type: 'MOVE_COPY', id, index, pos }),
    removeCopy: (id: string, index: number) => send({ type: 'REMOVE_COPY', id, index }),
    setItemRot: (id: string, rot: number) => send({ type: 'SET_ROT', id, rot }),
    nestItem: (id: string, enclosureId: string, spot: { x: number; y: number }) => send({ type: 'NEST_ITEM', id, enclosureId, spot }),
    unnestItem: (id: string) => send({ type: 'UNNEST_ITEM', id }),
    renameItem: (id: string, name: string) => send({ type: 'RENAME_ITEM', id, name }),
    open: (id: string) => send({ type: 'OPEN_ITEM', id }),
    closeDay: () => send({ type: 'END_DAY' }),
    tickDay: () => send({ type: 'TICK_DAY' }),
    tickScrum: () => send({ type: 'TICK_SCRUM' }),
    holdDailyScrum: () => send({ type: 'RUN_DAILY_SCRUM' }),
    skipDailyScrum: () => send({ type: 'SKIP_DAILY_SCRUM' }),
    beginDay: () => send({ type: 'START_DAY' }),
    cancelSprint: () => send({ type: 'CANCEL_SPRINT' }),
    review: () => send({ type: 'REVIEW_SPRINT' }),
    nextSprint: (improvement: string) => send({ type: 'NEXT_SPRINT', improvement }),
    finish: () => send({ type: 'END_GAME' }),
    loadGame: (loaded: ZooGameState) => send({ type: 'LOAD_GAME', state: loaded }),
    poRefine: (decisions: PoDecisions) => send({ type: 'PO_REFINE', decisions }),
    reset: () => send({ type: 'RESET' }),
  };
}

/** The whole action surface, so a screen can take it from either carrier. */
export type ZooActions = ReturnType<typeof zooActions>;

/** A playable game: the state and everything you can do to it. useZooGame satisfies this
 *  directly; useZooSession does once its state has loaded. The screens take this rather than
 *  calling a hook themselves, which is what lets the same screens serve a game played alone
 *  and a game played by a team. */
export type ZooGameApi = { state: ZooGameState } & ZooActions;
