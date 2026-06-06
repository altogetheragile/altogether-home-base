import { useState, useRef, useCallback, useEffect, useMemo, type MouseEvent as ReactMouseEvent } from 'react';

interface CanvasElementBase {
  id: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

interface SelectionBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

interface UseCanvasInteractionParams<T extends CanvasElementBase> {
  elements: T[];
  updateElementsWithHistory: (elements: T[]) => void;
  undo: () => void;
  redo: () => void;
  /** Returns true when a mousedown should start a marquee (i.e. it landed on the canvas background). */
  isBackgroundClick: (e: ReactMouseEvent) => boolean;
}

/**
 * Shared canvas interaction logic for the modelling canvases: selection state,
 * zoom, marquee box-select, multi-element group drag, visual positioning during
 * drag, dynamic canvas bounds, and keyboard shortcuts (undo/redo/select-all/escape).
 *
 * Extracted verbatim from the previously duplicated implementations in
 * AIToolsCanvas and ProjectModellingCanvas; the only behavioural difference
 * between them — how a "background" click is detected — is injected via
 * isBackgroundClick. Generic over the element type so each canvas keeps its own
 * CanvasElement shape.
 */
export function useCanvasInteraction<T extends CanvasElementBase>({
  elements,
  updateElementsWithHistory,
  undo,
  redo,
  isBackgroundClick,
}: UseCanvasInteractionParams<T>) {
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);
  const [zoom, setZoom] = useState(1);

  // Marquee selection state
  const [isMarqueeSelecting, setIsMarqueeSelecting] = useState(false);
  const [marqueeStart, setMarqueeStart] = useState({ x: 0, y: 0 });
  const [marqueeEnd, setMarqueeEnd] = useState({ x: 0, y: 0 });

  // Group drag state (real-time visual movement of a multi-selection)
  const [isDraggingGroup, setIsDraggingGroup] = useState(false);
  const [groupDragDelta, setGroupDragDelta] = useState({ dx: 0, dy: 0 });

  const canvasRef = useRef<HTMLDivElement>(null);
  const wasMarqueeSelectingRef = useRef(false);

  const handleGroupDragStart = useCallback(() => {
    if (selectedElementIds.length > 1) {
      setIsDraggingGroup(true);
      setGroupDragDelta({ dx: 0, dy: 0 });
    }
  }, [selectedElementIds.length]);

  const handleGroupDragProgress = useCallback((delta: { dx: number; dy: number }) => {
    if (selectedElementIds.length > 1) {
      let minX = Infinity, minY = Infinity;
      elements.forEach(el => {
        if (selectedElementIds.includes(el.id)) {
          minX = Math.min(minX, el.position.x);
          minY = Math.min(minY, el.position.y);
        }
      });
      setGroupDragDelta({
        dx: Math.max(delta.dx, -minX),
        dy: Math.max(delta.dy, -minY),
      });
    }
  }, [selectedElementIds, elements]);

  const handleGroupMove = useCallback((_draggedId: string, delta: { dx: number; dy: number }) => {
    setIsDraggingGroup(false);
    setGroupDragDelta({ dx: 0, dy: 0 });

    let minX = Infinity, minY = Infinity;
    elements.forEach(el => {
      if (selectedElementIds.includes(el.id)) {
        minX = Math.min(minX, el.position.x);
        minY = Math.min(minY, el.position.y);
      }
    });

    const clampedDelta = {
      dx: Math.max(delta.dx, -minX),
      dy: Math.max(delta.dy, -minY),
    };

    const updatedElements = elements.map(el => {
      if (selectedElementIds.includes(el.id)) {
        return {
          ...el,
          position: {
            x: el.position.x + clampedDelta.dx,
            y: el.position.y + clampedDelta.dy,
          },
        };
      }
      return el;
    });
    updateElementsWithHistory(updatedElements);
  }, [selectedElementIds, elements, updateElementsWithHistory]);

  const getVisualPosition = useCallback((element: T) => {
    if (isDraggingGroup && selectedElementIds.includes(element.id)) {
      return {
        x: element.position.x + groupDragDelta.dx,
        y: element.position.y + groupDragDelta.dy,
      };
    }
    return element.position;
  }, [isDraggingGroup, groupDragDelta, selectedElementIds]);

