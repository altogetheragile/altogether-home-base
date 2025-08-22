import React, { useRef, useImperativeHandle } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { cn } from '@/lib/utils';

export interface CanvasElement {
  id: string;
  type: 'text' | 'sticky' | 'shape' | 'connector' | 'image' | 'group' | 'bmc' | 'story';
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

    const { default: html2canvas } = await import('html2canvas');
    
    const canvas = await html2canvas(canvasRef.current, {
      backgroundColor: 'white',
      scale: options.quality || 2,
      useCORS: true,
      allowTaint: true,
    });

    if (options.format === 'pdf') {
      const { default: jsPDF } = await import('jspdf');
      const pdf = new jsPDF({
        orientation: 'landscape',
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