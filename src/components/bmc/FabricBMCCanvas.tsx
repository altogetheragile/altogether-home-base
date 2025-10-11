import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { Canvas as FabricCanvas, Rect, Textbox, IText } from 'fabric';
import { toast } from 'sonner';

// Simple color interface for Fabric.js
interface FabricColors {
  background: string;
  foreground: string;
  card: string;
  accent: string;
  accentForeground: string;
  border: string;
}

// Simple color resolver without external dependency
const getSimpleFabricColors = (): FabricColors => {
  // Get computed styles from document root
  const computedStyle = getComputedStyle(document.documentElement);
  
  // Helper to convert HSL values to a proper color string
  const resolveHSL = (variableName: string): string => {
    const hslValues = computedStyle.getPropertyValue(variableName).trim();
    if (hslValues) {
      return `hsl(${hslValues})`;
    }
    // Fallback colors
    const fallbacks: Record<string, string> = {
      '--background': 'hsl(0, 0%, 100%)',
      '--foreground': 'hsl(0, 0%, 3.9%)',
      '--card': 'hsl(0, 0%, 100%)',
      '--accent': 'hsl(210, 40%, 98%)',
      '--accent-foreground': 'hsl(0, 0%, 9%)',
      '--border': 'hsl(214.3, 31.8%, 91.4%)',
    };
    return fallbacks[variableName] || 'hsl(0, 0%, 50%)';
  };

  return {
    background: resolveHSL('--background'),
    foreground: resolveHSL('--foreground'),
    card: resolveHSL('--card'),
    accent: resolveHSL('--accent'),
    accentForeground: resolveHSL('--accent-foreground'),
    border: resolveHSL('--border'),
  };
};

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
  const [colors, setColors] = useState<FabricColors>(getSimpleFabricColors());

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
  }, [width, height, isEditable]);

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

      // Create title text with responsive sizing
      const titleFontSize = Math.max(9, Math.min(14, width * 0.014));
      
      const title = new IText(config.title, {
        left: actualX + 6,
        top: actualY + 6,
        fontSize: titleFontSize,
        fontWeight: 'bold',
        fill: config.highlight ? colors.accentForeground : colors.foreground,
        selectable: false,
        evented: false,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      });

      // Create content text with proper null safety and better sizing
      const textContent = String(safeData[sectionKey] || '');
      
      // Calculate responsive font size based on canvas dimensions
      const baseFontSize = Math.max(8, Math.min(12, width * 0.012));
      
      const content = new Textbox(textContent, {
        left: actualX + 6,
        top: actualY + 24,
        width: actualWidth - 12,
        height: actualHeight - 30,
        fontSize: baseFontSize,
        fill: colors.foreground,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        selectable: isEditable,
        evented: isEditable,
        splitByGrapheme: false,
        breakWords: true,
        textAlign: 'left',
        lineHeight: 1.3,
        charSpacing: 0,
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
  useEffect(() => {
    const newColors = getSimpleFabricColors();
    setColors(newColors);
    if (fabricCanvas) {
      fabricCanvas.backgroundColor = newColors.background;
      fabricCanvas.renderAll();
    }
  }, [fabricCanvas]);

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