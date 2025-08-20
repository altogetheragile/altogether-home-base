import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export interface ExportOptions {
  format: 'pdf' | 'png' | 'jpeg';
  quality?: number;
  filename?: string;
}

/**
 * Export BMC canvas with completely rebuilt stable approach
 * Uses SVG-like rendering strategy for reliable exports
 */
export const exportBMC = async (elementId: string, options: ExportOptions) => {
  const { format, quality = 0.95, filename = 'business-model-canvas' } = options;
  
  try {
    const originalElement = document.getElementById(elementId);
    if (!originalElement) {
      throw new Error('BMC element not found');
    }

    // Create stable export version using canvas rendering
    const canvas = await createCanvasFromBMC(originalElement);
    
    if (format === 'pdf') {
      exportToPDF(canvas, filename);
    } else {
      exportToImage(canvas, format, filename, quality);
    }

  } catch (error) {
    console.error('Export failed:', error);
    throw error;
  }
};

/**
 * Create canvas directly from BMC data - bypassing html2canvas issues
 */
const createCanvasFromBMC = async (element: HTMLElement): Promise<HTMLCanvasElement> => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  // Set canvas dimensions
  canvas.width = 1200;
  canvas.height = 800;
  
  // Set background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Get BMC data from DOM
  const bmcData = extractBMCData(element);
  
  // Draw BMC layout
  await drawBMCLayout(ctx, bmcData);
  
  return canvas;
};

/**
 * Extract data from BMC DOM elements
 */
const extractBMCData = (element: HTMLElement) => {
  const sections = element.querySelectorAll('[data-section]');
  const data: Record<string, { title: string; content: string; isHighlight: boolean }> = {};
  
  sections.forEach((section) => {
    const sectionName = section.getAttribute('data-section');
    if (!sectionName) return;
    
    const titleElement = section.querySelector('.text-xs.font-bold');
    const contentElement = section.querySelector('textarea') || section.querySelector('.text-xs.text-foreground');
    const isHighlight = section.classList.contains('bg-bmc-accent');
    
    data[sectionName] = {
      title: titleElement?.textContent || '',
      content: contentElement?.textContent || (contentElement as HTMLTextAreaElement)?.value || '',
      isHighlight
    };
  });
  
  // Get company name
  const companyNameElement = element.querySelector('.text-sm.text-muted-foreground');
  const companyName = companyNameElement?.textContent || '';
  
  return { sections: data, companyName };
};

/**
 * Draw BMC layout on canvas with precise positioning
 */
const drawBMCLayout = async (ctx: CanvasRenderingContext2D, data: any) => {
  // Set font
  ctx.font = '12px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  
  const padding = 24;
  const gap = 16;
  const canvasWidth = 1200 - (padding * 2);
  const canvasHeight = 800 - (padding * 2);
  
  // Draw title if exists
  if (data.companyName) {
    ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.fillText('Business Model Canvas', 600, padding);
    ctx.font = '14px system-ui, -apple-system, sans-serif';
    ctx.fillText(data.companyName, 600, padding + 30);
    ctx.textAlign = 'left';
  }
  
  const startY = data.companyName ? padding + 80 : padding;
  const contentHeight = canvasHeight - (data.companyName ? 80 : 0);
  
  // BMC Layout dimensions
  const rowHeight = (contentHeight - (gap * 2)) / 3;
  const colWidth = (canvasWidth - (gap * 4)) / 5;
  
  // Define sections with their positions
  const sectionLayout = [
    // Top row
    { key: 'keyPartners', x: padding, y: startY, width: colWidth, height: rowHeight },
    { key: 'keyActivities', x: padding + colWidth + gap, y: startY, width: colWidth, height: rowHeight },
    { key: 'valuePropositions', x: padding + (colWidth + gap) * 2, y: startY, width: colWidth, height: rowHeight, highlight: true },
    { key: 'customerRelationships', x: padding + (colWidth + gap) * 3, y: startY, width: colWidth, height: rowHeight },
    { key: 'customerSegments', x: padding + (colWidth + gap) * 4, y: startY, width: colWidth, height: rowHeight },
    
    // Middle row (only some sections)
    { key: 'keyResources', x: padding + colWidth + gap, y: startY + rowHeight + gap, width: colWidth, height: rowHeight },
    { key: 'channels', x: padding + (colWidth + gap) * 3, y: startY + rowHeight + gap, width: colWidth, height: rowHeight },
    
    // Bottom row
    { key: 'costStructure', x: padding, y: startY + (rowHeight + gap) * 2, width: colWidth * 3 + gap * 2, height: rowHeight },
    { key: 'revenueStreams', x: padding + colWidth * 3 + gap * 3, y: startY + (rowHeight + gap) * 2, width: colWidth * 2 + gap, height: rowHeight, highlight: true }
  ];
  
  // Draw each section
  for (const section of sectionLayout) {
    const sectionData = data.sections[section.key];
    if (!sectionData) continue;
    
    drawSection(ctx, section, sectionData);
  }
};

