import React, { useState, useCallback, useMemo, useRef, useImperativeHandle, forwardRef } from 'react';
import { z } from 'zod';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { cn } from '@/lib/utils';
import TextElement from '../elements/TextElement';
import FormattedTextDisplay from '@/components/common/FormattedTextDisplay';
import { exportCanvas } from '@/utils/canvas/canvasExporter';

interface ExportOptions {
  format?: 'png' | 'pdf';
  quality?: number;
  filename?: string;
}

// Schema to handle both snake_case and camelCase from edge function
const BmcSchema = z.object({
  // support both shapes
  key_partners: z.union([z.string(), z.array(z.string())]).optional(),
  keyPartners: z.union([z.string(), z.array(z.string())]).optional(),

  key_activities: z.union([z.string(), z.array(z.string())]).optional(),
  keyActivities: z.union([z.string(), z.array(z.string())]).optional(),

  key_resources: z.union([z.string(), z.array(z.string())]).optional(),
  keyResources: z.union([z.string(), z.array(z.string())]).optional(),

  value_propositions: z.union([z.string(), z.array(z.string())]).optional(),
  valuePropositions: z.union([z.string(), z.array(z.string())]).optional(),

  customer_relationships: z.union([z.string(), z.array(z.string())]).optional(),
  customerRelationships: z.union([z.string(), z.array(z.string())]).optional(),

  channels: z.union([z.string(), z.array(z.string())]).optional(),

  customer_segments: z.union([z.string(), z.array(z.string())]).optional(),
  customerSegments: z.union([z.string(), z.array(z.string())]).optional(),

  cost_structure: z.union([z.string(), z.array(z.string())]).optional(),
  costStructure: z.union([z.string(), z.array(z.string())]).optional(),

  revenue_streams: z.union([z.string(), z.array(z.string())]).optional(),
  revenueStreams: z.union([z.string(), z.array(z.string())]).optional(),
});

export interface BMCData {
  keyPartners: string | string[];
  keyActivities: string | string[];
  keyResources: string | string[];
  valuePropositions: string | string[];
  customerRelationships: string | string[];
  channels: string | string[];
  customerSegments: string | string[];
  costStructure: string | string[];
  revenueStreams: string | string[];
}

// Internal type for normalized BMC data (always strings for rendering)
interface NormalizedBMCData {
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
  data?: unknown; // Accept any data shape from edge function
  isEditable?: boolean;
  onDataChange?: (data: BMCData) => void;
  companyName?: string;
  className?: string;
}

function pick<T>(a: T | undefined, b: T | undefined): T | undefined {
  return a !== undefined ? a : b;
}

