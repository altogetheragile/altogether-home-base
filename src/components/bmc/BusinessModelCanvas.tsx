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
    
    return text.split('\n').map((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return null;
      
      return (
        <div key={index} className="mb-1 text-xs leading-relaxed break-words">
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
    <Card 
      className={`flex flex-col ${
        isHighlight 
          ? "bg-bmc-accent border-bmc-orange shadow-md" 
          : "bg-card border border-border"
      } ${className}`}
      data-section={section}
    >
      <CardHeader className="pb-2 px-3 pt-3 flex-shrink-0">
        <CardTitle className={`text-xs font-bold text-center ${
          isHighlight ? "text-bmc-orange" : "text-foreground"
        }`}>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 px-3 pb-3 flex-1 overflow-auto">
        {isEditable ? (
          <textarea
            value={content}
            onChange={(e) => handleSectionChange(section, e.target.value)}
            className="w-full h-full min-h-[100px] text-xs resize-none border-none outline-none bg-transparent placeholder-muted-foreground p-1 leading-relaxed"
            placeholder={`Enter ${title.toLowerCase()}...`}
          />
        ) : (
          <div className="text-xs text-foreground leading-relaxed break-words">
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
    <div id="bmc-canvas" className="w-full max-w-[1200px] mx-auto p-6 bg-background border border-border rounded-lg">
      {companyName && (
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-foreground mb-1">
            Business Model Canvas
          </h1>
          <p className="text-sm text-muted-foreground font-medium">
            {companyName}
          </p>
        </div>
      )}
      
      {/* Flexbox Layout - Replacing CSS Grid */}
      <div className="flex flex-col gap-4 h-[640px]">
        {/* Top Row */}
        <div className="flex gap-4 h-[200px]">
          <SectionCard
            title="Key Partners"
            content={data?.keyPartners || ''}
            section="keyPartners"
            className="flex-1"
          />
          <SectionCard
            title="Key Activities"
            content={data?.keyActivities || ''}
            section="keyActivities"
            className="flex-1"
          />
          <SectionCard
            title="Value Propositions"
            content={data?.valuePropositions || ''}
            section="valuePropositions"
            className="flex-1"
            isHighlight={true}
          />
          <SectionCard
            title="Customer Relationships"
            content={data?.customerRelationships || ''}
            section="customerRelationships"
            className="flex-1"
          />
          <SectionCard
            title="Customer Segments"
            content={data?.customerSegments || ''}
            section="customerSegments"
            className="flex-1"
          />
        </div>

        {/* Middle Row */}
        <div className="flex gap-4 h-[200px]">
          <div className="flex-1"></div> {/* Empty space for Key Partners */}
          <SectionCard
            title="Key Resources"
            content={data?.keyResources || ''}
            section="keyResources"
            className="flex-1"
          />
          <div className="flex-1"></div> {/* Empty space for Value Propositions */}
          <SectionCard
            title="Channels"
            content={data?.channels || ''}
            section="channels"
            className="flex-1"
          />
          <div className="flex-1"></div> {/* Empty space for Customer Segments */}
        </div>

        {/* Bottom Row */}
        <div className="flex gap-4 h-[200px]">
          <SectionCard
            title="Cost Structure"
            content={data?.costStructure || ''}
            section="costStructure"
            className="flex-[3]"
          />
          <SectionCard
            title="Revenue Streams"
            content={data?.revenueStreams || ''}
            section="revenueStreams"
            className="flex-[2]"
            isHighlight={true}
          />
        </div>
      </div>
    </div>
  );
};

export default BusinessModelCanvas;