import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BMCData {
  keyPartners: string;
  keyActivities: string;
  keyResources: string;
  valuePropositions: string;
  customerRelationships: string;
  channels: string;
  customerSegments: string;
  costStructure: string;
  revenueStreams: string;
}

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
  const handleSectionChange = (section: keyof BMCData, value: string) => {
    if (!isEditable || !data || !onDataChange) return;
    
    onDataChange({
      ...data,
      [section]: value
    });
  };

  const formatContent = (text: string) => {
    if (!text) return null;
    
    // Handle both bullet points and regular paragraphs
    return text.split('\n').map((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return null;
      
      return (
        <div key={index} className="mb-1 text-xs leading-tight break-words">
          {trimmedLine}
        </div>
      );
    }).filter(Boolean);
  };

  const SectionCard: React.FC<{
    title: string;
    content: string;
    section: keyof BMCData;
    className?: string;
    isHighlight?: boolean;
  }> = ({ title, content, section, className = "", isHighlight = false }) => (
    <Card className={`h-full transition-all duration-200 hover:shadow-md ${
      isHighlight 
        ? "bg-gradient-to-br from-bmc-orange/15 to-bmc-orange-light/10 border-2 border-bmc-orange/50 shadow-lg" 
        : "bg-card border border-border hover:border-bmc-orange/30"
    } ${className}`}>
      <CardHeader className="pb-2 px-4 pt-4">
        <CardTitle className={`text-sm font-bold text-center ${
          isHighlight ? "text-bmc-orange-dark" : "text-foreground"
        }`}>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 px-4 pb-4 flex-1 overflow-hidden">
        {isEditable ? (
          <textarea
            value={content}
            onChange={(e) => handleSectionChange(section, e.target.value)}
            className="w-full h-full min-h-[120px] text-sm resize-none border-none outline-none bg-transparent placeholder-muted-foreground focus:bg-background/50 rounded p-2"
            placeholder={`Enter ${title.toLowerCase()}...`}
          />
        ) : (
          <div className="text-xs text-bmc-text leading-tight overflow-y-auto max-h-full break-words">
            {content ? formatContent(content) : (
              <span className="text-muted-foreground italic text-center block text-xs">
                No content generated
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div id="bmc-canvas" className="bmc-container w-full max-w-[1100px] mx-auto p-4 bg-background border border-bmc-orange/30 rounded-lg print:shadow-none print:border-gray-400">
      {companyName && (
        <div className="text-center mb-3">
          <h1 className="text-lg font-bold text-bmc-orange-dark mb-1">
            Business Model Canvas
          </h1>
          <p className="text-sm text-bmc-text font-medium">
            {companyName}
          </p>
        </div>
      )}
      
      {/* Standard BMC Layout matching the reference */}
      <div className="space-y-2">
        {/* Top row: All 5 sections */}
        <div className="grid grid-cols-5 gap-2 h-48">
          <SectionCard
            title="Key Partners"
            content={data?.keyPartners || ''}
            section="keyPartners"
            className="h-full"
          />
          
          <SectionCard
            title="Key Activities"
            content={data?.keyActivities || ''}
            section="keyActivities"
            className="h-full"
          />
          
          <SectionCard
            title="Value Propositions"
            content={data?.valuePropositions || ''}
            section="valuePropositions"
            className="h-full"
            isHighlight={true}
          />
          
          <SectionCard
            title="Customer Relationships"
            content={data?.customerRelationships || ''}
            section="customerRelationships"
            className="h-full"
          />
          
          <SectionCard
            title="Customer Segments"
            content={data?.customerSegments || ''}
            section="customerSegments"
            className="h-full"
          />
        </div>

        {/* Middle row: Key Resources, empty space for Value Props continuation, Channels */}
        <div className="grid grid-cols-5 gap-2 h-32">
          <SectionCard
            title="Key Resources"
            content={data?.keyResources || ''}
            section="keyResources"
            className="h-full"
          />
          
          {/* Empty space for columns 2 and 3 (Value Propositions continues visually) */}
          <div className="col-span-3"></div>
          
          <SectionCard
            title="Channels"
            content={data?.channels || ''}
            section="channels"
            className="h-full"
          />
        </div>

        {/* Bottom row: Cost Structure and Revenue Streams */}
        <div className="grid grid-cols-2 gap-2 h-28">
          <SectionCard
            title="Cost Structure"
            content={data?.costStructure || ''}
            section="costStructure"
            className="h-full"
          />
          
          <SectionCard
            title="Revenue Streams"
            content={data?.revenueStreams || ''}
            section="revenueStreams"
            className="h-full"
            isHighlight={true}
          />
        </div>
      </div>
    </div>
  );
};

export default BusinessModelCanvas;