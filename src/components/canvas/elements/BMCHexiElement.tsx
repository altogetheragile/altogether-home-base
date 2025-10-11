import React, { useState } from 'react';
import { Sparkles, Maximize2 } from 'lucide-react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import AIToolElement from './AIToolElement';
import BMCEditorDialog from './BMCEditorDialog';
import FabricBMCCanvas from '../../bmc/FabricBMCCanvas';
import { BMCData } from '../../bmc/FabricBMCCanvas';

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

interface BMCHexiElementProps {
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

const BMCHexiElement: React.FC<BMCHexiElementProps> = ({
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
  showWatermark = false,
}) => {
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Helper function to check if data is in nested format
  const isNestedData = (data: any): data is BMCGeneratedData => {
    return data && ('companyName' in data || 'bmcData' in data);
  };

  // Extract BMC data from nested structure or use flat structure
  const extractBMCData = (data?: BMCData | BMCGeneratedData): BMCData => {
    if (!data) return DEFAULT_BMC_DATA;
    
    if (isNestedData(data)) {
      return data.bmcData || DEFAULT_BMC_DATA;
    }
    
    return data as BMCData;
  };

  // Extract company name from nested structure
  const getCompanyName = (data?: BMCData | BMCGeneratedData): string | undefined => {
    if (!data || !isNestedData(data)) return undefined;
    return data.companyName;
  };

  const bmcData = extractBMCData(data);
  const companyName = getCompanyName(data);
  const isAIGenerated = isNestedData(data);

  const handleClick = () => {
    setIsEditorOpen(true);
  };

  const handleEditorSave = (newData: BMCData) => {
    if (!onContentChange) return;

    // If original data was nested, maintain that structure
    if (isNestedData(data)) {
      const updatedData: BMCGeneratedData = {
        companyName: companyName,
        bmcData: newData
      };
      onContentChange(updatedData);
    } else {
      onContentChange(newData);
    }
    setIsEditorOpen(false);
  };

  return (
    <>
      <AIToolElement
        element={{
          id,
          type: 'bmc' as const,
          position,
          size: size.width && size.height ? size : { width: 600, height: 400 },
          content: data || {}
        }}
        isSelected={isSelected || false}
        onSelect={onSelect || (() => {})}
        onUpdate={(element) => {
          onMove?.(element.position);
          onResize?.(element.size);
        }}
        onDelete={onDelete || (() => {})}
      >
        <div className="w-full h-full flex flex-col bg-card rounded-lg overflow-hidden border-2 border-border">
          {/* Header with title and expand button */}
          <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {isAIGenerated && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5 bg-accent shrink-0">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI
                </Badge>
              )}
              <span className="text-sm font-semibold text-foreground truncate">
                {companyName || 'Business Model Canvas'}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditorOpen(true);
              }}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Canvas content */}
          <div className="flex-1 overflow-hidden">
            <FabricBMCCanvas
              data={bmcData}
              isEditable={false}
              width={size.width || 600}
              height={(size.height || 400) - 45}
            />
          </div>
        </div>
      </AIToolElement>

      {/* BMC Editor Dialog - Full size editor */}
      <BMCEditorDialog
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        data={bmcData}
        companyName={companyName}
        onSave={handleEditorSave}
      />
    </>
  );
};

export default BMCHexiElement;