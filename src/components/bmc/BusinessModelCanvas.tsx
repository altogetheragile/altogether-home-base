import React, { useRef } from 'react';
import FabricBMCCanvas, { BMCData, FabricBMCCanvasRef } from './FabricBMCCanvas';


interface BusinessModelCanvasProps {
  data?: BMCData;
  companyName?: string;
  isEditable?: boolean;
  onDataChange?: (data: BMCData) => void;
}

const BusinessModelCanvas: React.FC<BusinessModelCanvasProps> = ({
  data,
  companyName,
  isEditable = false,
  onDataChange
}) => {
  const canvasRef = useRef<FabricBMCCanvasRef>(null);

  // Expose canvas reference for export functionality
  React.useEffect(() => {
    const container = document.querySelector('#bmc-canvas');
    if (container && canvasRef.current) {
      (container as any)._fabricCanvasRef = canvasRef.current;
    }
  }, [canvasRef.current]);

  return (
    <div id="bmc-canvas" className="w-full max-w-[900px] mx-auto">
      {companyName && (
        <div className="text-center mb-4">
          <h1 className="text-lg font-bold text-foreground mb-1">
            Business Model Canvas
          </h1>
          <p className="text-sm text-muted-foreground font-medium">
            {companyName}
          </p>
        </div>
      )}
      
      <FabricBMCCanvas
        ref={canvasRef}
        data={data}
        isEditable={isEditable}
        onDataChange={onDataChange}
        width={900}
        height={600}
      />
    </div>
  );
};

export default BusinessModelCanvas;