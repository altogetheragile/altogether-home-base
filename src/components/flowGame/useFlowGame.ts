import { useReducer, useCallback } from 'react';
import type { GameState, GameAction, RoundState, Specialism } from './types';
import { createItems, simulateDay, calculateMetrics, applyDayBlockers } from './engine';
import { DAYS_PER_ROUND, WORKERS } from './config';

function createRound(roundNumber: 1 | 2, wipLimits?: Record<Specialism, number>): RoundState {
  return {
    roundNumber,
    day: 1,
    items: createItems(),
    assignments: [],
    dayHistory: [],
    wipLimits: wipLimits ?? null,
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
      const round = createRound(action.roundNumber, action.wipLimits);
      // Pull first few items into analysis
      let pullCount = action.wipLimits ? action.wipLimits.analysis : 3;
      pullCount = Math.min(pullCount, round.items.length);
      for (let i = 0; i < pullCount; i++) {
        round.items[i].column = 'analysis';
        round.items[i].startDay = 1;
      }
      // Apply blockers for day 1 so the player sees them before assigning
      const { items: blockedItems } = applyDayBlockers({ ...round, items: round.items });
      round.items = blockedItems;
      const phase = action.roundNumber === 1 ? 'playing-round-1' : 'playing-round-2';
      return { ...state, phase, round };
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

      // Pull items from backlog into analysis where there's space
      const items = state.round.items.map((item) => ({ ...item }));
      const wipLimits = state.round.wipLimits;

      const backlogItems = items.filter((i) => i.column === 'backlog');
      const analysisCount = items.filter((i) => i.column === 'analysis').length;
      // No WIP limits (round 1): pull up to 3 per day so WIP balloons
      // With WIP limits: respect the limit
      const maxPull = wipLimits
        ? Math.max(0, wipLimits.analysis - analysisCount)
        : Math.max(0, 3);
      const pullCount = Math.min(maxPull, backlogItems.length);
      for (let i = 0; i < pullCount; i++) {
        backlogItems[i].column = 'analysis';
        backlogItems[i].startDay = nextDay;
      }

      // Apply blockers for the new day so the player sees them before assigning
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
