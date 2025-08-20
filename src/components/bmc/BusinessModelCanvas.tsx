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
        <div key={index} className="mb-1 text-xs leading-relaxed break-words overflow-wrap-anywhere hyphens-auto">
          {trimmedLine}
        </div>
      );
    }).filter(Boolean);
  };

  const SectionCard: React.FC<{
    title: string;
    content: string;
    section: keyof BMCData;
    gridArea: string;
    isHighlight?: boolean;
  }> = ({ title, content, section, gridArea, isHighlight = false }) => (
    <Card 
      className={`flex flex-col min-h-0 ${
        isHighlight 
          ? "bg-bmc-orange/10 border-2 border-bmc-orange shadow-md" 
          : "bg-card border border-border"
      }`}
      style={{ gridArea }}
    >
      <CardHeader className="pb-2 px-3 pt-3 flex-shrink-0">
        <CardTitle className={`text-xs font-bold text-center ${
          isHighlight ? "text-bmc-orange" : "text-foreground"
        }`}>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 px-3 pb-3 flex-1 min-h-0 overflow-auto">
        {isEditable ? (
          <textarea
            value={content}
            onChange={(e) => handleSectionChange(section, e.target.value)}
            className="w-full h-full min-h-[120px] text-xs resize-none border-none outline-none bg-transparent placeholder-muted-foreground p-1 leading-relaxed"
            placeholder={`Enter ${title.toLowerCase()}...`}
          />
        ) : (
          <div className="text-xs text-foreground leading-relaxed break-words overflow-wrap-anywhere hyphens-auto">
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
      
      <div 
        className="bmc-grid w-full gap-4"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr',
          gridTemplateRows: 'minmax(180px, auto) minmax(180px, auto) minmax(140px, auto)',
          gridTemplateAreas: `
            "partners activities value relationships segments"
            "partners resources value channels segments"
            "costs costs costs revenue revenue"
          `,
          minHeight: '500px'
        }}
      >
        <SectionCard
          title="Key Partners"
          content={data?.keyPartners || ''}
          section="keyPartners"
          gridArea="partners"
        />
        
        <SectionCard
          title="Key Activities"
          content={data?.keyActivities || ''}
          section="keyActivities"
          gridArea="activities"
        />
        
        <SectionCard
          title="Value Propositions"
          content={data?.valuePropositions || ''}
          section="valuePropositions"
          gridArea="value"
          isHighlight={true}
        />
        
        <SectionCard
          title="Customer Relationships"
          content={data?.customerRelationships || ''}
          section="customerRelationships"
          gridArea="relationships"
        />
        
        <SectionCard
          title="Customer Segments"
          content={data?.customerSegments || ''}
          section="customerSegments"
          gridArea="segments"
        />

        <SectionCard
          title="Key Resources"
          content={data?.keyResources || ''}
          section="keyResources"
          gridArea="resources"
        />
        
        <SectionCard
          title="Channels"
          content={data?.channels || ''}
          section="channels"
          gridArea="channels"
        />

        <SectionCard
          title="Cost Structure"
          content={data?.costStructure || ''}
          section="costStructure"
          gridArea="costs"
        />
        
        <SectionCard
          title="Revenue Streams"
          content={data?.revenueStreams || ''}
          section="revenueStreams"
          gridArea="revenue"
          isHighlight={true}
        />
      </div>
    </div>
  );
};

export default BusinessModelCanvas;