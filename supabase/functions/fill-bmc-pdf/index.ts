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

// PDF coordinate mappings for BMC sections (relative %, origin top-left)
// Calibrated for standard Business Model Canvas template
const BMC_RELATIVE_COORDS = {
  companyName: { x: 0.42, y: 0.095 },
  keyPartners: { x: 0.025, y: 0.22, w: 0.175, h: 0.46 },
  keyActivities: { x: 0.21, y: 0.22, w: 0.155, h: 0.225 },
  keyResources: { x: 0.21, y: 0.455, w: 0.155, h: 0.225 },
  valuePropositions: { x: 0.375, y: 0.22, w: 0.185, h: 0.46 },
  customerRelationships: { x: 0.57, y: 0.22, w: 0.155, h: 0.225 },
  channels: { x: 0.57, y: 0.455, w: 0.155, h: 0.225 },
  customerSegments: { x: 0.735, y: 0.22, w: 0.24, h: 0.46 },
  costStructure: { x: 0.025, y: 0.69, w: 0.535, h: 0.24 },
  revenueStreams: { x: 0.57, y: 0.69, w: 0.405, h: 0.24 },
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
  startSize: number = 11,
  minSize: number = 7
): number {
  for (let size = startSize; size >= minSize; size -= 0.5) {
    const lineHeight = size + 2;
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

    // Add company name if provided
    if (companyName) {
      const coords = BMC_RELATIVE_COORDS.companyName;
      firstPage.drawText(companyName, {
        x: coords.x * pageWidth,
        y: pageHeight - (coords.y * pageHeight),
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
      const y = pageHeight - (coords.y * pageHeight);
      const maxWidth = coords.w * pageWidth - 10;
      const maxHeight = coords.h * pageHeight - 10;
      
      // Calculate best font size that fits
      const fontSize = calculateFitFontSize(items, maxWidth, maxHeight, font);
      const lineHeight = fontSize + 2;
      
      console.log(`[PDF Fill] ${sectionKey}: fontSize=${fontSize}, items=${items.length}`);
      
      // Draw debug rectangle if enabled
      if (debug) {
        firstPage.drawRectangle({
          x,
          y: y - maxHeight,
          width: maxWidth,
          height: maxHeight,
          borderColor: debugColor,
          borderWidth: 1,
        });
      }
      
      let currentY = y - 5;
      
      items.forEach((item) => {
        const lines = wrapText(`• ${item}`, maxWidth, font, fontSize);
        lines.forEach((line) => {
          if (currentY - lineHeight > y - maxHeight) {
            firstPage.drawText(line, {
              x: x + 5,
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

    // Return the PDF as base64
    const base64 = btoa(String.fromCharCode(...new Uint8Array(pdfBytes)));
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
