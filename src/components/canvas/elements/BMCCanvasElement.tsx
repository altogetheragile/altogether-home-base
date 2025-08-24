import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Edit } from 'lucide-react';
import AIToolElement from './AIToolElement';
import FabricBMCCanvas, { FabricBMCCanvasRef, BMCData } from '../../bmc/FabricBMCCanvas';

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
}

export const BMCCanvasElement: React.FC<BMCCanvasElementProps> = ({
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
}) => {
  const bmcRef = useRef<FabricBMCCanvasRef>(null);

  // Helper function to check if data is in nested format
  const isNestedData = (data: any): data is BMCGeneratedData => {
    return data && ('companyName' in data || 'bmcData' in data);
  };

  // Extract BMC data from nested structure or use flat structure
  const extractBMCData = (data?: BMCData | BMCGeneratedData): BMCData => {
    if (!data) return DEFAULT_BMC_DATA;
    
    console.log('🔍 [BMC] Raw data received:', data);
    
    if (isNestedData(data)) {
      console.log('📊 [BMC] Extracting nested bmcData:', data.bmcData);
      return data.bmcData || DEFAULT_BMC_DATA;
    }
    
    console.log('📊 [BMC] Using flat BMC data:', data);
    return data as BMCData;
  };

  // Extract company name from nested structure
  const getCompanyName = (data?: BMCData | BMCGeneratedData): string | undefined => {
    if (!data || !isNestedData(data)) return undefined;
    return data.companyName;
  };

  const bmcData = extractBMCData(data);
  const companyName = getCompanyName(data);

  // Handle content changes and maintain the original data structure
  const handleContentChange = (newBmcData: BMCData) => {
    console.log('✏️ [BMC] Content changed:', newBmcData);
    
    if (!onContentChange) return;

    // If original data was nested, maintain that structure
    if (isNestedData(data)) {
      const updatedData: BMCGeneratedData = {
        companyName: companyName,
        bmcData: newBmcData
      };
      console.log('📤 [BMC] Sending nested data update:', updatedData);
      onContentChange(updatedData);
    } else {
      console.log('📤 [BMC] Sending flat data update:', newBmcData);
      onContentChange(newBmcData);
    }
  };

  const handleUpdate = (element: any) => {
    onMove?.(element.position);
  };

  const element = {
    id,
    type: 'bmc' as const,
    position,
    size,
    content: data || {}
  };

  return (
    <AIToolElement
      element={element}
      isSelected={isSelected || false}
      onSelect={onSelect || (() => {})}
      onUpdate={handleUpdate}
      onDelete={onDelete || (() => {})}
    >
      <div className="w-full h-full flex flex-col bg-background">
        {/* Header with controls */}
        <div className="flex items-center justify-between p-2 border-b bg-background">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">
              {companyName ? `${companyName} - Business Model Canvas` : 'Business Model Canvas'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              AI Generated
            </Badge>
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onEdit}
                className="h-6 w-6 p-0"
              >
                <Edit className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* BMC Canvas Content */}
        <div className="flex-1 min-h-0">
          <FabricBMCCanvas
            ref={bmcRef}
            data={bmcData}
            isEditable={true}
            onDataChange={handleContentChange}
            width={size.width - 4}
            height={size.height - 60}
          />
        </div>
      </div>
    </AIToolElement>
  );
};