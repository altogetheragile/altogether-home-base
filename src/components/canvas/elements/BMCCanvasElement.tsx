import React from 'react';
import BMCHexiElement from './BMCHexiElement';
import { BMCData } from '../../bmc/FabricBMCCanvas';

// Interface for data that might come from AI generator (nested structure)
interface BMCGeneratedData {
  companyName?: string;
  bmcData?: BMCData;
}

interface BMCCanvasElementProps {
  id: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  data?: BMCData | BMCGeneratedData;
  isSelected?: boolean;
  onSelect?: () => void;
  onResize?: (size: { width: number; height: number }) => void;
  onMove?: (position: { x: number; y: number }) => void;
  onContentChange?: (data: BMCData | BMCGeneratedData) => void;
  onDelete?: () => void;
  onEdit?: () => void;
  showWatermark?: boolean;
}

const BMCCanvasElement: React.FC<BMCCanvasElementProps> = ({
  id,
  position,
  size,
  data,
  isSelected,
  onSelect,
  onResize,
  onMove,
  onContentChange,
  onDelete,
  onEdit,
  showWatermark,
}) => {
  return (
    <BMCHexiElement
      id={id}
      position={position}
      size={size}
      data={data}
      isSelected={isSelected}
      onSelect={onSelect}
      onResize={onResize}
      onMove={onMove}
      onContentChange={onContentChange}
      onDelete={onDelete}
      onEdit={onEdit}
      showWatermark={showWatermark}
    />
  );
};

export default BMCCanvasElement;