  const isElementInSelectionBox = useCallback((element: T, box: SelectionBox) => {
    const { x, y } = element.position;
    const { width, height } = element.size;
    return x < box.right && x + width > box.left && y < box.bottom && y + height > box.top;
  }, []);

  const handleCanvasMouseDown = useCallback((e: ReactMouseEvent) => {
    if (e.button !== 0) return;
    if (!isBackgroundClick(e)) return;

    canvasRef.current?.focus({ preventScroll: true });

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    setIsMarqueeSelecting(true);
    setMarqueeStart({ x, y });
    setMarqueeEnd({ x, y });

    if (!e.shiftKey) {
      setSelectedElementIds([]);
    }
  }, [zoom, isBackgroundClick]);

  const handleCanvasMouseMove = useCallback((e: ReactMouseEvent) => {
    if (!isMarqueeSelecting) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    setMarqueeEnd({ x, y });
  }, [isMarqueeSelecting, zoom]);

  const handleCanvasMouseUp = useCallback((e: ReactMouseEvent) => {
    if (!isMarqueeSelecting) return;

    wasMarqueeSelectingRef.current = true;
    setTimeout(() => { wasMarqueeSelectingRef.current = false; }, 0);

    const box = {
      left: Math.min(marqueeStart.x, marqueeEnd.x),
      top: Math.min(marqueeStart.y, marqueeEnd.y),
      right: Math.max(marqueeStart.x, marqueeEnd.x),
      bottom: Math.max(marqueeStart.y, marqueeEnd.y),
    };

    const marqueeWidth = box.right - box.left;
    const marqueeHeight = box.bottom - box.top;

    if (marqueeWidth > 5 || marqueeHeight > 5) {
      const newSelected = elements.filter(el => isElementInSelectionBox(el, box)).map(el => el.id);

      if (e.shiftKey) {
        setSelectedElementIds(prev => [...new Set([...prev, ...newSelected])]);
      } else {
        setSelectedElementIds(newSelected);
      }
    }

    setIsMarqueeSelecting(false);
  }, [isMarqueeSelecting, marqueeStart, marqueeEnd, elements, isElementInSelectionBox]);

  // Keyboard shortcuts: undo / redo / select-all / escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && ((e.key === 'z' && e.shiftKey) || e.key === 'y')) {
        e.preventDefault();
        redo();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        e.preventDefault();
        setSelectedElementIds(elements.map(el => el.id));
        return;
      }
      if (e.key === 'Escape') {
        setSelectedElementIds([]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [elements, undo, redo]);

  const handleZoomIn = useCallback(() => setZoom(prev => Math.min(prev + 0.1, 2)), []);
  const handleZoomOut = useCallback(() => setZoom(prev => Math.max(prev - 0.1, 0.5)), []);

  const canvasBounds = useMemo(() => {
    const MIN_WIDTH = 2000, MIN_HEIGHT = 1500, PADDING = 500;
    if (elements.length === 0) return { width: MIN_WIDTH, height: MIN_HEIGHT };
    let maxX = 0, maxY = 0;
    elements.forEach(el => {
      maxX = Math.max(maxX, el.position.x + el.size.width);
      maxY = Math.max(maxY, el.position.y + el.size.height);
    });
    return { width: Math.max(MIN_WIDTH, maxX + PADDING), height: Math.max(MIN_HEIGHT, maxY + PADDING) };
  }, [elements]);

  return {
    selectedElementIds,
    setSelectedElementIds,
    zoom,
    setZoom,
    handleZoomIn,
    handleZoomOut,
    isMarqueeSelecting,
    setIsMarqueeSelecting,
    marqueeStart,
    marqueeEnd,
    isDraggingGroup,
    groupDragDelta,
    canvasRef,
    wasMarqueeSelectingRef,
    handleGroupDragStart,
    handleGroupDragProgress,
    handleGroupMove,
    getVisualPosition,
    isElementInSelectionBox,
    handleCanvasMouseDown,
    handleCanvasMouseMove,
    handleCanvasMouseUp,
    canvasBounds,
  };
}
