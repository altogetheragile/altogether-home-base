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
    style?: React.CSSProperties;
    isHighlight?: boolean;
  }> = ({ title, content, section, className = "", style, isHighlight = false }) => (
    <Card 
      className={`flex flex-col transition-all duration-200 hover:shadow-md ${
        isHighlight 
          ? "bg-primary/10 border-2 border-primary shadow-lg" 
          : "bg-card border border-border hover:border-primary/30"
      } ${className}`}
      style={style}
    >
      <CardHeader className="pb-2 px-3 pt-3 print:px-2 print:pt-2 flex-shrink-0">
        <CardTitle className={`text-xs font-bold text-center print:text-[10px] ${
          isHighlight ? "text-primary" : "text-foreground"
        }`}>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 px-3 pb-3 flex-1 print:px-2 print:pb-2">
        {isEditable ? (
          <textarea
            value={content}
            onChange={(e) => handleSectionChange(section, e.target.value)}
            className="w-full h-full min-h-[80px] text-xs resize-none border-none outline-none bg-transparent placeholder-muted-foreground focus:bg-background/50 rounded p-1 print:text-[9px] overflow-hidden"
            placeholder={`Enter ${title.toLowerCase()}...`}
            style={{ 
              height: 'auto',
              minHeight: '80px',
              maxHeight: 'none'
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${target.scrollHeight}px`;
            }}
          />
        ) : (
          <div className="text-xs text-foreground leading-tight break-words hyphens-auto print:text-[9px] print:leading-tight">
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
    <div id="bmc-canvas" className="bmc-container w-full max-w-[1200px] mx-auto p-4 bg-background border border-primary/30 rounded-lg print:shadow-none print:border-gray-400 print:p-2">
      {companyName && (
        <div className="text-center mb-4">
          <h1 className="text-xl font-bold text-primary mb-1 print:text-lg">
            Business Model Canvas
          </h1>
          <p className="text-sm text-foreground font-medium print:text-xs">
            {companyName}
          </p>
        </div>
      )}
      
      {/* Traditional BMC Layout using CSS Grid with proper fractional units */}
      <div 
        className="bmc-grid gap-2 print:gap-1" 
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr',
          gridTemplateRows: 'auto auto auto',
          width: '100%'
        }}
      >
        {/* Row 1 - Top sections */}
        <SectionCard
          title="Key Partners"
          content={data?.keyPartners || ''}
          section="keyPartners"
          className="row-span-2"
          style={{ gridColumn: '1 / 2', gridRow: '1 / 3' }}
        />
        
        <SectionCard
          title="Key Activities"
          content={data?.keyActivities || ''}
          section="keyActivities"
          style={{ gridColumn: '2 / 3', gridRow: '1 / 2' }}
        />
        
        <SectionCard
          title="Value Propositions"
          content={data?.valuePropositions || ''}
          section="valuePropositions"
          className="row-span-2"
          style={{ gridColumn: '3 / 4', gridRow: '1 / 3' }}
          isHighlight={true}
        />
        
        <SectionCard
          title="Customer Relationships"
          content={data?.customerRelationships || ''}
          section="customerRelationships"
          style={{ gridColumn: '4 / 5', gridRow: '1 / 2' }}
        />
        
        <SectionCard
          title="Customer Segments"
          content={data?.customerSegments || ''}
          section="customerSegments"
          className="row-span-2"
          style={{ gridColumn: '5 / 6', gridRow: '1 / 3' }}
        />

        {/* Row 2 - Middle sections */}
        <SectionCard
          title="Key Resources"
          content={data?.keyResources || ''}
          section="keyResources"
          style={{ gridColumn: '2 / 3', gridRow: '2 / 3' }}
        />
        
        <SectionCard
          title="Channels"
          content={data?.channels || ''}
          section="channels"
          style={{ gridColumn: '4 / 5', gridRow: '2 / 3' }}
        />

        {/* Row 3 - Bottom sections - Equal width spanning 2.5 columns each */}
        <SectionCard
          title="Cost Structure"
          content={data?.costStructure || ''}
          section="costStructure"
          style={{ gridColumn: '1 / 3.5', gridRow: '3 / 4' }}
        />
        
        <SectionCard
          title="Revenue Streams"
          content={data?.revenueStreams || ''}
          section="revenueStreams"
          style={{ gridColumn: '3.5 / 6', gridRow: '3 / 4' }}
          isHighlight={true}
        />
      </div>
    </div>
  );
};

export default BusinessModelCanvas;