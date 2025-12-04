import React, { useState } from 'react';
import { HexiFloatingToolbar } from './HexiFloatingToolbar';
import { CanvasElement } from '../BaseCanvas';
import { hexPoints, wrapLines } from '../hex-utils';

interface PlanningFocusHexiElementProps {
  element: CanvasElement;
  isSelected: boolean;
  isMultiSelected?: boolean;
  onSelect: (e?: React.MouseEvent, preserveIfSelected?: boolean) => void;
  onUpdate: (updates: Partial<CanvasElement>) => void;
  onMoveGroup?: (delta: { dx: number; dy: number }) => void;
  onGroupDragStart?: () => void;
  onGroupDragProgress?: (delta: { dx: number; dy: number }) => void;
  onDelete: () => void;
}

export const PlanningFocusHexiElement: React.FC<PlanningFocusHexiElementProps> = ({
  element,
  isSelected,
  isMultiSelected,
  onSelect,
  onUpdate,
  onMoveGroup,
  onGroupDragStart,
  onGroupDragProgress,
  onDelete,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialPosition, setInitialPosition] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
    });
    setInitialPosition({
      x: element.position.x,
      y: element.position.y,
    });
    onSelect(e, true);
    if (isMultiSelected) {
      onGroupDragStart?.();
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    
    if (isMultiSelected) {
      // During group drag, notify canvas to update all elements visually
      onGroupDragProgress?.({ dx, dy });
    } else {
      // Single element drag - clamp to prevent off-screen movement
      onUpdate({
        position: {
          x: Math.max(0, initialPosition.x + dx),
          y: Math.max(0, initialPosition.y + dy),
        },
      });
    }
  };

  const handleMouseUp = (e: MouseEvent) => {
    if (isDragging) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      
      if (isMultiSelected && onMoveGroup && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        onMoveGroup({ dx, dy });
      }
    }
    setIsDragging(false);
  };

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart, initialPosition, isMultiSelected]);

  const { name, color, description } = element.content || {};
  const width = element.size?.width || 140;
  const height = element.size?.height || 121;

  const lines = wrapLines(name || 'Planning Focus', 15, 3);
  const fillColor = '#e0edd4';
  const borderColor = color || '#4f7a28';

  return (
    <div
      style={{
        position: 'absolute',
        left: element.position.x,
        top: element.position.y,
        width: `${width}px`,
        height: `${height}px`,
        cursor: isDragging ? 'grabbing' : 'grab',
        zIndex: isSelected ? 1000 : 1,
        willChange: 'transform',
        backfaceVisibility: 'hidden',
        pointerEvents: 'auto',
        outline: 'none',
      }}
      onMouseDown={handleMouseDown}
      onClick={onSelect}
    >
      {/* Unified floating toolbar (hide during multi-select) */}
      {isSelected && !isMultiSelected && (
        <HexiFloatingToolbar
          onDelete={onDelete}
          showEdit={false}
          showDuplicate={false}
        />
      )}

      {/* Hexagon SVG */}
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{
          filter: isSelected ? 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
        }}
      >
        <polygon
          points={hexPoints(width, height)}
          fill={fillColor}
          stroke={borderColor}
          strokeWidth="3"
        />
        
        {/* Icon at top - using embedded SVG for Layers icon */}
        <g transform={`translate(${width / 2 - 12}, ${height * 0.25 - 12})`}>
          <rect x="2" y="13" width="20" height="4" rx="1" fill="currentColor" opacity="0.8"/>
          <rect x="4" y="8" width="16" height="4" rx="1" fill="currentColor" opacity="0.9"/>
          <rect x="6" y="3" width="12" height="4" rx="1" fill="currentColor"/>
        </g>

        {/* Text */}
        <text
          x={width / 2}
          y={height * 0.5}
          textAnchor="middle"
          style={{
            fontSize: '12px',
            fontWeight: 600,
            fill: '#1a1a1a',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          {lines.map((line, i) => (
            <tspan key={i} x={width / 2} dy={i === 0 ? 0 : 14}>
              {line}
            </tspan>
          ))}
        </text>

        {/* Order badge */}
        {element.content?.display_order && (
          <g transform={`translate(${width - 20}, 15)`}>
            <circle cx="0" cy="0" r="10" fill={borderColor} opacity="0.9" />
            <text
              x="0"
              y="0"
              textAnchor="middle"
              dominantBaseline="central"
              style={{
                fontSize: '10px',
                fontWeight: 'bold',
                fill: 'white',
              }}
            >
              {element.content.display_order}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};
