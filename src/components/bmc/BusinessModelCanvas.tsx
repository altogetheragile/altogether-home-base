import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import BMCCanvas, { BMCData, BMCCanvasRef } from '../canvas/templates/BMCCanvas';

interface BusinessModelCanvasProps {
  data?: BMCData;
  companyName?: string;
  isEditable?: boolean;
  onDataChange?: (data: BMCData) => void;
}

export interface BusinessModelCanvasRef {
  exportCanvas: (options?: any) => Promise<string>;
  getCanvasElement: () => HTMLElement | null;
  setExportMode: (isExporting: boolean) => void;
}

const BusinessModelCanvas = forwardRef<BusinessModelCanvasRef, BusinessModelCanvasProps>(({
  data,
  companyName,
  isEditable = false,
  onDataChange
}, ref) => {
  const canvasRef = useRef<BMCCanvasRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    exportCanvas: async (options = {}) => {
      console.log('BusinessModelCanvas exportCanvas called with options:', options);
      
      if (!canvasRef.current) {
        throw new Error('Canvas reference not available');
      }
      
      return canvasRef.current.exportCanvas(options);
    },
    getCanvasElement: () => {
      // Return the actual BMC canvas element, not the wrapper
      const canvasElement = containerRef.current?.querySelector('[data-canvas="true"]') as HTMLElement;
      console.log('Getting BMC canvas element:', canvasElement);
      return canvasElement || containerRef.current;
    },
    setExportMode: (isExporting: boolean) => {
      if (canvasRef.current?.setExportMode) {
        canvasRef.current.setExportMode(isExporting);
      }
    }
  }), []);

  return (
    <div 
      ref={containerRef}
      id="bmc-canvas" 
      className="w-full max-w-[1200px] mx-auto"
      data-testid="bmc-container"
    >
      <BMCCanvas
        ref={canvasRef}
        data={data}
        companyName={companyName}
        isEditable={isEditable}
        onDataChange={onDataChange}
        className="min-h-[700px]"
      />
    </div>
  );
});

export default BusinessModelCanvas;