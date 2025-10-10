import React, { useState, useRef } from 'react';
import { hexPoints, wrapLines, LayersGlyph } from '../hex-utils';
import { CustomHexiEditorDialog } from './CustomHexiEditorDialog';

const renderSimpleIcon = (iconName: string | undefined, x: number, y: number, size: number, color: string) => {
  const icons: Record<string, JSX.Element> = {
    'FileText': <rect x={x - size/2} y={y - size/2} width={size} height={size * 1.2} rx={2} fill="none" stroke={color} strokeWidth={2} />,
    'BookOpen': (
      <g>
        <path d={`M ${x - size/2} ${y} L ${x} ${y - size/2} L ${x + size/2} ${y} L ${x} ${y + size/2} Z`} fill="none" stroke={color} strokeWidth={2} />
        <line x1={x} y1={y - size/2} x2={x} y2={y + size/2} stroke={color} strokeWidth={2} />
      </g>
    ),
    'TrendingUp': (
      <polyline points={`${x - size/2},${y + size/3} ${x - size/6},${y} ${x + size/6},${y - size/6} ${x + size/2},${y - size/2}`} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    ),
    'Lightbulb': <circle cx={x} cy={y} r={size/2} fill="none" stroke={color} strokeWidth={2} />,
    'Users': (
      <g>
        <circle cx={x - size/3} cy={y - size/4} r={size/4} fill="none" stroke={color} strokeWidth={2} />
        <circle cx={x + size/3} cy={y - size/4} r={size/4} fill="none" stroke={color} strokeWidth={2} />
      </g>
    ),
    'Target': (
      <g>
        <circle cx={x} cy={y} r={size/2} fill="none" stroke={color} strokeWidth={2} />
        <circle cx={x} cy={y} r={size/4} fill="none" stroke={color} strokeWidth={2} />
      </g>
    ),
  };
  
  return icons[iconName || 'BookOpen'] || icons['BookOpen'];
};

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

  const stroke = data.borderColor ?? data.color ?? "#8B5CF6";
  const fill = data.fillColor ?? `${(data.color ?? "#8B5CF6")}30`;
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
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible' }}>
          {/* Hex shape */}
          <polygon 
            points={hexPoints(w,h)} 
            fill={fill} 
            stroke={stroke} 
            strokeWidth={3} 
            strokeLinejoin="round" 
            strokeLinecap="round"
          />
          {isSelected && (
            <polygon 
              points={hexPoints(w,h)} 
              fill="none" 
              stroke={stroke} 
              strokeWidth={5} 
              strokeOpacity={0.5}
              strokeLinejoin="round" 
              strokeLinecap="round" 
            />
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
            <g>{renderSimpleIcon(data.icon, w/2, h/2 - 25, 20, stroke)}</g>
          ) : (
            <g>{renderSimpleIcon('BookOpen', w/2, h/2 - 25, 20, stroke)}</g>
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
