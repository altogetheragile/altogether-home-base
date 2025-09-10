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
  
  // Create grid pattern with better visibility
  const gridPattern = `
    <defs>
      <pattern id="grid" width="${scaledSize}" height="${scaledSize}" patternUnits="userSpaceOnUse">
        <path d="M ${scaledSize} 0 L 0 0 0 ${scaledSize}" fill="none" stroke="hsl(var(--foreground))" stroke-width="1" opacity="0.8"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#grid)" />
  `;

  return (
    <div 
      className="absolute inset-0 pointer-events-none"
      style={{
        width: (canvasWidth * zoom) / 100,
        height: (canvasHeight * zoom) / 100,
      }}
    >
      <svg 
        width="100%" 
        height="100%" 
        className="absolute inset-0"
        dangerouslySetInnerHTML={{ __html: gridPattern }}
      />
      
      {/* Major grid lines every 5 units */}
      <svg 
        width="100%" 
        height="100%" 
        className="absolute inset-0"
      >
        <defs>
          <pattern id="majorGrid" width={scaledSize * 5} height={scaledSize * 5} patternUnits="userSpaceOnUse">
            <path 
              d={`M ${scaledSize * 5} 0 L 0 0 0 ${scaledSize * 5}`} 
              fill="none" 
              stroke="hsl(var(--foreground))" 
              strokeWidth="2" 
              opacity="0.9"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#majorGrid)" />
      </svg>
    </div>
  );
};