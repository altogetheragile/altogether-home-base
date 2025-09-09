import React, { useState, useCallback } from 'react';

interface SelectionBoxProps {
  onSelection: (bounds: { x: number; y: number; width: number; height: number }) => void;
}

export const TemplateSelectionBox: React.FC<SelectionBoxProps> = ({ onSelection }) => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [currentPoint, setCurrentPoint] = useState({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.shiftKey && e.button === 0) {
      setIsSelecting(true);
      setStartPoint({ x: e.clientX, y: e.clientY });
      setCurrentPoint({ x: e.clientX, y: e.clientY });
      e.preventDefault();
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isSelecting) return;
    setCurrentPoint({ x: e.clientX, y: e.clientY });
  }, [isSelecting]);

  const handleMouseUp = useCallback(() => {
    if (!isSelecting) return;
    
    const bounds = {
      x: Math.min(startPoint.x, currentPoint.x),
      y: Math.min(startPoint.y, currentPoint.y),
      width: Math.abs(currentPoint.x - startPoint.x),
      height: Math.abs(currentPoint.y - startPoint.y)
    };
    
    if (bounds.width > 10 || bounds.height > 10) {
      onSelection(bounds);
    }
    
    setIsSelecting(false);
  }, [isSelecting, startPoint, currentPoint, onSelection]);

  React.useEffect(() => {
    if (isSelecting) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isSelecting, handleMouseMove, handleMouseUp]);

  if (!isSelecting) return null;

  const bounds = {
    left: Math.min(startPoint.x, currentPoint.x),
    top: Math.min(startPoint.y, currentPoint.y),
    width: Math.abs(currentPoint.x - startPoint.x),
    height: Math.abs(currentPoint.y - startPoint.y)
  };

  return (
    <div
      className="fixed pointer-events-none border-2 border-primary bg-primary/10 z-50"
      style={{
        left: bounds.left,
        top: bounds.top,
        width: bounds.width,
        height: bounds.height,
      }}
    />
  );
};