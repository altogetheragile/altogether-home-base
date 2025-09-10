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
        <path d="M ${scaledSize} 0 L 0 0 0 ${scaledSize}" fill="none" stroke="#9ca3af" stroke-width="1" opacity="0.8"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#grid)" />
  `;

  // Make grid infinite by extending beyond canvas
  const extendedWidth = Math.max(canvasWidth * 2, 2000);
  const extendedHeight = Math.max(canvasHeight * 2, 2000);
  
  return (
    <div 
      className="absolute pointer-events-none z-10"
      style={{
        top: -canvasHeight / 2,
        left: -canvasWidth / 2,
        width: (extendedWidth * zoom) / 100,
        height: (extendedHeight * zoom) / 100,
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
              stroke="#9ca3af" 
              strokeWidth="2" 
              opacity="0.4"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#majorGrid)" />
      </svg>
    </div>
  );
};