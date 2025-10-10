import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Move, Trash2, LayersIcon } from 'lucide-react';
import { CanvasElement } from '../BaseCanvas';
import { hexPoints, wrapLines, LayersGlyph } from '../hex-utils';

interface PlanningFocusHexiElementProps {
  element: CanvasElement;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<CanvasElement>) => void;
  onDelete: () => void;
}

export const PlanningFocusHexiElement: React.FC<PlanningFocusHexiElementProps> = ({
  element,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - element.position.x,
      y: e.clientY - element.position.y,
    });
    onSelect();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    onUpdate({
      position: {
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      },
    });
  };

  const handleMouseUp = () => {
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
  }, [isDragging, dragStart]);

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
        willChange: isDragging ? 'transform' : 'auto',
        pointerEvents: 'auto',
      }}
      onMouseDown={handleMouseDown}
      onClick={onSelect}
    >
      {/* Controls */}
      {isSelected && (
        <div className="absolute -top-10 left-0 flex gap-1 bg-card border rounded-md p-1 shadow-lg z-10">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            title="Move"
          >
            <Move className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Delete"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
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
