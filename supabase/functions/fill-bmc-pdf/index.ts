import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { PDFDocument, rgb, StandardFonts } from "https://cdn.skypack.dev/pdf-lib@1.17.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

interface BMCData {
  keyPartners?: string[];
  keyActivities?: string[];
  keyResources?: string[];
  valuePropositions?: string[];
  customerRelationships?: string[];
  channels?: string[];
  customerSegments?: string[];
  costStructure?: string[];
  revenueStreams?: string[];
}

interface FillPDFRequest {
  bmcData: BMCData;
  templateUrl: string;
  companyName?: string;
  debug?: boolean;
}

// Padding for text inside sections
const PADDING = 18;
const INNER = 2;

// PDF coordinate mappings for BMC sections (relative %, ORIGIN: bottom-left)
// Calibrated for the provided template; tweak as needed with debug=true
const BMC_RELATIVE_COORDS = {
  companyName: { x: 0.5, y: 0.91 }, // Center line in header area
  keyPartners: { x: 0.025, y: 0.26, w: 0.175, h: 0.43 },
  keyActivities: { x: 0.21, y: 0.48, w: 0.155, h: 0.21 },
  keyResources: { x: 0.21, y: 0.26, w: 0.155, h: 0.21 },
  valuePropositions: { x: 0.375, y: 0.26, w: 0.185, h: 0.43 },
  customerRelationships: { x: 0.57, y: 0.48, w: 0.155, h: 0.21 },
  channels: { x: 0.57, y: 0.26, w: 0.155, h: 0.21 },
  customerSegments: { x: 0.735, y: 0.26, w: 0.24, h: 0.43 },
  costStructure: { x: 0.025, y: 0.03, w: 0.535, h: 0.22 },
  revenueStreams: { x: 0.57, y: 0.03, w: 0.405, h: 0.22 },
};

function wrapText(text: string, maxWidth: number, font: any, fontSize: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(testLine, fontSize);
    
    if (width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}

function calculateFitFontSize(
  items: string[],
  maxWidth: number,
  maxHeight: number,
  font: any,
  startSize: number = 13,
  minSize: number = 9
): number {
  for (let size = startSize; size >= minSize; size -= 0.5) {
    const lineHeight = size + 3;
    let totalHeight = 0;
    
    for (const item of items) {
      const lines = wrapText(`• ${item}`, maxWidth, font, size);
      totalHeight += lines.length * lineHeight;
    }
    
    if (totalHeight <= maxHeight) {
      return size;
    }
  }
  
  return minSize;
}

function formatArrayToText(items: string[] | undefined): string {
  if (!items || items.length === 0) return '';
  return items.map((item, i) => `• ${item}`).join('\n');
}

serve(async (req) => {
  console.log('[PDF Fill] Function invoked:', new Date().toISOString());
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { bmcData, templateUrl, companyName, debug }: FillPDFRequest = await req.json();
    console.log('[PDF Fill] Request received');
    console.log('[PDF Fill] Company:', companyName);
    console.log('[PDF Fill] Template URL:', templateUrl);

    if (!templateUrl) {
      throw new Error('Template URL is required');
    }

    // Download the PDF template
    console.log('[PDF Fill] Downloading template...');
    const templateResponse = await fetch(templateUrl);
    if (!templateResponse.ok) {
      console.error('[PDF Fill] Template download failed:', templateResponse.status, templateResponse.statusText);
      throw new Error(`Failed to download template: ${templateResponse.statusText}`);
    }
    
    const templateBytes = await templateResponse.arrayBuffer();
    console.log('[PDF Fill] Template downloaded, size:', templateBytes.byteLength);

    // Load the PDF
    const pdfDoc = await PDFDocument.load(templateBytes);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width: pageWidth, height: pageHeight } = firstPage.getSize();
    console.log('[PDF Fill] Page size:', pageWidth, 'x', pageHeight);

    // Embed font
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const textColor = rgb(0.2, 0.2, 0.2);
    const debugColor = rgb(0.9, 0.9, 0.9);

    // Add company name if provided (centered in header)
    if (companyName) {
      const coords = BMC_RELATIVE_COORDS.companyName;
      const textWidth = font.widthOfTextAtSize(companyName, 16);
      firstPage.drawText(companyName, {
        x: (coords.x * pageWidth) - (textWidth / 2),
        y: coords.y * pageHeight,
        size: 16,
        font,
        color: rgb(0.1, 0.1, 0.1),
      });
    }

    // Helper function to draw text in a section with auto-fit
    const drawSection = (
      sectionKey: keyof typeof BMC_RELATIVE_COORDS,
      items: string[] | undefined
    ) => {
      if (!items || items.length === 0) return;
      
      const coords = BMC_RELATIVE_COORDS[sectionKey];
      if (!coords.w || !coords.h) return;
      
      const x = coords.x * pageWidth;
      const y = coords.y * pageHeight; // bottom-left origin
      const sectionWidth = (coords.w as number) * pageWidth;
      const sectionHeight = (coords.h as number) * pageHeight;
      const maxWidth = sectionWidth - (PADDING * 2);
      const maxHeight = sectionHeight - (PADDING * 2);
      
      // Calculate best font size that fits
      const fontSize = calculateFitFontSize(items, maxWidth, maxHeight, font);
      const lineHeight = fontSize + 3;
      
      console.log(`[PDF Fill] ${sectionKey}: fontSize=${fontSize}, items=${items.length}`);
      
      // Draw debug rectangle if enabled (shows inner text area)
      if (debug) {
        firstPage.drawRectangle({
          x: x + PADDING,
          y: y + PADDING,
          width: maxWidth,
          height: maxHeight,
          borderColor: debugColor,
          borderWidth: 1,
        });
      }
      
      // Start from top of the text area and go down
      let currentY = y + sectionHeight - PADDING;
      
      items.forEach((item) => {
        const lines = wrapText(`• ${item}`, maxWidth, font, fontSize);
        lines.forEach((line) => {
          if (currentY - lineHeight >= y + PADDING) {
            firstPage.drawText(line, {
              x: x + PADDING,
              y: currentY,
              size: fontSize,
              font,
              color: textColor,
            });
            currentY -= lineHeight;
          }
        });
      });
    };

    // Fill in all BMC sections
    drawSection('keyPartners', bmcData.keyPartners);
    drawSection('keyActivities', bmcData.keyActivities);
    drawSection('keyResources', bmcData.keyResources);
    drawSection('valuePropositions', bmcData.valuePropositions);
    drawSection('customerRelationships', bmcData.customerRelationships);
    drawSection('channels', bmcData.channels);
    drawSection('customerSegments', bmcData.customerSegments);
    drawSection('costStructure', bmcData.costStructure);
    drawSection('revenueStreams', bmcData.revenueStreams);

    // Save the PDF
    const pdfBytes = await pdfDoc.save();
    console.log('[PDF Fill] PDF filled successfully, size:', pdfBytes.length);

    // Return the PDF as base64 (encode in chunks to avoid stack overflow)
    const uint8Array = new Uint8Array(pdfBytes);
    let binary = '';
    const chunkSize = 0x8000; // 32KB chunks
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    const base64 = btoa(binary);
    const dataUrl = `data:application/pdf;base64,${base64}`;

    return new Response(
      JSON.stringify({ pdfDataUrl: dataUrl }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('[PDF Fill] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
