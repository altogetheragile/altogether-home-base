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

// Default empty BMC data
const DEFAULT_BMC_DATA: BMCData = {
  keyPartners: '',
  keyActivities: '',
  keyResources: '',
  valuePropositions: '',
  customerRelationships: '',
  channels: '',
  customerSegments: '',
  costStructure: '',
  revenueStreams: '',
};

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

// BMC section definitions with proper Business Model Canvas proportions
const BMC_SECTIONS: Record<keyof BMCData, BMCSectionConfig> = {
  // Left column - Key Partners (full height)
  keyPartners: { x: 0, y: 0, width: 0.18, height: 0.65, title: 'Key Partners' },
  
  // Center-left column, top - Key Activities
  keyActivities: { x: 0.18, y: 0, width: 0.18, height: 0.32, title: 'Key Activities' },
  
  // Center-left column, bottom - Key Resources  
  keyResources: { x: 0.18, y: 0.32, width: 0.18, height: 0.33, title: 'Key Resources' },
  
  // Center column - Value Propositions (full height, highlighted)
  valuePropositions: { x: 0.36, y: 0, width: 0.28, height: 0.65, title: 'Value Propositions', highlight: true },
  
  // Center-right column, top - Customer Relationships
  customerRelationships: { x: 0.64, y: 0, width: 0.18, height: 0.32, title: 'Customer Relationships' },
  
  // Center-right column, bottom - Channels
  channels: { x: 0.64, y: 0.32, width: 0.18, height: 0.33, title: 'Channels' },
  
  // Right column - Customer Segments (full height)
  customerSegments: { x: 0.82, y: 0, width: 0.18, height: 0.65, title: 'Customer Segments' },
  
  // Bottom row, left - Cost Structure
  costStructure: { x: 0, y: 0.65, width: 0.5, height: 0.35, title: 'Cost Structure' },
  
  // Bottom row, right - Revenue Streams (highlighted)
  revenueStreams: { x: 0.5, y: 0.65, width: 0.5, height: 0.35, title: 'Revenue Streams', highlight: true },
};

export interface FabricBMCCanvasRef {
  exportCanvas: (format?: 'png' | 'jpeg' | 'pdf', quality?: number) => string | null;
  getCanvas: () => FabricCanvas | null;
}

const FabricBMCCanvas = forwardRef<FabricBMCCanvasRef, FabricBMCCanvasProps>(({
  data,
  isEditable = false,
  onDataChange,
  width = 900,
  height = 600
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
    
    // Use safe data with fallback to default
    const safeData = data || DEFAULT_BMC_DATA;
    
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
        left: actualX + 8,
        top: actualY + 8,
        fontSize: 11,
        fontWeight: 'bold',
        fill: config.highlight ? colors.accentForeground : colors.foreground,
        selectable: false,
        evented: false,
        fontFamily: 'system-ui, sans-serif',
      });

      // Create content text with proper null safety
      const textContent = String(safeData[sectionKey] || '');
      const content = new Textbox(textContent, {
        left: actualX + 8,
        top: actualY + 28,
        width: actualWidth - 16,
        height: actualHeight - 36,
        fontSize: 9,
        fill: colors.foreground,
        fontFamily: 'system-ui, sans-serif',
        selectable: isEditable,
        evented: isEditable,
        splitByGrapheme: true,
        breakWords: true,
        textAlign: 'left',
        lineHeight: 1.1,
        charSpacing: 0,
        overflow: 'hidden',
        styles: {},
      });

      // Handle text changes
      if (isEditable && onDataChange) {
        content.on('changed', () => {
          const currentData = data || DEFAULT_BMC_DATA;
          const newData = {
            ...currentData,
            [sectionKey]: String(content.text || ''),
          };
          onDataChange(newData);
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