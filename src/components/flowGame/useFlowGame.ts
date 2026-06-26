import { useReducer, useCallback } from 'react';
import type { GameState, GameAction, RoundState, Specialism } from './types';
import { createItems, simulateDay, calculateMetrics, applyDayBlockers } from './engine';
import { DAYS_PER_ROUND, WORKERS, DEFAULT_WIP_LIMITS, pullTarget, stageOf, stageCount } from './config';

function createRound(roundNumber: 1 | 2, wipLimits?: Record<Specialism, number>): RoundState {
  return {
    roundNumber,
    day: 1,
    items: createItems(),
    assignments: [],
    dayHistory: [],
    // Limits are always editable; round 1 starts with them OFF (the chaos baseline),
    // round 2 enforces the limits the player set. Either can be toggled in play.
    wipLimits: wipLimits ?? { ...DEFAULT_WIP_LIMITS },
    enforceWip: roundNumber === 2,
    dayPhase: 'assign',
  };
}

const initialState: GameState = {
  phase: 'intro',
  round: null,
  round1Metrics: null,
  round2Metrics: null,
};

function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_ROUND': {
      // Everything starts in the backlog — the PLAYER pulls work in (no auto-pull).
      const round = createRound(action.roundNumber, action.wipLimits);
      const phase = action.roundNumber === 1 ? 'playing-round-1' : 'playing-round-2';
      return { ...state, phase, round };
    }

    case 'PULL_ITEM': {
      if (!state.round || state.round.dayPhase !== 'assign') return state;
      const item = state.round.items.find((i) => i.id === action.cardId);
      if (!item) return state;
      const dest = pullTarget(item.column);
      if (!dest) return state; // not a pullable position
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
      const items = state.round.items.map((i) => {
        if (i.id !== action.cardId) return i;
        const next = { ...i, column: dest };
        if (i.column === 'backlog') next.startDay = day; // first time it enters flow
        if (dest === 'done') next.endDay = day;
        return next;
      });
      return { ...state, round: { ...state.round, items } };
    }

    case 'SET_WIP': {
      if (!state.round) return state;
      const base = state.round.wipLimits ?? { analysis: 3, development: 3, test: 3 };
      const value = Math.max(1, Math.min(20, action.value));
      return { ...state, round: { ...state.round, wipLimits: { ...base, [action.stage]: value } } };
    }

    case 'SET_ENFORCE_WIP': {
      if (!state.round) return state;
      return { ...state, round: { ...state.round, enforceWip: action.enforce } };
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
        },
      };
    }

    case 'NEXT_DAY': {
      if (!state.round || state.round.dayPhase !== 'results') return state;
      const nextDay = state.round.day + 1;

      // Round over?
      if (state.round.day >= DAYS_PER_ROUND) {
        const metrics = calculateMetrics(state.round.dayHistory, state.round.items, DAYS_PER_ROUND);
        if (state.round.roundNumber === 1) {
          return { ...state, phase: 'metrics-round-1', round1Metrics: metrics };
        }
        return { ...state, phase: 'metrics-final', round2Metrics: metrics };
      }

      // No auto-pull — the player pulls work in during the assignment phase.
      // Just roll the day forward and surface new blockers on active work.
      const items = state.round.items.map((item) => ({ ...item }));
      const roundForBlockers: RoundState = { ...state.round, day: nextDay, items };
      const { items: blockedItems } = applyDayBlockers(roundForBlockers);

      return {
        ...state,
        round: {
          ...state.round,
          day: nextDay,
          items: blockedItems,
          assignments: [],
          dayPhase: 'assign',
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

    case 'SET_PHASE':
      return { ...state, phase: action.phase };

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
  const setWip = useCallback((stage: Specialism, value: number) => dispatch({ type: 'SET_WIP', stage, value }), []);
  const setEnforceWip = useCallback((enforce: boolean) => dispatch({ type: 'SET_ENFORCE_WIP', enforce }), []);
  const runDay = useCallback(() => dispatch({ type: 'RUN_DAY' }), []);
  const nextDay = useCallback(() => dispatch({ type: 'NEXT_DAY' }), []);

  const startRound = useCallback(
    (roundNumber: 1 | 2, wipLimits?: Record<Specialism, number>) =>
      dispatch({ type: 'START_ROUND', roundNumber, wipLimits }),
    []
  );

  const setPhase = useCallback(
    (phase: GameState['phase']) => dispatch({ type: 'SET_PHASE', phase }),
    []
  );

  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  const getUnassignedWorkers = useCallback(() => {
    if (!state.round) return WORKERS;
    const assignedIds = new Set(state.round.assignments.map((a) => a.workerId));
    return WORKERS.filter((w) => !assignedIds.has(w.id));
  }, [state.round]);

  return {
    state,
    pullItem,
    setWip,
    setEnforceWip,
    assignWorker,
    unassignWorker,
    runDay,
    nextDay,
    startRound,
    setPhase,
    reset,
    getUnassignedWorkers,
  };
}