function normalizeBmc(data: unknown): NormalizedBMCData {
  const parsed = BmcSchema.safeParse(data);
  if (!parsed.success) {
    return {
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
  }
  
  const d = parsed.data;
  
  // Helper function to convert string | string[] to string with bullets
  const toString = (value: string | string[] | undefined): string => {
    if (!value) return '';
    if (Array.isArray(value)) {
      const items = value.filter(Boolean).map(item => item.trim());
      return items.length ? `• ${items.join('\n• ')}` : '';
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return '';
      // If it already has bullet points, return as is
      if (trimmed.includes('•')) return trimmed;
      // Split by newlines and add bullets
      const lines = trimmed.split('\n').map(line => line.trim()).filter(Boolean);
      return lines.length ? `• ${lines.join('\n• ')}` : '';
    }
    return '';
  };
  
  return {
    keyPartners: toString(pick(d.keyPartners, d.key_partners)),
    keyActivities: toString(pick(d.keyActivities, d.key_activities)),
    keyResources: toString(pick(d.keyResources, d.key_resources)),
    valuePropositions: toString(pick(d.valuePropositions, d.value_propositions)),
    customerRelationships: toString(pick(d.customerRelationships, d.customer_relationships)),
    channels: toString(d.channels),
    customerSegments: toString(pick(d.customerSegments, d.customer_segments)),
    costStructure: toString(pick(d.costStructure, d.cost_structure)),
    revenueStreams: toString(pick(d.revenueStreams, d.revenue_streams)),
  };
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

  // Centralized handle styling
  const handleCx = `
    z-50 touch-none select-none
    data-[panel-group-direction=horizontal]:w-3 data-[panel-group-direction=horizontal]:-mx-1
    data-[panel-group-direction=horizontal]:cursor-col-resize data-[panel-group-direction=horizontal]:hover:bg-primary/10
    data-[panel-group-direction=vertical]:h-3 data-[panel-group-direction=vertical]:-my-1
    data-[panel-group-direction=vertical]:cursor-row-resize data-[panel-group-direction=vertical]:hover:bg-primary/10
  `;

  // Memoize data normalization to prevent infinite re-renders
  const normalizedData = useMemo(() => normalizeBmc(data), [data]);

  const defaultData: NormalizedBMCData = useMemo(() => ({
    keyPartners: '',
    keyActivities: '',
    keyResources: '',
    valuePropositions: '',
    customerRelationships: '',
    channels: '',
    customerSegments: '',
    costStructure: '',
    revenueStreams: '',
  }), []);

  const bmcData = useMemo(() => ({ ...defaultData, ...normalizedData }), [defaultData, normalizedData]);

  const handleSectionChange = useCallback((section: keyof NormalizedBMCData, content: string) => {
    const newData = { ...bmcData, [section]: content };
    onDataChange?.(newData);
  }, [bmcData, onDataChange]);

  const getBMCData = (): NormalizedBMCData => bmcData;

  const getBMCDataForExport = () => {
    // Convert internal BMCData to export format
    return {
      keyPartners: bmcData.keyPartners,
      keyActivities: bmcData.keyActivities, 
      keyResources: bmcData.keyResources,
      valuePropositions: bmcData.valuePropositions,
      customerRelationships: bmcData.customerRelationships,
      channels: bmcData.channels,
      customerSegments: bmcData.customerSegments,
      costStructure: bmcData.costStructure,
      revenueStreams: bmcData.revenueStreams
    };
  };

  const exportCanvasMethod = async (options: ExportOptions = {}): Promise<string> => {
    if (!canvasRef.current) {
      throw new Error('Canvas not available for export');
    }

    // Use the shared canvas exporter utility
    return await exportCanvas(canvasRef.current, {
      format: options.format || 'png',
      quality: options.quality || 2,
      filename: options.filename || 'bmc-export',
      scale: 2,
      backgroundColor: 'white',
    });
  };

  useImperativeHandle(ref, () => ({
    exportCanvas: exportCanvasMethod,
    getBMCData: getBMCDataForExport,
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
    <div className="h-full flex flex-col min-h-0 bg-card border-2 border-border/30 overflow-hidden shadow-sm">
      <SectionHeader title={title} color={headerColor} />
      <div className="flex-1 p-1 min-h-[120px] overflow-auto relative z-0">
        {isEditable ? (
          // Always use TextElement; the overlay handles export rendering
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
            text={value}
            debugKey={title.replace(/\s+/g, '')}
            className="h-full text-sm"
          />
        )}
        {/* Debug content display */}
        {process.env.NODE_ENV === 'development' && value && (
          <div className="absolute bottom-0 right-0 text-xs bg-yellow-100 p-1 opacity-50">
            Content: {value.substring(0, 20)}...
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={cn('w-full h-[80vh] min-h-[600px] bg-background text-foreground border border-border rounded-lg', className)} ref={canvasRef} data-canvas="true">
      {/* Header */}
      <div className="px-3 py-2 text-center text-sm font-semibold border-b">
        Business Model Canvas{companyName ? ` – ${companyName}` : ""}
      </div>

      {/* Body with explicit height for percentage calculations */}
      <div className="h-[calc(80vh-40px)] min-h-0">
        {/* Main vertical splitter for Top vs Bottom rows */}
        <ResizablePanelGroup direction="vertical" className="h-full min-h-0">
          {/* TOP ROW (default 60%) */}
          <ResizablePanel defaultSize={60} minSize={35} className="overflow-hidden relative min-h-0">
            <ResizablePanelGroup direction="horizontal" className="h-full min-h-0">
              {/* Left Column */}
              <ResizablePanel defaultSize={20} minSize={12} className="overflow-hidden relative min-h-0">
                <BMCSection
                  title="Key Partners"
                  value={bmcData.keyPartners}
                  onChange={(value) => handleSectionChange('keyPartners', value)}
                  placeholder="Who are your key partners and suppliers?"
                  headerColor="bg-yellow-100 text-yellow-800"
                  sectionType="partners"
                />
              </ResizablePanel>

              <ResizableHandle withHandle className={handleCx} />

              {/* Center Left Column - Key Activities and Key Resources (vertical split) */}
              <ResizablePanel defaultSize={20} minSize={12} className="overflow-hidden relative min-h-0">
                <ResizablePanelGroup direction="vertical" className="h-full min-h-0">
                  <ResizablePanel defaultSize={50} minSize={25} className="overflow-hidden relative min-h-0">
                    <BMCSection
                      title="Key Activities"
                      value={bmcData.keyActivities}
                      onChange={(value) => handleSectionChange('keyActivities', value)}
                      placeholder="What key activities does your value proposition require?"
                      headerColor="bg-blue-100 text-blue-800"
                      sectionType="activities"
                    />
                  </ResizablePanel>
                  <ResizableHandle withHandle className={handleCx} />
                  <ResizablePanel defaultSize={50} minSize={25} className="overflow-hidden relative min-h-0">
                    <BMCSection
                      title="Key Resources"
                      value={bmcData.keyResources}
                      onChange={(value) => handleSectionChange('keyResources', value)}
                      placeholder="What key resources does your value proposition require?"
                      headerColor="bg-green-100 text-green-800"
                      sectionType="resources"
                    />
                  </ResizablePanel>
                </ResizablePanelGroup>
              </ResizablePanel>

              <ResizableHandle withHandle className={handleCx} />

              {/* Center Column - Value Propositions */}
              <ResizablePanel defaultSize={20} minSize={12} className="overflow-hidden relative min-h-0">
                <BMCSection
                  title="Value Propositions"
                  value={bmcData.valuePropositions}
                  onChange={(value) => handleSectionChange('valuePropositions', value)}
                  placeholder="What value do you deliver to your customers?"
                  headerColor="bg-purple-100 text-purple-800"
                  sectionType="value"
                />
              </ResizablePanel>

              <ResizableHandle withHandle className={handleCx} />

              {/* Center Right Column - Customer Relationships and Channels (vertical split) */}
              <ResizablePanel defaultSize={20} minSize={12} className="overflow-hidden relative min-h-0">
                <ResizablePanelGroup direction="vertical" className="h-full min-h-0">
                  <ResizablePanel defaultSize={50} minSize={25} className="overflow-hidden relative min-h-0">
                    <BMCSection
                      title="Customer Relationships"
                      value={bmcData.customerRelationships}
                      onChange={(value) => handleSectionChange('customerRelationships', value)}
                      placeholder="What type of relationship does each customer segment expect?"
                      headerColor="bg-indigo-100 text-indigo-800"
                      sectionType="relationships"
                    />
                  </ResizablePanel>
                  <ResizableHandle withHandle className={handleCx} />
                  <ResizablePanel defaultSize={50} minSize={25} className="overflow-hidden relative min-h-0">
                    <BMCSection
                      title="Channels"
                      value={bmcData.channels}
                      onChange={(value) => handleSectionChange('channels', value)}
                      placeholder="Through which channels do you reach your customers?"
                      headerColor="bg-pink-100 text-pink-800"
                      sectionType="channels"
                    />
                  </ResizablePanel>
                </ResizablePanelGroup>
              </ResizablePanel>

              <ResizableHandle withHandle className={handleCx} />

              {/* Right Column */}
              <ResizablePanel defaultSize={20} minSize={12} className="overflow-hidden relative min-h-0">
                <BMCSection
                  title="Customer Segments"
                  value={bmcData.customerSegments}
                  onChange={(value) => handleSectionChange('customerSegments', value)}
                  placeholder="For whom are you creating value?"
                  headerColor="bg-orange-100 text-orange-800"
                  sectionType="segments"
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>

          {/* Handle between top and bottom rows */}
          <ResizableHandle withHandle className={handleCx} />

          {/* BOTTOM ROW (default 40%) */}
          <ResizablePanel defaultSize={40} minSize={20} className="overflow-hidden relative min-h-0">
            <ResizablePanelGroup direction="horizontal" className="h-full min-h-0">
              <ResizablePanel defaultSize={50} minSize={25} className="overflow-hidden relative min-h-0">
                <BMCSection
                  title="Cost Structure"
                  value={bmcData.costStructure}
                  onChange={(value) => handleSectionChange('costStructure', value)}
                  placeholder="What are the most important costs in your business model?"
                  headerColor="bg-red-100 text-red-800"
                  sectionType="costs"
                />
              </ResizablePanel>

              <ResizableHandle withHandle className={handleCx} />

              <ResizablePanel defaultSize={50} minSize={25} className="overflow-hidden relative min-h-0">
                <BMCSection
                  title="Revenue Streams"
                  value={bmcData.revenueStreams}
                  onChange={(value) => handleSectionChange('revenueStreams', value)}
                  placeholder="For what value are your customers really willing to pay?"
                  headerColor="bg-emerald-100 text-emerald-800"
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