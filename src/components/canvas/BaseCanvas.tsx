import React, { useRef, useImperativeHandle } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { cn } from '@/lib/utils';

export interface CanvasElement {
  id: string;
  type: 'text' | 'sticky' | 'shape' | 'connector' | 'image' | 'group' | 'bmc' | 'story' | 'knowledgeItem' | 'customHexi';
  content: any;
  position: { x: number; y: number };
  size: { width: number; height: number };
  style?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface CanvasData {
  elements: CanvasElement[];
  layout?: any;
  metadata?: Record<string, any>;
}

export interface BaseCanvasProps {
  data?: CanvasData;
  isEditable?: boolean;
  onDataChange?: (data: CanvasData) => void;
  className?: string;
  children?: React.ReactNode;
  layout?: 'freeform' | 'grid' | 'template';
  direction?: 'horizontal' | 'vertical';
}

export interface BaseCanvasRef {
  exportCanvas: (options?: ExportOptions) => Promise<string>;
  getCanvasData: () => CanvasData;
  setCanvasData: (data: CanvasData) => void;
}

interface ExportOptions {
  format?: 'png' | 'pdf';
  quality?: number;
  filename?: string;
}

const BaseCanvas = React.forwardRef<BaseCanvasRef, BaseCanvasProps>(({
  data,
  isEditable = false,
  onDataChange,
  className,
  children,
  layout = 'freeform',
  direction = 'horizontal',
  ...props
}, ref) => {
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleDataChange = (newData: CanvasData) => {
    onDataChange?.(newData);
  };

  const exportCanvas = async (options: ExportOptions = {}): Promise<string> => {
    if (!canvasRef.current) {
      throw new Error('Canvas not available for export');
    }

    // Calculate bounds of all positioned elements (computed styles, not inline only)
    const allNodes = Array.from(canvasRef.current.querySelectorAll('*')) as HTMLElement[];
    const positioned = allNodes.filter((el) => {
      const cs = getComputedStyle(el);
      return cs.position === 'absolute' || cs.position === 'fixed';
    });

    let maxX = 0;
    let maxY = 0;
    let minX = Infinity;
    let minY = Infinity;

    if (positioned.length === 0) {
      // Fallback to canvas size only
      minX = 0;
      minY = 0;
      maxX = canvasRef.current.offsetWidth;
      maxY = canvasRef.current.offsetHeight;
    } else {
      const canvasRect = canvasRef.current.getBoundingClientRect();
      positioned.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const x = rect.left - canvasRect.left;
        const y = rect.top - canvasRect.top;
        const right = x + rect.width;
        const bottom = y + rect.height;
        
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, right);
        maxY = Math.max(maxY, bottom);
      });
    }

    // Add padding and account for negative positions (off-canvas content)
    const padding = 40;
    const shiftX = (minX < 0 ? -minX : 0) + padding;
    const shiftY = (minY < 0 ? -minY : 0) + padding;
    const width = Math.max(maxX - minX + padding * 2, canvasRef.current.offsetWidth + padding * 2);
    const height = Math.max(maxY - minY + padding * 2, canvasRef.current.offsetHeight + padding * 2);

    // Create an offscreen clone to avoid disturbing layout and to capture off-canvas content
    await (document as any).fonts?.ready?.catch?.(() => {});

    const exportContainer = document.createElement('div');
    exportContainer.style.position = 'fixed';
    exportContainer.style.left = '-100000px';
    exportContainer.style.top = '0';
    exportContainer.style.zIndex = '-1';
    exportContainer.style.pointerEvents = 'none';

    const exportRoot = document.createElement('div');
    exportRoot.style.width = `${width}px`;
    exportRoot.style.height = `${height}px`;
    exportRoot.style.background = '#ffffff';
    exportRoot.style.overflow = 'visible';
    exportRoot.style.position = 'relative';

    const innerShift = document.createElement('div');
    innerShift.style.position = 'absolute';
    innerShift.style.left = `${shiftX}px`;
    innerShift.style.top = `${shiftY}px`;
    innerShift.style.width = `${canvasRef.current.offsetWidth}px`;
    innerShift.style.height = `${canvasRef.current.offsetHeight}px`;
    innerShift.style.overflow = 'visible';

    const clone = canvasRef.current.cloneNode(true) as HTMLElement;
    clone.style.margin = '0';
    clone.style.width = `${canvasRef.current.offsetWidth}px`;
    clone.style.height = `${canvasRef.current.offsetHeight}px`;
    clone.style.overflow = 'visible';
    clone.style.transform = 'none';

    innerShift.appendChild(clone);
    exportRoot.appendChild(innerShift);
    exportContainer.appendChild(exportRoot);
    document.body.appendChild(exportContainer);

    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(exportRoot, {
        backgroundColor: '#ffffff',
        scale: options.quality || 2,
        useCORS: true,
        allowTaint: true,
        width,
        height,
        letterRendering: true as any,
        foreignObjectRendering: false,
        logging: false,
      } as any);

      if (options.format === 'pdf') {
        const { default: jsPDF } = await import('jspdf');
        const pdf = new jsPDF({
          orientation: (canvas.width / canvas.height) > 1 ? 'landscape' : 'portrait',
          unit: 'mm',
          format: 'a4',
        });

        const imgData = canvas.toDataURL('image/png');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        const canvasAspectRatio = canvas.width / canvas.height;
        let imgWidth = pdfWidth - 20;
        let imgHeight = imgWidth / canvasAspectRatio;
        
        if (imgHeight > pdfHeight - 20) {
          imgHeight = pdfHeight - 20;
          imgWidth = imgHeight * canvasAspectRatio;
        }
        
        const x = (pdfWidth - imgWidth) / 2;
        const y = (pdfHeight - imgHeight) / 2;
        
        pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
        return pdf.output('dataurlstring');
      }

      return canvas.toDataURL('image/png');
    } finally {
      // Clean up cloned elements
      try {
        document.body.removeChild(exportContainer);
      } catch {}
    }
  };

  const getCanvasData = (): CanvasData => {
    return data || { elements: [] };
  };

  const setCanvasData = (newData: CanvasData) => {
    handleDataChange(newData);
  };

  useImperativeHandle(ref, () => ({
    exportCanvas,
    getCanvasData,
    setCanvasData,
  }));

  if (layout === 'template' || layout === 'grid') {
    return (
      <div
        ref={canvasRef}
        className={cn(
          'w-full h-full bg-background border border-border rounded-lg overflow-hidden',
          className
        )}
        {...props}
      >
        <ResizablePanelGroup direction={direction} className="h-full">
          {children}
        </ResizablePanelGroup>
      </div>
    );
  }

  // Freeform layout
  return (
    <div
      ref={canvasRef}
      className={cn(
        'w-full h-full bg-background border border-border rounded-lg relative overflow-hidden',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

BaseCanvas.displayName = 'BaseCanvas';

export default BaseCanvas;
export { ResizablePanel, ResizableHandle };