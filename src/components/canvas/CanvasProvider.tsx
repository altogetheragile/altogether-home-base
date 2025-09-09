import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { CanvasData, CanvasElement } from './BaseCanvas';
import { isTypingInInputField } from '@/utils/inputDetection';

interface CanvasContextType {
  canvasData: CanvasData;
  isEditable: boolean;
  isCollaborative: boolean;
  activeUsers: Array<{ id: string; name: string; cursor?: { x: number; y: number } }>;
  selectedElements: string[];
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  addElement: (element: Omit<CanvasElement, 'id'>) => void;
  removeElement: (id: string) => void;
  selectElements: (ids: string[]) => void;
  setCanvasData: (data: CanvasData) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const CanvasContext = createContext<CanvasContextType | null>(null);

export const useCanvas = () => {
  const context = useContext(CanvasContext);
  if (!context) {
    throw new Error('useCanvas must be used within a CanvasProvider');
  }
  return context;
};

interface CanvasProviderProps {
  children: React.ReactNode;
  initialData?: CanvasData;
  isEditable?: boolean;
  isCollaborative?: boolean;
  onDataChange?: (data: CanvasData) => void;
}

export const CanvasProvider: React.FC<CanvasProviderProps> = ({
  children,
  initialData = { elements: [] },
  isEditable = false,
  isCollaborative = false,
  onDataChange,
}) => {
  const [canvasData, setCanvasDataState] = useState<CanvasData>(initialData);
  const [selectedElements, setSelectedElements] = useState<string[]>([]);
  const [activeUsers, setActiveUsers] = useState<Array<{ id: string; name: string; cursor?: { x: number; y: number } }>>([]);
  const [history, setHistory] = useState<CanvasData[]>([initialData]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const addToHistory = useCallback((data: CanvasData) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(data);
      return newHistory.slice(-50); // Keep last 50 states
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [historyIndex]);

  const setCanvasData = useCallback((data: CanvasData) => {
    setCanvasDataState(data);
    addToHistory(data);
    onDataChange?.(data);
  }, [addToHistory, onDataChange]);

  const updateElement = useCallback((id: string, updates: Partial<CanvasElement>) => {
    if (!isEditable) return;

    const newData = {
      ...canvasData,
      elements: canvasData.elements.map(el => 
        el.id === id ? { ...el, ...updates } : el
      ),
    };
    setCanvasData(newData);
  }, [canvasData, isEditable, setCanvasData]);

  const addElement = useCallback((element: Omit<CanvasElement, 'id'>) => {
    if (!isEditable) return;

    const newElement: CanvasElement = {
      ...element,
      id: `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    const newData = {
      ...canvasData,
      elements: [...canvasData.elements, newElement],
    };
    setCanvasData(newData);
  }, [canvasData, isEditable, setCanvasData]);

  const removeElement = useCallback((id: string) => {
    if (!isEditable) return;

    const newData = {
      ...canvasData,
      elements: canvasData.elements.filter(el => el.id !== id),
    };
    setCanvasData(newData);
    setSelectedElements(prev => prev.filter(selectedId => selectedId !== id));
  }, [canvasData, isEditable, setCanvasData]);

  const selectElements = useCallback((ids: string[]) => {
    setSelectedElements(ids);
  }, []);

  const undo = useCallback(() => {
    if (canUndo) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const previousData = history[newIndex];
      setCanvasDataState(previousData);
      onDataChange?.(previousData);
    }
  }, [canUndo, history, historyIndex, onDataChange]);

  const redo = useCallback(() => {
    if (canRedo) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const nextData = history[newIndex];
      setCanvasDataState(nextData);
      onDataChange?.(nextData);
    }
  }, [canRedo, history, historyIndex, onDataChange]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only process canvas shortcuts when NOT typing in input fields
      if (!isTypingInInputField() && (e.ctrlKey || e.metaKey)) {
        switch (e.key) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
            break;
          case 'y':
            e.preventDefault();
            redo();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const contextValue: CanvasContextType = {
    canvasData,
    isEditable,
    isCollaborative,
    activeUsers,
    selectedElements,
    updateElement,
    addElement,
    removeElement,
    selectElements,
    setCanvasData,
    undo,
    redo,
    canUndo,
    canRedo,
  };

  return (
    <CanvasContext.Provider value={contextValue}>
      {children}
    </CanvasContext.Provider>
  );
};