import React from 'react';

interface TemplateGridProps {
  show: boolean;
  size: number;
  canvasWidth: number;
  canvasHeight: number;
  zoom: number;
}

export const TemplateGrid: React.FC<TemplateGridProps> = ({
  show,
  size,
  canvasWidth,
  canvasHeight,
  zoom,
}) => {
  if (!show) return null;

  const scaledSize = (size * zoom) / 100;
  
  // Create subtle, infinite grid pattern
  const gridPattern = `
    <defs>
      <pattern id="grid" width="${scaledSize}" height="${scaledSize}" patternUnits="userSpaceOnUse">
        <path d="M ${scaledSize} 0 L 0 0 0 ${scaledSize}" fill="none" stroke="hsl(var(--border))" stroke-width="0.5" opacity="0.3"/>
      </pattern>
      <pattern id="majorGrid" width="${scaledSize * 5}" height="${scaledSize * 5}" patternUnits="userSpaceOnUse">
        <path d="M ${scaledSize * 5} 0 L 0 0 0 ${scaledSize * 5}" fill="none" stroke="hsl(var(--border))" stroke-width="1" opacity="0.5"/>
      </pattern>
    </defs>
  `;
  
  return (
    <div className="absolute inset-0 pointer-events-none z-0">
      <svg 
        width="100%" 
        height="100%" 
        className="absolute inset-0"
        style={{ 
          transform: `scale(${zoom / 100})`,
          transformOrigin: 'center center'
        }}
      >
        <defs dangerouslySetInnerHTML={{ __html: gridPattern.replace('<defs>', '').replace('</defs>', '') }} />
        
        {/* Infinite grid background */}
        <rect 
          x="-50%" 
          y="-50%" 
          width="200%" 
          height="200%" 
          fill="url(#grid)" 
        />
        <rect 
          x="-50%" 
          y="-50%" 
          width="200%" 
          height="200%" 
          fill="url(#majorGrid)" 
        />
      </svg>
    </div>
  );
};