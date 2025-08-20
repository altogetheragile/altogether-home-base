import React, { useRef, useImperativeHandle } from 'react';
import BaseCanvas, { BaseCanvasRef, CanvasData } from '../BaseCanvas';
import { ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import TextElement from '../elements/TextElement';
import { cn } from '@/lib/utils';

export interface BMCData {
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

interface BMCCanvasProps {
  data?: BMCData;
  isEditable?: boolean;
  onDataChange?: (data: BMCData) => void;
  companyName?: string;
  className?: string;
}

export interface BMCCanvasRef extends BaseCanvasRef {
  getBMCData: () => BMCData;
}

const BMCCanvas = React.forwardRef<BMCCanvasRef, BMCCanvasProps>(({
  data,
  isEditable = false,
  onDataChange,
  companyName,
  className,
}, ref) => {
  const baseCanvasRef = useRef<BaseCanvasRef>(null);

  const defaultData: BMCData = {
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

  const bmcData = { ...defaultData, ...data };

  const handleSectionChange = (section: keyof BMCData, content: string) => {
    const newData = { ...bmcData, [section]: content };
    onDataChange?.(newData);
  };

  const getBMCData = (): BMCData => bmcData;

  useImperativeHandle(ref, () => ({
    ...baseCanvasRef.current!,
    getBMCData,
  }));

  const SectionHeader = ({ title, color = 'bg-primary/10' }: { title: string; color?: string }) => (
    <div className={cn('p-2 border-b border-border/50 font-medium text-sm text-center', color)}>
      {title}
    </div>
  );

  const BMCSection = ({ 
    title, 
    value, 
    onChange, 
    placeholder,
    headerColor = 'bg-primary/10'
  }: { 
    title: string; 
    value: string; 
    onChange: (value: string) => void;
    placeholder: string;
    headerColor?: string;
  }) => (
    <div className="h-full flex flex-col bg-card border border-border/50 rounded-md overflow-hidden">
      <SectionHeader title={title} color={headerColor} />
      <div className="flex-1 p-1">
        <TextElement
          content={value}
          isEditable={isEditable}
          onChange={onChange}
          placeholder={placeholder}
          fontSize="xs"
          autoResize={false}
          className="h-full"
        />
      </div>
    </div>
  );

  return (
    <div className={cn('w-full h-full', className)}>
      {companyName && (
        <div className="text-center mb-4 p-4 bg-card border border-border rounded-lg">
          <h1 className="text-lg font-bold text-foreground mb-1">
            Business Model Canvas
          </h1>
          <p className="text-sm text-muted-foreground font-medium">
            {companyName}
          </p>
        </div>
      )}
      
      <BaseCanvas
        ref={baseCanvasRef}
        layout="template"
        direction="vertical"
        className="min-h-[600px]"
        data-canvas="true"
      >
        {/* Top Row */}
        <ResizablePanel defaultSize={40} minSize={30}>
          <div className="h-full">
            <BaseCanvas layout="template" direction="horizontal">
              {/* Key Partners */}
              <ResizablePanel defaultSize={20} minSize={15}>
                <BMCSection
                  title="Key Partners"
                  value={bmcData.keyPartners}
                  onChange={(value) => handleSectionChange('keyPartners', value)}
                  placeholder="Who are your key partners and suppliers?"
                  headerColor="bg-blue-100 dark:bg-blue-900/30"
                />
              </ResizablePanel>
              
              <ResizableHandle withHandle />
              
              {/* Key Activities and Resources */}
              <ResizablePanel defaultSize={20} minSize={15}>
                <BaseCanvas layout="template" direction="vertical">
                  <ResizablePanel defaultSize={50}>
                    <BMCSection
                      title="Key Activities"
                      value={bmcData.keyActivities}
                      onChange={(value) => handleSectionChange('keyActivities', value)}
                      placeholder="What key activities does your business require?"
                      headerColor="bg-green-100 dark:bg-green-900/30"
                    />
                  </ResizablePanel>
                  
                  <ResizableHandle withHandle />
                  
                  <ResizablePanel defaultSize={50}>
                    <BMCSection
                      title="Key Resources"
                      value={bmcData.keyResources}
                      onChange={(value) => handleSectionChange('keyResources', value)}
                      placeholder="What key resources does your business require?"
                      headerColor="bg-green-100 dark:bg-green-900/30"
                    />
                  </ResizablePanel>
                </BaseCanvas>
              </ResizablePanel>
              
              <ResizableHandle withHandle />
              
              {/* Value Propositions */}
              <ResizablePanel defaultSize={20} minSize={15}>
                <BMCSection
                  title="Value Propositions"
                  value={bmcData.valuePropositions}
                  onChange={(value) => handleSectionChange('valuePropositions', value)}
                  placeholder="What value do you deliver to customers?"
                  headerColor="bg-yellow-100 dark:bg-yellow-900/30"
                />
              </ResizablePanel>
              
              <ResizableHandle withHandle />
              
              {/* Customer Relationships and Channels */}
              <ResizablePanel defaultSize={20} minSize={15}>
                <BaseCanvas layout="template" direction="vertical">
                  <ResizablePanel defaultSize={50}>
                    <BMCSection
                      title="Customer Relationships"
                      value={bmcData.customerRelationships}
                      onChange={(value) => handleSectionChange('customerRelationships', value)}
                      placeholder="What relationships do you establish with customers?"
                      headerColor="bg-orange-100 dark:bg-orange-900/30"
                    />
                  </ResizablePanel>
                  
                  <ResizableHandle withHandle />
                  
                  <ResizablePanel defaultSize={50}>
                    <BMCSection
                      title="Channels"
                      value={bmcData.channels}
                      onChange={(value) => handleSectionChange('channels', value)}
                      placeholder="Through which channels do you reach customers?"
                      headerColor="bg-orange-100 dark:bg-orange-900/30"
                    />
                  </ResizablePanel>
                </BaseCanvas>
              </ResizablePanel>
              
              <ResizableHandle withHandle />
              
              {/* Customer Segments */}
              <ResizablePanel defaultSize={20} minSize={15}>
                <BMCSection
                  title="Customer Segments"
                  value={bmcData.customerSegments}
                  onChange={(value) => handleSectionChange('customerSegments', value)}
                  placeholder="Who are your most important customers?"
                  headerColor="bg-red-100 dark:bg-red-900/30"
                />
              </ResizablePanel>
            </BaseCanvas>
          </div>
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        {/* Bottom Row */}
        <ResizablePanel defaultSize={60} minSize={40}>
          <BaseCanvas layout="template" direction="horizontal">
            {/* Cost Structure */}
            <ResizablePanel defaultSize={50}>
              <BMCSection
                title="Cost Structure"
                value={bmcData.costStructure}
                onChange={(value) => handleSectionChange('costStructure', value)}
                placeholder="What are the most important costs in your business model?"
                headerColor="bg-purple-100 dark:bg-purple-900/30"
              />
            </ResizablePanel>
            
            <ResizableHandle withHandle />
            
            {/* Revenue Streams */}
            <ResizablePanel defaultSize={50}>
              <BMCSection
                title="Revenue Streams"
                value={bmcData.revenueStreams}
                onChange={(value) => handleSectionChange('revenueStreams', value)}
                placeholder="What revenue streams generate income?"
                headerColor="bg-indigo-100 dark:bg-indigo-900/30"
              />
            </ResizablePanel>
          </BaseCanvas>
        </ResizablePanel>
      </BaseCanvas>
    </div>
  );
});

BMCCanvas.displayName = 'BMCCanvas';

export default BMCCanvas;