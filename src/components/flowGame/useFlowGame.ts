import { useReducer, useCallback } from 'react';
import type { GameState, GameAction, RoundState, Specialism, Prediction, WorkerAssignment, WorkItem, WorkerDef, StageDef, Workflow, StartScenario } from './types';
import { createItems, simulateDay, calculateMetrics, applyDayBlockers, pullQualityOutcome } from './engine';
import { DAYS_PER_ROUND, defaultWipLimits, initialWipLimits, DEFAULT_WORKFLOW, FLOW_SEED, pullTarget, stageOf, laneOf, stageCount, exitCriteriaMet } from './config';

/** Which worker assignments carry over to the next day: only those whose card is
 *  still being worked (in an Active lane). A worker is freed when their card
 *  finishes its stage (moves to a Done lane) or reaches Done - never just because
 *  a new day began. */
export function keepActiveAssignments(assignments: WorkerAssignment[], items: WorkItem[]): WorkerAssignment[] {
  return assignments.filter((a) => {
    const it = items.find((i) => i.id === a.cardId);
    return !!it && laneOf(it.column) === 'active';
  });
}

function createRound(
  roundNumber: 1 | 2,
  wipLimits?: Record<Specialism, number>,
  scenario: StartScenario = 'empty',
  workers: WorkerDef[] = DEFAULT_WORKFLOW.workers,
  stages: StageDef[] = DEFAULT_WORKFLOW.stages,
): RoundState {
  return {
    roundNumber,
    day: 1,
    items: createItems(scenario, stages),
    assignments: [],
    dayHistory: [],
    // Limits are always editable; round 1 starts with them unenforced (the chaos
    // baseline) or, for a struggling team, absent entirely; round 2 enforces the
    // limits the player set. Either can be toggled in play.
    wipLimits: initialWipLimits(roundNumber, scenario, stages, wipLimits),
    enforceWip: roundNumber === 2,
    maximizeWip: false,
    // Exit-criteria gate starts off (like WIP): the player turns it on to make
    // the quality bar bite, which is the teaching moment.
    enforceExitCriteria: false,
    seed: FLOW_SEED,
    dayPhase: 'assign',
    newBlockers: [],
    workers,
    stages,
  };
}

const initialState: GameState = {
  phase: 'intro',
  round: null,
  round1Metrics: null,
  round2Metrics: null,
  prediction: null,
  startScenario: 'empty',
  workflow: DEFAULT_WORKFLOW,
};

/** Backfill config fields that pre-configurable-board saves lack, so an older
 *  saved game (no workflow, or a round without stages/workers) still loads. */
function withWorkflowDefaults(state: GameState): GameState {
  const workflow = state.workflow ?? DEFAULT_WORKFLOW;
  // Map pre-scenario saves (which had a boolean `warmStart`) onto the scenario.
  const legacyWarmStart = (state as unknown as { warmStart?: boolean }).warmStart;
  const startScenario: StartScenario = state.startScenario ?? (legacyWarmStart ? 'healthy' : 'empty');
  let round = state.round;
  if (round) {
    // Stages saved before exit criteria existed have no `exitCriteria` array.
    const stages = (round.stages ?? workflow.stages).map((s) => ({ ...s, exitCriteria: s.exitCriteria ?? [] }));
    round = {
      ...round,
      stages,
      workers: round.workers ?? workflow.workers,
      // Ensure every stage has a WIP limit — a custom stage saved before this fix
      // (or added to an in-flight round) would otherwise show no limit or editor.
      wipLimits: round.wipLimits ? { ...defaultWipLimits(stages), ...round.wipLimits } : round.wipLimits,
      enforceExitCriteria: round.enforceExitCriteria ?? false,
      // Items saved before exit criteria / the debt loop lack these fields.
      items: round.items.map((i) => ({ ...i, metCriteria: i.metCriteria ?? [], debt: i.debt ?? 0, rework: i.rework ?? false })),
    };
  }
  const wfStages = workflow.stages.map((s) => ({ ...s, exitCriteria: s.exitCriteria ?? [] }));
  return { ...state, workflow: { ...workflow, stages: wfStages }, round, startScenario };
}

