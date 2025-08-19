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
        <div key={index} className="mb-2 text-sm leading-relaxed">
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
          <div className="text-sm text-bmc-text space-y-2 overflow-y-auto max-h-full">
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
    <div id="bmc-canvas" className="bmc-container w-full max-w-[1400px] mx-auto p-6 bg-background border-2 border-bmc-orange/20 rounded-xl shadow-xl print:shadow-none print:border-gray-400">
      {companyName && (
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold text-bmc-orange-dark mb-1">
            Business Model Canvas
          </h1>
          <p className="text-lg text-bmc-text font-medium">
            {companyName}
          </p>
        </div>
      )}
      
      {/* Standard BMC Layout - 5 Columns */}
      <div className="space-y-3">
        {/* Top Row - 5 Equal Columns */}
        <div className="grid grid-cols-5 gap-3">
          <SectionCard
            title="Key Partners"
            content={data?.keyPartners || ''}
            section="keyPartners"
            className="h-48"
          />
          
          <SectionCard
            title="Key Activities"
            content={data?.keyActivities || ''}
            section="keyActivities"
            className="h-48"
          />
          
          <SectionCard
            title="Value Propositions"
            content={data?.valuePropositions || ''}
            section="valuePropositions"
            className="h-48"
            isHighlight={true}
          />
          
          <SectionCard
            title="Customer Relationships"
            content={data?.customerRelationships || ''}
            section="customerRelationships"
            className="h-48"
          />
          
          <SectionCard
            title="Customer Segments"
            content={data?.customerSegments || ''}
            section="customerSegments"
            className="h-48"
          />
        </div>

        {/* Middle Row - Key Resources and Channels */}
        <div className="grid grid-cols-5 gap-3">
          <SectionCard
            title="Key Resources"
            content={data?.keyResources || ''}
            section="keyResources"
            className="h-32"
          />
          
          <div className="col-span-3"></div>
          
          <SectionCard
            title="Channels"
            content={data?.channels || ''}
            section="channels"
            className="h-32"
          />
        </div>

        {/* Bottom Row - Cost Structure and Revenue Streams */}
        <div className="grid grid-cols-2 gap-3">
          <SectionCard
            title="Cost Structure"
            content={data?.costStructure || ''}
            section="costStructure"
            className="h-40"
          />
          
          <SectionCard
            title="Revenue Streams"
            content={data?.revenueStreams || ''}
            section="revenueStreams"
            className="h-40"
            isHighlight={true}
          />
        </div>
      </div>
    </div>
  );
};

export default BusinessModelCanvas;