/**
 * Draw individual section
 */
const drawSection = (ctx: CanvasRenderingContext2D, layout: any, data: any) => {
  const { x, y, width, height, highlight } = layout;
  
  // Draw border and background
  ctx.strokeStyle = highlight ? '#f59e0b' : '#e5e7eb';
  ctx.fillStyle = highlight ? '#fef3c7' : '#ffffff';
  ctx.lineWidth = 1;
  
  // Draw card
  ctx.fillRect(x, y, width, height);
  ctx.strokeRect(x, y, width, height);
  
  // Draw title
  ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = highlight ? '#f59e0b' : '#000000';
  ctx.textAlign = 'center';
  
  const titleY = y + 16;
  ctx.fillText(data.title, x + width / 2, titleY);
  
  // Draw content
  ctx.font = '11px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#374151';
  ctx.textAlign = 'left';
  
  const contentY = titleY + 24;
  const contentPadding = 12;
  const maxWidth = width - (contentPadding * 2);
  const maxHeight = height - contentY + y - contentPadding;
  
  if (data.content) {
    drawWrappedText(ctx, data.content, x + contentPadding, contentY, maxWidth, maxHeight);
  } else {
    ctx.fillStyle = '#9ca3af';
    ctx.font = 'italic 11px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No content generated', x + width / 2, contentY + 20);
  }
};

/**
 * Draw text with word wrapping
 */
const drawWrappedText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, maxHeight: number) => {
  const lineHeight = 16;
  const lines = text.split('\n');
  let currentY = y;
  
  for (const line of lines) {
    if (currentY + lineHeight > y + maxHeight) break;
    
    const words = line.split(' ');
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine + word + ' ';
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine !== '') {
        ctx.fillText(currentLine.trim(), x, currentY);
        currentLine = word + ' ';
        currentY += lineHeight;
        
        if (currentY + lineHeight > y + maxHeight) break;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine.trim() && currentY + lineHeight <= y + maxHeight) {
      ctx.fillText(currentLine.trim(), x, currentY);
    }
    
    currentY += lineHeight;
    if (currentY + lineHeight > y + maxHeight) break;
  }
};

/**
 * Export canvas as PDF
 */
const exportToPDF = (canvas: HTMLCanvasElement, filename: string) => {
  const imgData = canvas.toDataURL('image/png', 0.95);
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });
  
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  
  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
  pdf.save(`${filename}.pdf`);
};

/**
 * Export canvas as image
 */
const exportToImage = (canvas: HTMLCanvasElement, format: 'png' | 'jpeg', filename: string, quality = 0.95) => {
  const link = document.createElement('a');
  link.download = `${filename}.${format}`;
  link.href = canvas.toDataURL(`image/${format}`, quality);
  link.click();
};

/**
 * Print BMC with simplified approach
 */
export const printBMC = (elementId: string) => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('BMC element not found');
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Could not open print window');
    }

    const printContent = element.outerHTML;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Business Model Canvas</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: system-ui, -apple-system, sans-serif; background: white; color: black; }
            @page { size: A4 landscape; margin: 10mm; }
            #bmc-canvas { width: 100% !important; max-width: none !important; }
            .flex { display: flex !important; }
            .flex-col { flex-direction: column !important; }
            .gap-4 > * + * { margin-top: 16px !important; }
            .flex-1 { flex: 1 !important; }
            .flex-\\[2\\] { flex: 2 !important; }
            .flex-\\[3\\] { flex: 3 !important; }
            [data-section] { border: 1px solid #e5e7eb !important; border-radius: 8px !important; background: white !important; min-height: 100px !important; }
            .bg-bmc-accent { background-color: #fef3c7 !important; }
            .border-bmc-orange { border-color: #f59e0b !important; }
            .text-bmc-orange { color: #f59e0b !important; }
            textarea { display: none !important; }
          </style>
        </head>
        <body>
          ${printContent}
          <script>
            window.onload = function() {
              setTimeout(function() { window.print(); window.close(); }, 250);
            }
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  } catch (error) {
    console.error('Print failed:', error);
    throw error;
  }
};