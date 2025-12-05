// Shared utilities for SVG hexagon rendering
import React from 'react';

// Convert hex color to opaque light tint (mix with white)
export const getLightTint = (hexColor: string, tintPercent: number = 0.2): string => {
  if (!hexColor || typeof hexColor !== 'string') {
    return '#E8E8E8';
  }
  
  let hex = hexColor.replace('#', '');
  
  // Handle shorthand hex (e.g., "ABC" -> "AABBCC")
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  
  // Validate hex format
  if (hex.length !== 6 || !/^[0-9A-Fa-f]{6}$/.test(hex)) {
    return '#E8E8E8';
  }
  
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  const newR = Math.round(r * tintPercent + 255 * (1 - tintPercent));
  const newG = Math.round(g * tintPercent + 255 * (1 - tintPercent));
  const newB = Math.round(b * tintPercent + 255 * (1 - tintPercent));
  
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
};

// Ensure a fill color is opaque - handles transparent 8-char hex codes
export const ensureOpaqueFill = (fillColor: string | undefined, baseColor?: string): string => {
  if (!fillColor) return getLightTint(baseColor ?? "#8B5CF6", 0.2);
  
  const hex = fillColor.replace('#', '');
  
  // If it's an 8-character hex (RRGGBBAA format with transparency)
  if (hex.length === 8 && /^[0-9A-Fa-f]{8}$/.test(hex)) {
    const rgbOnly = hex.substring(0, 6);
    return getLightTint('#' + rgbOnly, 0.2);
  }
  
  // If it's already a valid 6-char opaque hex, return as-is
  if (hex.length === 6 && /^[0-9A-Fa-f]{6}$/.test(hex)) {
    return fillColor;
  }
  
  // Fallback: derive from base color
  return getLightTint(baseColor ?? "#8B5CF6", 0.2);
};

export const hexPoints = (w: number, h: number) => {
  // Proper flat-top regular hexagon for 140×121 base with slight inset to avoid stroke clipping
  const m = 2; // padding to keep stroke within viewBox
  const base = [
    [35, m],
    [105, m],
    [140 - m, 60.5],
    [105, 121 - m],
    [35, 121 - m],
    [m, 60.5]
  ];
  const sx = w / 140, sy = h / 121;
  return base.map(([px,py]) => `${px*sx},${py*sy}`).join(" ");
};

export const wrapLines = (text: string, maxChars = 15, maxLines = 3) => {
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

