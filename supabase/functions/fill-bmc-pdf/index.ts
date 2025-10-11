import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { PDFDocument, rgb, StandardFonts } from "https://cdn.skypack.dev/pdf-lib@1.17.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
}

// PDF coordinate mappings for BMC sections (in points, origin bottom-left)
// These are approximate positions for a standard BMC template
const BMC_COORDINATES = {
  companyName: { x: 300, y: 750, maxWidth: 300 },
  keyPartners: { x: 50, y: 600, maxWidth: 140, maxHeight: 200 },
  keyActivities: { x: 200, y: 550, maxWidth: 140, maxHeight: 100 },
  keyResources: { x: 200, y: 440, maxWidth: 140, maxHeight: 100 },
  valuePropositions: { x: 350, y: 500, maxWidth: 140, maxHeight: 200 },
  customerRelationships: { x: 500, y: 550, maxWidth: 140, maxHeight: 100 },
  channels: { x: 500, y: 440, maxWidth: 140, maxHeight: 100 },
  customerSegments: { x: 650, y: 500, maxWidth: 140, maxHeight: 200 },
  costStructure: { x: 50, y: 150, maxWidth: 350, maxHeight: 100 },
  revenueStreams: { x: 420, y: 150, maxWidth: 370, maxHeight: 100 },
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
    const { bmcData, templateUrl, companyName }: FillPDFRequest = await req.json();
    console.log('[PDF Fill] Request received for company:', companyName);

    if (!templateUrl) {
      throw new Error('Template URL is required');
    }

    // Download the PDF template
    console.log('[PDF Fill] Downloading template from:', templateUrl);
    const templateResponse = await fetch(templateUrl);
    if (!templateResponse.ok) {
      throw new Error(`Failed to download template: ${templateResponse.statusText}`);
    }
    
    const templateBytes = await templateResponse.arrayBuffer();
    console.log('[PDF Fill] Template downloaded, size:', templateBytes.byteLength);

    // Load the PDF
    const pdfDoc = await PDFDocument.load(templateBytes);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { height } = firstPage.getSize();

    // Embed font
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 9;
    const lineHeight = fontSize + 2;
    const textColor = rgb(0.2, 0.2, 0.2);

    // Add company name if provided
    if (companyName) {
      const coords = BMC_COORDINATES.companyName;
      firstPage.drawText(companyName, {
        x: coords.x,
        y: height - coords.y,
        size: 16,
        font,
        color: rgb(0.1, 0.1, 0.1),
      });
    }

    // Helper function to draw text in a section
    const drawSection = (
      sectionKey: keyof typeof BMC_COORDINATES,
      text: string
    ) => {
      const coords = BMC_COORDINATES[sectionKey];
      const lines = wrapText(text, coords.maxWidth, font, fontSize);
      const maxLines = Math.floor((coords.maxHeight || 200) / lineHeight);
      const displayLines = lines.slice(0, maxLines);

      displayLines.forEach((line, i) => {
        firstPage.drawText(line, {
          x: coords.x,
          y: height - coords.y - (i * lineHeight),
          size: fontSize,
          font,
          color: textColor,
        });
      });
    };

    // Fill in all BMC sections
    drawSection('keyPartners', formatArrayToText(bmcData.keyPartners));
    drawSection('keyActivities', formatArrayToText(bmcData.keyActivities));
    drawSection('keyResources', formatArrayToText(bmcData.keyResources));
    drawSection('valuePropositions', formatArrayToText(bmcData.valuePropositions));
    drawSection('customerRelationships', formatArrayToText(bmcData.customerRelationships));
    drawSection('channels', formatArrayToText(bmcData.channels));
    drawSection('customerSegments', formatArrayToText(bmcData.customerSegments));
    drawSection('costStructure', formatArrayToText(bmcData.costStructure));
    drawSection('revenueStreams', formatArrayToText(bmcData.revenueStreams));

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
