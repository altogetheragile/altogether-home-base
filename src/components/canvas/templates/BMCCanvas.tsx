import React, { useRef, useImperativeHandle, useState } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import TextElement from '../elements/TextElement';
import FormattedTextDisplay from '../elements/FormattedTextDisplay';
import { cn } from '@/lib/utils';

interface ExportOptions {
  format?: 'png' | 'pdf';
  quality?: number;
  filename?: string;
}

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

export interface BMCCanvasRef {
  exportCanvas: (options?: ExportOptions) => Promise<string>;
  getBMCData: () => BMCData;
  setExportMode: (isExporting: boolean) => void;
}

const BMCCanvas = React.forwardRef<BMCCanvasRef, BMCCanvasProps>(({
  data,
  isEditable = false,
  onDataChange,
  companyName,
  className,
}, ref) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

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

  const exportCanvas = async (options: ExportOptions = {}): Promise<string> => {
    if (!canvasRef.current) {
      throw new Error('Canvas not available for export');
    }

    try {
      // Set export mode to force non-editable text rendering
      console.log('Setting export mode to true');
      setIsExporting(true);
      
      // Wait for React to re-render with non-editable TextElements
      await new Promise(resolve => setTimeout(resolve, 300));

      const { default: html2canvas } = await import('html2canvas');
      
      const canvas = await html2canvas(canvasRef.current, {
        backgroundColor: 'white',
        scale: options.quality || 2,
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: false,
        logging: false,
        width: canvasRef.current.offsetWidth,
        height: canvasRef.current.offsetHeight,
        onclone: (clonedDoc) => {
          // Ensure all textarea elements are converted to divs in the clone
          const textareas = clonedDoc.querySelectorAll('textarea');
          textareas.forEach(textarea => {
            const div = clonedDoc.createElement('div');
            div.textContent = textarea.value;
            div.style.cssText = textarea.style.cssText;
            div.className = textarea.className;
            textarea.parentNode?.replaceChild(div, textarea);
          });
        }
      });

      console.log('Export canvas created, dimensions:', canvas.width, 'x', canvas.height);

    if (options.format === 'pdf') {
      const { default: jsPDF } = await import('jspdf');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const canvasAspectRatio = canvas.width / canvas.height;
      let imgWidth = pdfWidth - 20;
      let imgHeight = imgWidth / canvasAspectRatio;
      
      if (imgHeight > pdfHeight - 20) {
        imgHeight = pdfHeight - 20;
        imgWidth = imgHeight * canvasAspectRatio;
      }
      
      const x = (pdfWidth - imgWidth) / 2;
      const y = (pdfHeight - imgHeight) / 2;
      
      pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
      return pdf.output('dataurlstring');
    }

      return canvas.toDataURL('image/png');
    } finally {
      // Always reset export mode
      console.log('Resetting export mode to false');
      setIsExporting(false);
    }
  };

  useImperativeHandle(ref, () => ({
    exportCanvas,
    getBMCData,
    setExportMode: setIsExporting,
  }));

  const SectionHeader = ({ title, color = 'bg-primary/10' }: { title: string; color?: string }) => (
    <div className={cn('p-1 border-b border-border/50 font-medium text-xs text-center', color)}>
      {title}
    </div>
  );

  const BMCSection = ({ 
    title, 
    value, 
    onChange, 
    placeholder,
    headerColor = 'bg-primary/10',
    sectionType
  }: { 
    title: string; 
    value: string; 
    onChange: (value: string) => void;
    placeholder: string;
    headerColor?: string;
    sectionType?: 'partners' | 'activities' | 'resources' | 'value' | 'relationships' | 'channels' | 'segments' | 'costs' | 'revenue';
  }) => (
    <div className="h-full flex flex-col bg-card border-2 border-border/30 overflow-hidden shadow-sm">
      <SectionHeader title={title} color={headerColor} />
      <div className="flex-1 p-1 min-h-[120px]">
        {isEditable && !isExporting ? (
          <TextElement
            content={value}
            isEditable={true}
            onChange={onChange}
            placeholder={placeholder}
            fontSize="xs"
            autoResize={false}
            className="h-full"
          />
        ) : (
          <FormattedTextDisplay
            content={value}
            placeholder={placeholder}
            className="h-full"
            sectionType={sectionType}
          />
        )}
      </div>
    </div>
  );

  return (
    <div className={cn('w-full h-full', className)} ref={canvasRef} data-canvas="true">
      {companyName && (
        <div className="text-center mb-1 p-1 bg-card border border-border rounded">
          <div className="flex items-center justify-center gap-2 text-xs">
            <span className="font-bold text-foreground">Business Model Canvas</span>
            <span className="text-muted-foreground">-</span>
            <span className="font-medium text-foreground">{companyName}</span>
          </div>
        </div>
      )}
      
      <div className="w-full min-h-[600px] max-h-[800px] bg-background border border-border overflow-hidden">
        <ResizablePanelGroup direction="vertical" className="h-full">
          {/* Top Row */}
          <ResizablePanel defaultSize={60} minSize={40}>
            <ResizablePanelGroup direction="horizontal" className="h-full">
              {/* Key Partners */}
              <ResizablePanel defaultSize={20} minSize={15}>
                <BMCSection
                  title="Key Partners"
                  value={bmcData.keyPartners}
                  onChange={(value) => handleSectionChange('keyPartners', value)}
                  placeholder="Who are your key partners and suppliers?"
                  headerColor="bg-blue-100 dark:bg-blue-900/30"
                  sectionType="partners"
                />
              </ResizablePanel>
              
              <ResizableHandle withHandle />
              
              {/* Key Activities and Resources */}
              <ResizablePanel defaultSize={20} minSize={15}>
                <ResizablePanelGroup direction="vertical" className="h-full">
                  <ResizablePanel defaultSize={50}>
                    <BMCSection
                      title="Key Activities"
                      value={bmcData.keyActivities}
                      onChange={(value) => handleSectionChange('keyActivities', value)}
                      placeholder="What key activities does your business require?"
                      headerColor="bg-green-100 dark:bg-green-900/30"
                      sectionType="activities"
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
                      sectionType="resources"
                    />
                  </ResizablePanel>
                </ResizablePanelGroup>
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
                  sectionType="value"
                />
              </ResizablePanel>
              
              <ResizableHandle withHandle />
              
              {/* Customer Relationships and Channels */}
              <ResizablePanel defaultSize={20} minSize={15}>
                <ResizablePanelGroup direction="vertical" className="h-full">
                  <ResizablePanel defaultSize={50}>
                    <BMCSection
                      title="Customer Relationships"
                      value={bmcData.customerRelationships}
                      onChange={(value) => handleSectionChange('customerRelationships', value)}
                      placeholder="What relationships do you establish with customers?"
                      headerColor="bg-orange-100 dark:bg-orange-900/30"
                      sectionType="relationships"
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
                      sectionType="channels"
                    />
                  </ResizablePanel>
                </ResizablePanelGroup>
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
                  sectionType="segments"
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          {/* Bottom Row */}
          <ResizablePanel defaultSize={40} minSize={10}>
            <ResizablePanelGroup direction="horizontal" className="h-full">
              {/* Cost Structure */}
              <ResizablePanel defaultSize={50}>
                <BMCSection
                  title="Cost Structure"
                  value={bmcData.costStructure}
                  onChange={(value) => handleSectionChange('costStructure', value)}
                  placeholder="What are the most important costs in your business model?"
                  headerColor="bg-purple-100 dark:bg-purple-900/30"
                  sectionType="costs"
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
                  sectionType="revenue"
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
});

BMCCanvas.displayName = 'BMCCanvas';

export default BMCCanvas;