import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { Canvas as FabricCanvas, Rect, Textbox, IText } from 'fabric';
import { toast } from 'sonner';
import { resolveFabricColors, useFabricColors, type FabricColors } from '../../utils/fabricColors';

interface BMCData {
  keyPartners: string;
  keyActivities: string;
  keyResources: string;
  valuePropositions: string;
  customerRelationships: string;
  channels: string;
  customerSegments: string;
  costStructure: string;
  revenueStreams: string;
}

interface FabricBMCCanvasProps {
  data?: BMCData;
  isEditable?: boolean;
  onDataChange?: (data: BMCData) => void;
  width?: number;
  height?: number;
}

interface BMCSectionConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  highlight?: boolean;
}

// BMC section definitions with proper proportions
const BMC_SECTIONS: Record<keyof BMCData, BMCSectionConfig> = {
  // Top row - 5 equal sections
  keyPartners: { x: 0, y: 0, width: 0.2, height: 0.4, title: 'Key Partners' },
  keyActivities: { x: 0.2, y: 0, width: 0.2, height: 0.4, title: 'Key Activities' },
  valuePropositions: { x: 0.4, y: 0, width: 0.2, height: 0.4, title: 'Value Propositions', highlight: true },
  customerRelationships: { x: 0.6, y: 0, width: 0.2, height: 0.4, title: 'Customer Relationships' },
  customerSegments: { x: 0.8, y: 0, width: 0.2, height: 0.4, title: 'Customer Segments' },
  
  // Middle row - 2 sections
  keyResources: { x: 0.2, y: 0.4, width: 0.2, height: 0.3, title: 'Key Resources' },
  channels: { x: 0.6, y: 0.4, width: 0.2, height: 0.3, title: 'Channels' },
  
  // Bottom row - 2 sections with different proportions
  costStructure: { x: 0, y: 0.7, width: 0.6, height: 0.3, title: 'Cost Structure' },
  revenueStreams: { x: 0.6, y: 0.7, width: 0.4, height: 0.3, title: 'Revenue Streams', highlight: true },
};

export interface FabricBMCCanvasRef {
  exportCanvas: (format?: 'png' | 'jpeg' | 'pdf', quality?: number) => string | null;
  getCanvas: () => FabricCanvas | null;
}

const FabricBMCCanvas = forwardRef<FabricBMCCanvasRef, FabricBMCCanvasProps>(({
  data,
  isEditable = false,
  onDataChange,
  width = 1200,
  height = 800
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [sections, setSections] = useState<Record<string, { rect: Rect; title: IText; content: Textbox }>>({});
  const [colors, setColors] = useState<FabricColors>(resolveFabricColors());

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width,
      height,
      backgroundColor: colors.background,
      selection: isEditable,
      allowTouchScrolling: false,
    });

    setFabricCanvas(canvas);

      return () => {
      canvas.dispose();
    };
  }, [width, height, isEditable, colors]);

  useEffect(() => {
    if (!fabricCanvas) return;

    // Clear existing objects
    fabricCanvas.clear();
    
    const newSections: Record<string, { rect: Rect; title: IText; content: Textbox }> = {};

    // Create BMC sections
    Object.entries(BMC_SECTIONS).forEach(([key, config]) => {
      const sectionKey = key as keyof BMCData;
      
      // Calculate actual positions and sizes
      const actualX = config.x * width;
      const actualY = config.y * height;
      const actualWidth = config.width * width;
      const actualHeight = config.height * height;

      // Create background rectangle
      const rect = new Rect({
        left: actualX,
        top: actualY,
        width: actualWidth,
        height: actualHeight,
        fill: config.highlight ? colors.accent : colors.card,
        stroke: colors.border,
        strokeWidth: 2,
        selectable: false,
        evented: false,
      });

      // Create title text
      const title = new IText(config.title, {
        left: actualX + 10,
        top: actualY + 10,
        fontSize: 14,
        fontWeight: 'bold',
        fill: config.highlight ? colors.accentForeground : colors.foreground,
        selectable: false,
        evented: false,
        fontFamily: 'system-ui, sans-serif',
      });

      // Create content text
      const content = new Textbox(data?.[sectionKey] || '', {
        left: actualX + 10,
        top: actualY + 35,
        width: actualWidth - 20,
        height: actualHeight - 45,
        fontSize: 12,
        fill: colors.foreground,
        fontFamily: 'system-ui, sans-serif',
        selectable: isEditable,
        evented: isEditable,
        splitByGrapheme: true,
        styles: {},
      });

      // Handle text changes
      if (isEditable && onDataChange) {
        content.on('changed', () => {
          if (data) {
            const newData = {
              ...data,
              [sectionKey]: content.text || '',
            };
            onDataChange(newData);
          }
        });
      }

      // Add objects to canvas
      fabricCanvas.add(rect);
      fabricCanvas.add(title);
      fabricCanvas.add(content);

      newSections[key] = { rect, title, content };
    });

    setSections(newSections);
    fabricCanvas.renderAll();
  }, [fabricCanvas, data, isEditable, onDataChange, width, height, colors]);

  // Handle theme changes
  useFabricColors((newColors) => {
    setColors(newColors);
    if (fabricCanvas) {
      fabricCanvas.backgroundColor = newColors.background;
      fabricCanvas.renderAll();
    }
  });

  // Export functionality
  const exportCanvas = (format: 'png' | 'jpeg' | 'pdf' = 'png', quality: number = 1.0): string | null => {
    if (!fabricCanvas) return null;

    if (format === 'pdf') {
      // For PDF, we'll return the dataURL and let the calling code handle PDF generation
      return fabricCanvas.toDataURL({
        format: 'png',
        quality: 1.0,
        multiplier: 2, // Higher resolution for PDF
      });
    }

    return fabricCanvas.toDataURL({
      format,
      quality,
      multiplier: format === 'png' ? 2 : 1, // Higher resolution for PNG
    });
  };

  // Expose export function via ref
  useImperativeHandle(ref, () => ({
    exportCanvas,
    getCanvas: () => fabricCanvas,
  }));

  return (
    <div className="w-full flex justify-center bg-background p-6">
      <div className="border border-border rounded-lg shadow-lg overflow-hidden">
        <canvas 
          ref={canvasRef} 
          className="max-w-full h-auto"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      </div>
    </div>
  );
});

FabricBMCCanvas.displayName = 'FabricBMCCanvas';

export default FabricBMCCanvas;
export type { BMCData };