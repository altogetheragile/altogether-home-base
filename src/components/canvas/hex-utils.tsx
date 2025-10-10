// Shared utilities for SVG hexagon rendering
import React from 'react';

export const hexPoints = (w: number, h: number) => {
  // Base flat-top hex for 160x140, scaled to w/h (keeps nice proportions)
  const base = [
    [40,14],[120,14],[160,70],[120,126],[40,126],[0,70]
  ];
  const sx = w / 160, sy = h / 140;
  return base.map(([px,py]) => `${px*sx},${py*sy}`).join(" ");
};

export const wrapLines = (text: string, maxChars = 16, maxLines = 3) => {
  const words = (text ?? "").split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? line + " " + w : w;
    if (next.length <= maxChars) line = next;
    else { if (line) lines.push(line); line = w; }
    if (lines.length === maxLines) break;
  }
  if (line && lines.length < maxLines) lines.push(line);
  return lines;
};

// minimal built-in "Layers" icon as SVG paths (no dependency on lucide)
export const LayersGlyph: React.FC<{ x: number; y: number; size: number }> = ({ x, y, size }) => {
  const s = size;
  return (
    <g transform={`translate(${x - s/2}, ${y - s/2})`}>
      <path d={`M0 ${s*0.45} L${s/2} 0 L${s} ${s*0.45} L${s/2} ${s*0.9} Z`} fill="currentColor" opacity="0.9"/>
      <path d={`M0 ${s*0.20} L${s/2} ${-s*0.25} L${s} ${s*0.20}`} fill="currentColor" opacity="0.25"/>
      <path d={`M0 ${s*0.70} L${s/2} ${s*1.15} L${s} ${s*0.70}`} fill="currentColor" opacity="0.25"/>
    </g>
  );
};

