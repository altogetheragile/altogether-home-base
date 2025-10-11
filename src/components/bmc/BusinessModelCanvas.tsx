import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import BMCCanvas, { BMCData, BMCCanvasRef } from '../canvas/templates/BMCCanvas';
import { BMCData as ExportBMCData } from '@/utils/bmcExport';

interface BusinessModelCanvasProps {
  data?: BMCData;
  companyName?: string;
  isEditable?: boolean;
  onDataChange?: (data: BMCData) => void;
  showWatermark?: boolean;
}

export interface BusinessModelCanvasRef {
  exportCanvas: (options?: any) => Promise<string>;
  getCanvasElement: () => HTMLElement | null;
  setExportMode: (isExporting: boolean) => void;
  getBMCData: () => ExportBMCData | undefined;
}

const BusinessModelCanvas = forwardRef<BusinessModelCanvasRef, BusinessModelCanvasProps>(({
  data,
  companyName,
  isEditable = false,
  onDataChange,
  showWatermark = false
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
    },
    getBMCData: () => {
      if (canvasRef.current?.getBMCData) {
        return canvasRef.current.getBMCData();
      }
      // Convert BMCCanvas data to export format
      if (data) {
        return data as ExportBMCData;
      }
      return undefined;
    }
  }), [data]);

  return (
    <div 
      ref={containerRef}
      id="bmc-canvas" 
      className="w-full max-w-[1200px] mx-auto relative"
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
      {showWatermark && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="text-muted-foreground/20 text-6xl font-bold transform -rotate-45 select-none">
            Sign in to export
          </div>
        </div>
      )}
    </div>
  );
});

export default BusinessModelCanvas;