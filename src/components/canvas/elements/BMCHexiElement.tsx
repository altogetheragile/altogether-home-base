import React, { useState } from 'react';
import { Building2, Sparkles } from 'lucide-react';
import { Badge } from '../../ui/badge';
import AIToolElement from './AIToolElement';
import BMCEditorDialog from './BMCEditorDialog';
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
          size: { width: 140, height: 160 }, // Fixed hexi size
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
        <div 
          className="flex flex-col items-center justify-center p-4 cursor-pointer group transition-all duration-200 hover:scale-105"
          onClick={handleClick}
        >
          {/* Hexagonal shape */}
          <div className="relative mb-2">
            <div className="w-20 h-20 bg-primary/10 border-2 border-primary/30 relative flex items-center justify-center group-hover:border-primary/60 transition-colors">
              {/* Hexagon using CSS clip-path */}
              <div 
                className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 group-hover:from-primary/30 group-hover:to-primary/10 transition-all duration-200"
                style={{
                  clipPath: 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)'
                }}
              />
              <Building2 className="h-8 w-8 text-primary relative z-10" />
            </div>
            
            {/* AI Generated badge */}
            {isAIGenerated && (
              <div className="absolute -top-1 -right-1">
                <Badge variant="secondary" className="text-xs px-1 py-0 h-5 bg-accent">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI
                </Badge>
              </div>
            )}
          </div>

          {/* Company name or default label */}
          <div className="text-center">
            <div className="text-xs font-medium text-foreground/90 line-clamp-1">
              {companyName || 'Business Model Canvas'}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Click to edit
            </div>
          </div>
        </div>
      </AIToolElement>

      {/* BMC Editor Dialog */}
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