function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_ROUND': {
      // Round 1 sets the start scenario; Round 2 reuses it so both rounds start
      // from the same board and the comparison stays fair.
      const startScenario = action.roundNumber === 1 ? action.scenario ?? 'empty' : state.startScenario;
      const round = createRound(action.roundNumber, action.wipLimits, startScenario, state.workflow.workers, state.workflow.stages);
      const phase = action.roundNumber === 1 ? 'playing-round-1' : 'playing-round-2';
      return { ...state, phase, round, startScenario };
    }

    case 'PULL_ITEM': {
      if (!state.round || state.round.dayPhase !== 'assign') return state;
      const item = state.round.items.find((i) => i.id === action.cardId);
      if (!item) return state;
      const dest = pullTarget(item.column, state.round.stages);
      if (!dest) return state; // not a pullable position
      // Exit-criteria gate: when enforced, an item can't leave a stage until that
      // stage's criteria are all ticked. When NOT enforced, it can leave with
      // criteria unmet, but each skipped one accrues quality debt (Phase 2).
      const sourceStage = state.round.stages.find((s) => s.id === stageOf(item.column));
      if (state.round.enforceExitCriteria && !exitCriteriaMet(item, sourceStage)) {
        return state; // meet the exit criteria before moving this on
      }
      // WIP limit: a stage's Active+Done together can't exceed its limit — but only
      // when enforcement is on (the player can toggle it, TWiG-style).
      const destStage = stageOf(dest);
      const limits = state.round.wipLimits;
      if (
        state.round.enforceWip && destStage && limits &&
        stageCount(state.round.items, destStage) >= limits[destStage]
      ) {
        return state; // stage full — finish something before starting more
      }
      const day = state.round.day;
      const stages = state.round.stages;
      const enforce = state.round.enforceExitCriteria;
      const items = state.round.items.map((i) => {
        if (i.id !== action.cardId) return i;
        // Skipped criteria accrue debt; debt surfaces as rework at the last stage.
        const quality = pullQualityOutcome(i, sourceStage, dest, stages, enforce);
        // New stage, fresh gate: clear the ticked criteria from the stage it leaves.
        const next = { ...i, column: dest, metCriteria: [], ...quality };
        if (i.column === 'backlog') next.startDay = day; // first time it enters flow
        if (dest === 'done') next.endDay = day;
        return next;
      });
      return { ...state, round: { ...state.round, items } };
    }

    case 'REORDER_ITEM': {
      if (!state.round) return state;
      const items = [...state.round.items];
      const ai = items.findIndex((i) => i.id === action.activeId);
      const oi = items.findIndex((i) => i.id === action.overId);
      if (ai < 0 || oi < 0 || ai === oi) return state;
      if (items[ai].column !== items[oi].column) return state; // reorder within a lane only
      const [moved] = items.splice(ai, 1);
      const dest = items.findIndex((i) => i.id === action.overId);
      items.splice(dest, 0, moved);
      return { ...state, round: { ...state.round, items } };
    }

    case 'SET_WIP': {
      if (!state.round) return state;
      const base = state.round.wipLimits ?? { analysis: 3, development: 3, test: 3 };
      const value = Math.max(1, Math.min(20, action.value));
      return { ...state, round: { ...state.round, wipLimits: { ...base, [action.stage]: value } } };
    }

    case 'SET_USE_WIP': {
      // Turn WIP limits on (restore the default per stage) or off entirely (null -
      // uncapped columns, no editors). With no limits, enforce/maximize are moot.
      if (!state.round) return state;
      const wipLimits = action.use ? defaultWipLimits(state.round.stages) : null;
      return {
        ...state,
        round: {
          ...state.round,
          wipLimits,
          enforceWip: action.use && state.round.enforceWip,
          maximizeWip: action.use && state.round.maximizeWip,
        },
      };
    }

    case 'SET_ENFORCE_WIP': {
      if (!state.round) return state;
      return { ...state, round: { ...state.round, enforceWip: action.enforce } };
    }

    case 'SET_ENFORCE_EXIT_CRITERIA': {
      if (!state.round) return state;
      return { ...state, round: { ...state.round, enforceExitCriteria: action.enforce } };
    }

    case 'TOGGLE_CRITERION': {
      if (!state.round) return state;
      const items = state.round.items.map((i) => {
        if (i.id !== action.cardId) return i;
        const met = i.metCriteria.includes(action.criterionId)
          ? i.metCriteria.filter((c) => c !== action.criterionId)
          : [...i.metCriteria, action.criterionId];
        return { ...i, metCriteria: met };
      });
      return { ...state, round: { ...state.round, items } };
    }

    case 'SET_MAXIMIZE_WIP': {
      if (!state.round) return state;
      return { ...state, round: { ...state.round, maximizeWip: action.maximize } };
    }

    case 'ASSIGN_WORKER': {
      if (!state.round) return state;
      const existing = state.round.assignments.find((a) => a.workerId === action.workerId);
      const assignments = existing
        ? state.round.assignments.map((a) =>
            a.workerId === action.workerId ? { ...a, cardId: action.cardId } : a
          )
        : [...state.round.assignments, { workerId: action.workerId, cardId: action.cardId }];
      return { ...state, round: { ...state.round, assignments } };
    }

    case 'UNASSIGN_WORKER': {
      if (!state.round) return state;
      return {
        ...state,
        round: {
          ...state.round,
          assignments: state.round.assignments.filter((a) => a.workerId !== action.workerId),
        },
      };
    }

    case 'RUN_DAY': {
      if (!state.round || state.round.dayPhase !== 'assign') return state;
      const { items, summary } = simulateDay(state.round);
      return {
        ...state,
        round: {
          ...state.round,
          items,
          dayHistory: [...state.round.dayHistory, summary],
          dayPhase: 'results',
          newBlockers: [], // consumed — the day has been run
        },
      };
    }

    case 'NEXT_DAY': {
      if (!state.round || state.round.dayPhase !== 'results') return state;
      const nextDay = state.round.day + 1;

      // Round over?
      if (state.round.day >= DAYS_PER_ROUND) {
        const metrics = calculateMetrics(state.round.dayHistory, state.round.items, DAYS_PER_ROUND, state.round.stages);
        if (state.round.roundNumber === 1) {
          return { ...state, phase: 'metrics-round-1', round1Metrics: metrics };
        }
        return { ...state, phase: 'metrics-final', round2Metrics: metrics };
      }

      // No auto-pull — the player pulls work in during the assignment phase.
      // Just roll the day forward and surface new blockers on active work.
      const items = state.round.items.map((item) => ({ ...item }));
      const roundForBlockers: RoundState = { ...state.round, day: nextDay, items };
      const { items: blockedItems, blockedIds } = applyDayBlockers(roundForBlockers);

      // Workers stay on their card across days — no need to reallocate every day.
      const keptAssignments = keepActiveAssignments(state.round.assignments, blockedItems);

      return {
        ...state,
        round: {
          ...state.round,
          day: nextDay,
          items: blockedItems,
          assignments: keptAssignments,
          dayPhase: 'assign',
          newBlockers: blockedIds, // surfaced as a start-of-day alert
        },
      };
    }

    case 'END_ROUND': {
      if (!state.round) return state;
      if (state.round.roundNumber === 1) {
        return { ...state, phase: 'metrics-round-1', round1Metrics: action.metrics };
      }
      return { ...state, phase: 'metrics-final', round2Metrics: action.metrics };
    }

    case 'SET_PREDICTION':
      return { ...state, prediction: action.prediction };

    case 'SET_PHASE':
      return { ...state, phase: action.phase };

    case 'SET_WORKFLOW':
      // Only meaningful before a round starts (edited on the intro screen); the
      // running round already carries its own copy of the stages and workers.
      return { ...state, workflow: action.workflow };

    case 'SET_ROSTER': {
      // In-game team edit: update the live round's roster and the workflow (so the
      // change carries to Round 2), and free any card held by a removed worker.
      const roster = action.workers;
      const ids = new Set(roster.map((w) => w.id));
      const workflow = { ...state.workflow, workers: roster };
      if (!state.round) return { ...state, workflow };
      const round = {
        ...state.round,
        workers: roster,
        assignments: state.round.assignments.filter((a) => ids.has(a.workerId)),
      };
      return { ...state, workflow, round };
    }

    case 'LOAD_GAME':
      // Replace the whole game with a loaded save. The state is a single
      // serialisable object, so this restores the board, day, metrics and seed.
      // Backfill config that older saves predate (workflow / round stages+workers)
      // so a game saved before the board became configurable still resumes.
      return withWorkflowDefaults(action.state);

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

