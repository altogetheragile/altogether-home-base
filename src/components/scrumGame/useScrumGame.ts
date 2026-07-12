import { useReducer, useCallback } from 'react';
import type { ScrumState, ScrumAction } from './types';
import { initialScrumState } from './config';

// Scaffold reducer. The Sprint loop (planning -> daily execution -> review ->
// retro) is built out in later slices; for now this drives the intro and phase
// navigation so the shell is real and deployable.
function reducer(state: ScrumState, action: ScrumAction): ScrumState {
  switch (action.type) {
    case 'START':
      return { ...state, phase: 'planning' };
    case 'SET_PHASE':
      return { ...state, phase: action.phase };
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
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  return { state, start, setPhase, reset };
}
