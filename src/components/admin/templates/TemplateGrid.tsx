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
  if (!show) {
    return null;
  }

  const scaledSize = (size * zoom) / 100;
  
  // Create visible grid pattern
  const gridPattern = `
    <defs>
      <pattern id="grid-${size}-${zoom}" width="${scaledSize}" height="${scaledSize}" patternUnits="userSpaceOnUse">
        <path d="M ${scaledSize} 0 L 0 0 0 ${scaledSize}" fill="none" stroke="hsl(var(--border))" stroke-width="1" opacity="1"/>
      </pattern>
      <pattern id="majorGrid-${size}-${zoom}" width="${scaledSize * 5}" height="${scaledSize * 5}" patternUnits="userSpaceOnUse">
        <path d="M ${scaledSize * 5} 0 L 0 0 0 ${scaledSize * 5}" fill="none" stroke="hsl(var(--border))" stroke-width="2" opacity="1"/>
      </pattern>
    </defs>
  `;
  
  return (
    <div className="absolute inset-0 pointer-events-none z-10">
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
        
        {/* Grid background */}
        <rect 
          x="-200%" 
          y="-200%" 
          width="400%" 
          height="400%" 
          fill={`url(#grid-${size}-${zoom})`}
        />
        <rect 
          x="-200%" 
          y="-200%" 
          width="400%" 
          height="400%" 
          fill={`url(#majorGrid-${size}-${zoom})`}
        />
      </svg>
    </div>
  );
};