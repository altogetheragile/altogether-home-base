import React, { useRef } from 'react';
import BMCCanvas, { BMCData, BMCCanvasRef } from '../canvas/templates/BMCCanvas';

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
  const canvasRef = useRef<BMCCanvasRef>(null);

  // Expose canvas reference for export functionality
  React.useEffect(() => {
    const container = document.querySelector('#bmc-canvas');
    if (container && canvasRef.current) {
      (container as any)._canvasRef = canvasRef.current;
    }
  }, [canvasRef.current]);

  return (
    <div id="bmc-canvas" className="w-full max-w-[1200px] mx-auto">
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
};

export default BusinessModelCanvas;