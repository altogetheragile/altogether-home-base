import React, { useState, useRef } from 'react';
import { hexPoints, wrapLines, LayersGlyph } from '../hex-utils';
import { CustomHexiEditorDialog } from './CustomHexiEditorDialog';

const getIconUnicode = (iconName?: string): string => {
  const iconMap: Record<string, string> = {
    'Circle': '⭕',
    'Square': '⬜',
    'Star': '⭐',
    'Heart': '❤️',
    'Lightbulb': '💡',
    'Target': '🎯',
    'Flag': '🚩',
    'Check': '✅',
    'X': '❌',
    'Info': 'ℹ️',
    'Warning': '⚠️',
    'Settings': '⚙️',
    'Users': '👥',
    'Calendar': '📅',
    'Mail': '📧',
    'Phone': '📞',
    'Layers': '📚',
  };
  return iconMap[iconName || 'Layers'] || '📚';
};

export interface CustomHexiElementProps {
  id: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  data: {
    label: string;
    color: string;
    icon?: string;
    emoji?: string;
    notes?: string;
  };
  isSelected?: boolean;
  onSelect?: () => void;
  onMove?: (position: { x: number; y: number }) => void;
  onContentChange?: (data: any) => void;
  onDelete?: () => void;
}

export const CustomHexiElement: React.FC<CustomHexiElementProps> = ({
  id,
  position,
  size,
  data,
  isSelected,
  onSelect,
  onMove,
  onContentChange,
  onDelete,
}) => {
  const { x, y } = position;
  const { width: w = 140, height: h = 121 } = size;
  
  const ref = useRef<HTMLDivElement>(null);
  const [showEditor, setShowEditor] = useState(false);
  const drag = useRef<{ px: number; py: number; x: number; y: number } | null>(null);

  const stroke = data.color ?? "#8B5CF6";
  const fill = `${(data.color ?? "#8B5CF6")}30`;
  const labelLines = wrapLines(data.label || "New Hexagon");

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { px: e.clientX, py: e.clientY, x, y };
    onSelect?.();
    e.stopPropagation();
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current || !ref.current) return;
    const dx = e.clientX - drag.current.px;
    const dy = e.clientY - drag.current.py;
    ref.current.style.transform = `translate(${drag.current.x+dx}px, ${drag.current.y+dy}px)`;
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.px;
    const dy = e.clientY - drag.current.py;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < 5) {
      setShowEditor(true);
    } else {
      const nx = Math.round(drag.current.x + dx);
      const ny = Math.round(drag.current.y + dy);
      onMove?.({ x: nx, y: ny });
    }
    
    drag.current = null;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  };

  return (
    <>
      <div
        ref={ref}
        className="absolute select-none cursor-move"
        style={{ transform: `translate(${x}px, ${y}px)`, width: w, height: h }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        data-element-id={id}
      >
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} xmlns="http://www.w3.org/2000/svg">
          <polygon points={hexPoints(w,h)} fill={fill} />
          <polygon points={hexPoints(w,h)} fill="none" stroke={stroke} strokeWidth={3} />
          {isSelected && (
            <polygon points={hexPoints(w,h)} fill="none" stroke="#f59e0b" strokeWidth={2} strokeDasharray="6 4" />
          )}

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
          ) : data.icon ? (
            <text
              x={w/2}
              y={h/2 - 25}
              fontSize={20}
              textAnchor="middle"
              dominantBaseline="central"
            >
              {getIconUnicode(data.icon)}
            </text>
          ) : (
            <g fill={stroke}>
              <LayersGlyph x={w/2} y={h/2 - 25} size={24} />
            </g>
          )}

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
      />
    </>
  );
};
