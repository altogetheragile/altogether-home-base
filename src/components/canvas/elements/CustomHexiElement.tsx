import React, { useState, useRef } from 'react';
import { hexPoints, wrapLines } from '../hex-utils';
import { CustomHexiEditorDialog } from './CustomHexiEditorDialog';
import { HexiFloatingToolbar } from './HexiFloatingToolbar';
import { SaveToKBDialog, KBItemData } from './SaveToKBDialog';
import * as Icons from 'lucide-react';

export interface CustomHexiElementProps {
  id: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  data: {
    label: string;
    color: string;
    borderColor?: string;
    fillColor?: string;
    domain_id?: string;
    domain_name?: string;
    icon?: string;
    emoji?: string;
    notes?: string;
  };
  isSelected?: boolean;
  isMultiSelected?: boolean;
  onSelect?: (e?: React.PointerEvent | React.MouseEvent, preserveIfSelected?: boolean) => void;
  onMove?: (position: { x: number; y: number }) => void;
  onMoveGroup?: (delta: { dx: number; dy: number }) => void;
  onGroupDragStart?: () => void;
  onGroupDragProgress?: (delta: { dx: number; dy: number }) => void;
  onContentChange?: (data: any) => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onSaveToKB?: (
    knowledgeItemId: string, 
    convertToKB: boolean, 
    convertAllMatching: boolean,
    itemData: KBItemData
  ) => void;
}

export const CustomHexiElement: React.FC<CustomHexiElementProps> = ({
  id,
  position,
  size,
  data,
  isSelected,
  isMultiSelected,
  onSelect,
  onMove,
  onMoveGroup,
  onGroupDragStart,
  onGroupDragProgress,
  onContentChange,
  onDelete,
  onDuplicate,
  onSaveToKB,
}) => {
  const { x, y } = position;
  const { width: w = 140, height: h = 121 } = size;
  
  const ref = useRef<HTMLDivElement>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const drag = useRef<{ px: number; py: number; x: number; y: number } | null>(null);

  const stroke = data.borderColor ?? data.color ?? "#8B5CF6";
  const fill = data.fillColor ?? `${(data.color ?? "#8B5CF6")}30`;
  const labelLines = wrapLines(data.label || "New Hexagon");

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { px: e.clientX, py: e.clientY, x, y };
    onSelect?.(e, true);
    if (isMultiSelected) {
      onGroupDragStart?.();
    }
    e.stopPropagation();
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current || !ref.current) return;
    const dx = e.clientX - drag.current.px;
    const dy = e.clientY - drag.current.py;
    
    if (isMultiSelected) {
      onGroupDragProgress?.({ dx, dy });
    } else {
      // Single element drag - clamp to prevent off-screen movement
      const newX = Math.max(0, drag.current.x + dx);
      const newY = Math.max(0, drag.current.y + dy);
      ref.current.style.transform = `translate(${newX}px, ${newY}px)`;
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.px;
    const dy = e.clientY - drag.current.py;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance >= 5) {
      if (isMultiSelected && onMoveGroup) {
        onMoveGroup({ dx, dy });
      } else {
        const nx = Math.round(drag.current.x + dx);
        const ny = Math.round(drag.current.y + dy);
        onMove?.({ x: nx, y: ny });
      }
    }
    
    drag.current = null;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  };

  return (
    <>
      <div
        ref={ref}
        className="absolute select-none cursor-move"
        style={{ transform: `translate(${x}px, ${y}px)`, width: w, height: h, zIndex: isSelected ? 1000 : 1, willChange: 'transform', backfaceVisibility: 'hidden', outline: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        data-element-id={id}
      >
        {/* Floating toolbar when selected (hide during multi-select) */}
        {isSelected && !isMultiSelected && (
          <HexiFloatingToolbar
            onEdit={() => setShowEditor(true)}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
            onSaveToKB={() => setShowSaveDialog(true)}
            showEdit={true}
            showDuplicate={!!onDuplicate}
            showSaveToKB={true}
          />
        )}

        <svg 
          width={w} 
          height={h} 
          viewBox={`0 0 ${w} ${h}`} 
          xmlns="http://www.w3.org/2000/svg" 
          style={{ 
            overflow: 'visible',
            filter: isSelected 
              ? 'drop-shadow(0 0 12px rgba(59, 130, 246, 0.8)) drop-shadow(0 0 4px rgba(59, 130, 246, 1))' 
              : 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
          }}
        >
          
          {/* Hex shape */}
          <polygon 
            points={hexPoints(w,h)} 
            fill={fill} 
            stroke={stroke} 
            strokeWidth={3} 
            strokeLinejoin="round" 
            strokeLinecap="round"
          />
          

          {/* Center icon / emoji */}
          {data.emoji ? (
            <text
              x={w/2}
              y={h/2 - 25}
              fontSize={24}
              textAnchor="middle"
              dominantBaseline="central"
            >
              {data.emoji}
            </text>
          ) : (() => {
            const IconComponent = data.icon ? Icons[data.icon as keyof typeof Icons] as any : Icons.BookOpen;
            return IconComponent ? (
              <foreignObject x={w/2 - 12} y={h/2 - 37} width={24} height={24}>
                <IconComponent style={{ color: stroke, width: 24, height: 24 }} />
              </foreignObject>
            ) : null;
          })()}

          {/* Label */}
          <g fontFamily="Inter, ui-sans-serif, system-ui" fontWeight={600} fill="#111827" textAnchor="middle">
            {labelLines.map((ln, i) => (
              <text
                key={i}
                x={w/2}
                y={h/2 + (i * 16) + 5}
                fontSize={13}
                dominantBaseline="middle"
              >
                {ln}
              </text>
            ))}
          </g>
        </svg>
      </div>

      <CustomHexiEditorDialog
        isOpen={showEditor}
        onClose={() => setShowEditor(false)}
        data={data}
        onSave={(updatedData) => {
          onContentChange?.(updatedData);
          setShowEditor(false);
        }}
        onDelete={() => {
          onDelete?.();
          setShowEditor(false);
        }}
        onDuplicate={onDuplicate}
      />

      <SaveToKBDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        data={data}
        onSaveComplete={(knowledgeItemId, convertToKB, convertAllMatching, itemData) => {
          onSaveToKB?.(knowledgeItemId, convertToKB, convertAllMatching, itemData);
          setShowSaveDialog(false);
        }}
      />
    </>
  );
};
