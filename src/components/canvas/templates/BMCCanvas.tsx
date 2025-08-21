import React, { useRef, useImperativeHandle, useState } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import TextElement from '../elements/TextElement';
import FormattedTextDisplay from '@/components/common/FormattedTextDisplay';
import { cn } from '@/lib/utils';
import { z } from 'zod';

// --- TEMP: force logs in all builds
const log = (...args: any[]) => { try { console.log(...args); } catch {} };

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

function normalizeBmc(data: unknown): BMCData {
  const parsed = BmcSchema.safeParse(data);
  if (!parsed.success) {
    log("[BMCCanvas] schema parse failed:", parsed.error?.flatten());
    log("[BMCCanvas] raw data (parse fail):", data);
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
  
  // Helper function to convert string | string[] to string
  const toString = (value: string | string[] | undefined): string => {
    if (!value) return '';
    if (Array.isArray(value)) return value.join('\n');
    return value;
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

  // --- visible probe (always renders)
  const looksLikeBmc =
    data && typeof data === "object" &&
    ("keyPartners" in (data as any) || "key_partners" in (data as any));

  // TEMP toggle: set to true to completely bypass Zod while debugging
  const BYPASS_NORMALIZATION = true;

  const normalizedData = (BYPASS_NORMALIZATION && looksLikeBmc)
    ? (data as any)
    : normalizeBmc(data);

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

  const bmcData = { ...defaultData, ...normalizedData };

  log("[BMCCanvas] received data:", data);
  log("[BMCCanvas] normalized BMC:", bmcData);

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
      
      <div className="w-full min-h-[600px] max-h-[800px] bg-background text-foreground border border-border overflow-y-auto flex flex-col">
        {/* TEMP DEBUG — remove later */}
        <details open className="p-3 text-xs opacity-70 border-b">
          <summary className="cursor-pointer">BMC payload (as received by BMCCanvas)</summary>
          <pre className="whitespace-pre-wrap break-words">
            {JSON.stringify(data, null, 2)}
          </pre>
        </details>

        {/* Guarantee visible content, even if normalizer returns {} */}
        <section className="p-4 border-b">
          <h3 className="font-semibold mb-2">Key Partners</h3>

          {/* Raw proof: always show *something* */}
          <p className="whitespace-pre-wrap leading-relaxed mb-2 italic opacity-80">
            {typeof (bmcData as any)?.keyPartners === "string"
              ? (bmcData as any).keyPartners
              : JSON.stringify((bmcData as any)?.keyPartners ?? "(no keyPartners field)")}
          </p>

          {/* Final list-render (works when FormattedTextDisplay gets a string/array) */}
          <FormattedTextDisplay text={(bmcData as any)?.keyPartners} debugKey="keyPartners" />
        </section>

        {/* Repeat this block for a second section to double-confirm */}
        <section className="p-4 border-b">
          <h3 className="font-semibold mb-2">Value Propositions</h3>
          <p className="whitespace-pre-wrap leading-relaxed mb-2 italic opacity-80">
            {typeof (bmcData as any)?.valuePropositions === "string"
              ? (bmcData as any).valuePropositions
              : JSON.stringify((bmcData as any)?.valuePropositions ?? "(no valuePropositions field)")}
          </p>
          <FormattedTextDisplay text={(bmcData as any)?.valuePropositions} debugKey="valuePropositions" />
        </section>
      </div>
    </div>
  );
});

BMCCanvas.displayName = 'BMCCanvas';

export default BMCCanvas;