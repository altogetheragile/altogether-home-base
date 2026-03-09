import { useState, useCallback } from 'react';

const MAX_HISTORY = 50;

export function useCanvasHistory<T>(initialState: T[]) {
  const [items, setItems] = useState<T[]>(initialState);
  const [history, setHistory] = useState<T[][]>([initialState]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const updateWithHistory = useCallback((newItems: T[]) => {
    setItems(newItems);
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(newItems);
      return newHistory.slice(-MAX_HISTORY);
    });
    setHistoryIndex(prev => Math.min(prev + 1, MAX_HISTORY - 1));
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (canUndo) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setItems(history[newIndex]);
    }
  }, [canUndo, history, historyIndex]);

  const redo = useCallback(() => {
    if (canRedo) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setItems(history[newIndex]);
    }
  }, [canRedo, history, historyIndex]);

  // Allow resetting history (used for migrations)
  const resetHistory = useCallback((newItems: T[]) => {
    setItems(newItems);
    setHistory([newItems]);
    setHistoryIndex(0);
  }, []);

  return {
    items,
    setItems,
    updateWithHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    resetHistory,
  };
}
