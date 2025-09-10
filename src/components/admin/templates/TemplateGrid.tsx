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
  // Debug logging for grid state
  console.log('🔵 TemplateGrid render:', { show, size, zoom, canvasWidth, canvasHeight });
  
  if (!show) {
    console.log('🔵 Grid hidden - show:', show);
    return null;
  }

  const scaledSize = (size * zoom) / 100;
  console.log('🔵 Grid scaledSize:', scaledSize);
  
  // Create highly visible grid pattern with strong contrast
  const gridPattern = `
    <defs>
      <pattern id="grid-${size}-${zoom}" width="${scaledSize}" height="${scaledSize}" patternUnits="userSpaceOnUse">
        <path d="M ${scaledSize} 0 L 0 0 0 ${scaledSize}" fill="none" stroke="hsl(var(--muted-foreground))" stroke-width="1" opacity="0.6"/>
      </pattern>
      <pattern id="majorGrid-${size}-${zoom}" width="${scaledSize * 5}" height="${scaledSize * 5}" patternUnits="userSpaceOnUse">
        <path d="M ${scaledSize * 5} 0 L 0 0 0 ${scaledSize * 5}" fill="none" stroke="hsl(var(--muted-foreground))" stroke-width="2" opacity="0.8"/>
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