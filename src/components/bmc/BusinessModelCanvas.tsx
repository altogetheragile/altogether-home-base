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
      <CardHeader className="pb-2 px-3 pt-3 print:px-2 print:pt-2">
        <CardTitle className={`text-xs font-bold text-center print:text-[10px] ${
          isHighlight ? "text-bmc-orange-dark" : "text-foreground"
        }`}>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 px-3 pb-3 flex-1 overflow-hidden print:px-2 print:pb-2">
        {isEditable ? (
          <textarea
            value={content}
            onChange={(e) => handleSectionChange(section, e.target.value)}
            className="w-full h-full min-h-[80px] text-xs resize-none border-none outline-none bg-transparent placeholder-muted-foreground focus:bg-background/50 rounded p-1 print:text-[9px]"
            placeholder={`Enter ${title.toLowerCase()}...`}
          />
        ) : (
          <div className="text-xs text-bmc-text leading-tight overflow-y-auto max-h-full break-words hyphens-auto print:text-[9px] print:leading-none">
            {content ? formatContent(content) : (
              <span className="text-muted-foreground italic text-center block text-xs print:text-[8px]">
                No content generated
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div id="bmc-canvas" className="bmc-container w-full max-w-[1200px] mx-auto p-4 bg-background border border-bmc-orange/30 rounded-lg print:shadow-none print:border-gray-400 print:p-2">
      {companyName && (
        <div className="text-center mb-4">
          <h1 className="text-xl font-bold text-bmc-orange-dark mb-1 print:text-lg">
            Business Model Canvas
          </h1>
          <p className="text-sm text-bmc-text font-medium print:text-xs">
            {companyName}
          </p>
        </div>
      )}
      
      {/* Traditional BMC Layout - 3x3 Grid Structure */}
      <div className="grid grid-cols-5 grid-rows-3 gap-2 h-[600px] print:h-[500px]">
        {/* Row 1 */}
        <SectionCard
          title="Key Partners"
          content={data?.keyPartners || ''}
          section="keyPartners"
          className="row-span-2"
        />
        
        <SectionCard
          title="Key Activities"
          content={data?.keyActivities || ''}
          section="keyActivities"
          className=""
        />
        
        <SectionCard
          title="Value Propositions"
          content={data?.valuePropositions || ''}
          section="valuePropositions"
          className="row-span-2"
          isHighlight={true}
        />
        
        <SectionCard
          title="Customer Relationships"
          content={data?.customerRelationships || ''}
          section="customerRelationships"
          className=""
        />
        
        <SectionCard
          title="Customer Segments"
          content={data?.customerSegments || ''}
          section="customerSegments"
          className="row-span-2"
        />

        {/* Row 2 - Only Key Resources and Channels (others span from row 1) */}
        <SectionCard
          title="Key Resources"
          content={data?.keyResources || ''}
          section="keyResources"
          className=""
        />
        
        <SectionCard
          title="Channels"
          content={data?.channels || ''}
          section="channels"
          className=""
        />

        {/* Row 3 - Cost Structure and Revenue Streams */}
        <SectionCard
          title="Cost Structure"
          content={data?.costStructure || ''}
          section="costStructure"
          className="col-span-2"
        />
        
        <SectionCard
          title="Revenue Streams"
          content={data?.revenueStreams || ''}
          section="revenueStreams"
          className="col-span-2"
          isHighlight={true}
        />
      </div>
    </div>
  );
};

export default BusinessModelCanvas;