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

  const formatBulletPoints = (text: string) => {
    return text.split('\n').map((line, index) => (
      <div key={index} className="mb-1">
        {line}
      </div>
    ));
  };

  const SectionCard: React.FC<{
    title: string;
    content: string;
    section: keyof BMCData;
    className?: string;
  }> = ({ title, content, section, className = "" }) => (
    <Card className={`h-full ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-center">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {isEditable ? (
          <textarea
            value={content}
            onChange={(e) => handleSectionChange(section, e.target.value)}
            className="w-full h-24 text-xs resize-none border-none outline-none bg-transparent"
            placeholder={`Enter ${title.toLowerCase()}...`}
          />
        ) : (
          <div className="text-xs leading-relaxed">
            {content ? formatBulletPoints(content) : (
              <span className="text-muted-foreground italic">
                No content generated
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      {companyName && (
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-foreground">
            Business Model Canvas
          </h2>
          <p className="text-lg text-muted-foreground mt-1">
            {companyName}
          </p>
        </div>
      )}
      
      <div className="grid grid-cols-5 grid-rows-3 gap-4 h-[600px]">
        {/* Row 1 */}
        <SectionCard
          title="Key Partners"
          content={data?.keyPartners || ''}
          section="keyPartners"
        />
        <SectionCard
          title="Key Activities"
          content={data?.keyActivities || ''}
          section="keyActivities"
        />
        <SectionCard
          title="Value Propositions"
          content={data?.valuePropositions || ''}
          section="valuePropositions"
          className="bg-primary/5 border-primary/20"
        />
        <SectionCard
          title="Customer Relationships"
          content={data?.customerRelationships || ''}
          section="customerRelationships"
        />
        <SectionCard
          title="Customer Segments"
          content={data?.customerSegments || ''}
          section="customerSegments"
        />

        {/* Row 2 */}
        <SectionCard
          title="Key Resources"
          content={data?.keyResources || ''}
          section="keyResources"
        />
        <div className="col-span-3 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <div className="text-4xl mb-2">💡</div>
            <p className="text-sm">
              {companyName ? `${companyName} Business Model` : 'Business Model Canvas'}
            </p>
          </div>
        </div>
        <SectionCard
          title="Channels"
          content={data?.channels || ''}
          section="channels"
        />

        {/* Row 3 */}
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
          />
        </div>
      </div>
    </div>
  );
};

export default BusinessModelCanvas;