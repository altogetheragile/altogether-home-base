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
        ? "bg-gradient-to-br from-bmc-orange/10 to-bmc-orange-light/5 border-bmc-orange/30" 
        : "bg-card border-border/60 hover:border-bmc-orange/20"
    } ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className={`text-sm font-bold text-center ${
          isHighlight ? "text-bmc-orange-dark" : "text-foreground"
        }`}>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 px-4 pb-4">
        {isEditable ? (
          <textarea
            value={content}
            onChange={(e) => handleSectionChange(section, e.target.value)}
            className="w-full h-28 text-xs resize-none border-none outline-none bg-transparent placeholder-muted-foreground focus:bg-background/50 rounded p-2"
            placeholder={`Enter ${title.toLowerCase()}...`}
          />
        ) : (
          <div className="text-xs text-bmc-text space-y-1">
            {content ? formatContent(content) : (
              <span className="text-muted-foreground italic text-center block">
                No content generated
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div id="bmc-canvas" className="bmc-container w-full max-w-7xl mx-auto p-6 bg-gradient-to-br from-background to-bmc-accent/10">
      {companyName && (
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-bmc-orange to-bmc-orange-dark rounded-full mb-4 shadow-lg">
            <span className="text-white font-bold text-xl">
              {companyName.charAt(0).toUpperCase()}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-bmc-orange-dark mb-2">
            Business Model Canvas
          </h1>
          <p className="text-xl text-bmc-text font-medium">
            {companyName}
          </p>
        </div>
      )}
      
      <div className="grid grid-cols-5 gap-4 min-h-[700px]">
        {/* Row 1 */}
        <div className="row-span-2">
          <SectionCard
            title="Key Partners"
            content={data?.keyPartners || ''}
            section="keyPartners"
            className="h-full"
          />
        </div>
        
        <SectionCard
          title="Key Activities"
          content={data?.keyActivities || ''}
          section="keyActivities"
        />
        
        <SectionCard
          title="Value Propositions"
          content={data?.valuePropositions || ''}
          section="valuePropositions"
          isHighlight={true}
        />
        
        <SectionCard
          title="Customer Relationships"
          content={data?.customerRelationships || ''}
          section="customerRelationships"
        />
        
        <div className="row-span-2">
          <SectionCard
            title="Customer Segments"
            content={data?.customerSegments || ''}
            section="customerSegments"
            className="h-full"
          />
        </div>

        {/* Row 2 */}
        <SectionCard
          title="Key Resources"
          content={data?.keyResources || ''}
          section="keyResources"
        />
        
        <div className="flex items-center justify-center bg-gradient-to-r from-bmc-orange/5 to-bmc-orange-light/5 rounded-lg border border-bmc-orange/20">
          <div className="text-center text-bmc-text p-4">
            <div className="text-6xl mb-3 filter drop-shadow-sm">💡</div>
            <p className="text-sm font-semibold text-bmc-orange-dark">
              {companyName ? `${companyName} Strategy` : 'Business Innovation'}
            </p>
          </div>
        </div>
        
        <SectionCard
          title="Channels"
          content={data?.channels || ''}
          section="channels"
        />

        {/* Row 3 - Full width sections */}
        <div className="col-span-2">
          <SectionCard
            title="Cost Structure"
            content={data?.costStructure || ''}
            section="costStructure"
            className="h-full"
          />
        </div>
        
        <div className="col-span-3">
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