export function useFlowGame() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const assignWorker = useCallback(
    (workerId: string, cardId: string) => dispatch({ type: 'ASSIGN_WORKER', workerId, cardId }),
    []
  );

  const unassignWorker = useCallback(
    (workerId: string) => dispatch({ type: 'UNASSIGN_WORKER', workerId }),
    []
  );

  const pullItem = useCallback((cardId: string) => dispatch({ type: 'PULL_ITEM', cardId }), []);
  const reorderItem = useCallback((activeId: string, overId: string) => dispatch({ type: 'REORDER_ITEM', activeId, overId }), []);
  const setWip = useCallback((stage: Specialism, value: number) => dispatch({ type: 'SET_WIP', stage, value }), []);
  const setUseWip = useCallback((use: boolean) => dispatch({ type: 'SET_USE_WIP', use }), []);
  const setEnforceWip = useCallback((enforce: boolean) => dispatch({ type: 'SET_ENFORCE_WIP', enforce }), []);
  const setMaximizeWip = useCallback((maximize: boolean) => dispatch({ type: 'SET_MAXIMIZE_WIP', maximize }), []);
  const setEnforceExitCriteria = useCallback((enforce: boolean) => dispatch({ type: 'SET_ENFORCE_EXIT_CRITERIA', enforce }), []);
  const toggleCriterion = useCallback((cardId: string, criterionId: string) => dispatch({ type: 'TOGGLE_CRITERION', cardId, criterionId }), []);
  const runDay = useCallback(() => dispatch({ type: 'RUN_DAY' }), []);
  const nextDay = useCallback(() => dispatch({ type: 'NEXT_DAY' }), []);

  const startRound = useCallback(
    (roundNumber: 1 | 2, wipLimits?: Record<Specialism, number>, scenario?: StartScenario) =>
      dispatch({ type: 'START_ROUND', roundNumber, wipLimits, scenario }),
    []
  );

  const setPhase = useCallback(
    (phase: GameState['phase']) => dispatch({ type: 'SET_PHASE', phase }),
    []
  );

  const setPrediction = useCallback(
    (prediction: Prediction) => dispatch({ type: 'SET_PREDICTION', prediction }),
    []
  );

  const setWorkflow = useCallback((workflow: Workflow) => dispatch({ type: 'SET_WORKFLOW', workflow }), []);

  const setRoster = useCallback((workers: WorkerDef[]) => dispatch({ type: 'SET_ROSTER', workers }), []);

  const loadGame = useCallback((s: GameState) => dispatch({ type: 'LOAD_GAME', state: s }), []);

  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  const getUnassignedWorkers = useCallback(() => {
    const roster = state.round?.workers ?? state.workflow.workers;
    if (!state.round) return roster;
    const assignedIds = new Set(state.round.assignments.map((a) => a.workerId));
    return roster.filter((w) => !assignedIds.has(w.id));
  }, [state.round, state.workflow.workers]);

  return {
    state,
    pullItem,
    reorderItem,
    setWip,
    setUseWip,
    setEnforceWip,
    setMaximizeWip,
    setEnforceExitCriteria,
    toggleCriterion,
    assignWorker,
    unassignWorker,
    runDay,
    nextDay,
    startRound,
    setPhase,
    setPrediction,
    setWorkflow,
    setRoster,
    loadGame,
    reset,
    getUnassignedWorkers,
  };
}
