import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export interface ExportOptions {
  format: 'pdf' | 'png' | 'jpeg';
  quality?: number;
  filename?: string;
}

// Fixed dimensions for consistent exports
const EXPORT_WIDTH = 1200;
const EXPORT_HEIGHT = 800;

export const exportBMC = async (elementId: string, options: ExportOptions) => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('BMC element not found');
  }

  try {
    // Create a temporary container for export-specific layout
    const exportContainer = await prepareExportLayout(element);
    
    // Wait for layout stabilization
    await new Promise(resolve => requestAnimationFrame(resolve));
    await new Promise(resolve => setTimeout(resolve, 100));

    // Capture with fixed, stable dimensions
    const canvas = await html2canvas(exportContainer, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: EXPORT_WIDTH,
      height: EXPORT_HEIGHT,
      scrollX: 0,
      scrollY: 0,
      x: 0,
      y: 0,
      foreignObjectRendering: false,
      removeContainer: false,
      logging: false
    });

    // Clean up temporary container
    exportContainer.remove();

    const { format, quality = 0.95, filename = 'business-model-canvas' } = options;

    switch (format) {
      case 'pdf':
        return exportToPDF(canvas, filename);
      case 'png':
        return exportToImage(canvas, 'png', filename);
      case 'jpeg':
        return exportToImage(canvas, 'jpeg', filename, quality);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  } catch (error) {
    console.error('Export failed:', error);
    throw new Error('Failed to export BMC');
  }
};

const prepareExportLayout = async (originalElement: HTMLElement): Promise<HTMLElement> => {
  // Clone the original element
  const clonedElement = originalElement.cloneNode(true) as HTMLElement;
  
  // Create a temporary container positioned off-screen
  const tempContainer = document.createElement('div');
  tempContainer.style.position = 'fixed';
  tempContainer.style.top = '-10000px';
  tempContainer.style.left = '-10000px';
  tempContainer.style.width = `${EXPORT_WIDTH}px`;
  tempContainer.style.height = `${EXPORT_HEIGHT}px`;
  tempContainer.style.zIndex = '-1000';
  tempContainer.style.overflow = 'visible';
  tempContainer.style.backgroundColor = '#ffffff';
  
  // Apply export-specific styles to the cloned element
  clonedElement.style.width = `${EXPORT_WIDTH}px`;
  clonedElement.style.height = `${EXPORT_HEIGHT}px`;
  clonedElement.style.maxWidth = 'none';
  clonedElement.style.overflow = 'visible';
  clonedElement.style.position = 'relative';
  clonedElement.style.transform = 'none';
  clonedElement.style.boxSizing = 'border-box';
  clonedElement.style.padding = '40px';
  
  // Fix the grid layout for export
  const gridElement = clonedElement.querySelector('.bmc-grid') as HTMLElement;
  if (gridElement) {
    gridElement.style.display = 'grid';
    gridElement.style.gridTemplateColumns = '220px 220px 220px 220px 220px';
    gridElement.style.gridTemplateRows = '200px 200px 160px';
    gridElement.style.gap = '16px';
    gridElement.style.width = '1120px';
    gridElement.style.height = '576px';
    gridElement.style.gridTemplateAreas = `
      "partners activities value relationships segments"
      "partners resources value channels segments"
      "costs costs costs revenue revenue"
    `;
  }

  // Replace textareas with styled divs for better export rendering
  const textareas = clonedElement.querySelectorAll('textarea');
  textareas.forEach(textarea => {
    const div = document.createElement('div');
    div.textContent = textarea.value;
    div.style.width = '100%';
    div.style.height = '100%';
    div.style.padding = '8px';
    div.style.fontSize = '12px';
    div.style.lineHeight = '1.4';
    div.style.whiteSpace = 'pre-wrap';
    div.style.wordBreak = 'break-word';
    div.style.overflowWrap = 'anywhere';
    div.style.hyphens = 'auto';
    div.style.overflow = 'hidden';
    div.style.color = 'inherit';
    div.style.backgroundColor = 'transparent';
    div.style.border = 'none';
    div.style.outline = 'none';
    div.className = textarea.className;
    textarea.parentNode?.replaceChild(div, textarea);
  });

  // Fix all card elements for consistent export appearance
  const cards = clonedElement.querySelectorAll('[data-card]') as NodeListOf<HTMLElement>;
  cards.forEach(card => {
    card.style.height = '100%';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.overflow = 'hidden';
    card.style.borderRadius = '8px';
    card.style.border = '1px solid #e2e8f0';
  });

  // Add to DOM temporarily for accurate rendering
  tempContainer.appendChild(clonedElement);
  document.body.appendChild(tempContainer);
  
  // Force layout recalculation
  tempContainer.offsetHeight;
  
  return tempContainer;
};

const exportToPDF = (canvas: HTMLCanvasElement, filename: string) => {
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;
  const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
  const imgX = (pdfWidth - imgWidth * ratio) / 2;
  const imgY = (pdfHeight - imgHeight * ratio) / 2;

  pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
  pdf.save(`${filename}.pdf`);
};

const exportToImage = (
  canvas: HTMLCanvasElement, 
  format: 'png' | 'jpeg', 
  filename: string, 
  quality = 0.95
) => {
  const link = document.createElement('a');
  link.download = `${filename}.${format}`;
  link.href = canvas.toDataURL(`image/${format}`, quality);
  link.click();
};

export const printBMC = (elementId: string) => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('BMC element not found');
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Failed to open print window');
  }

  const clonedElement = element.cloneNode(true) as HTMLElement;
  
  printWindow.document.write(`
    <html>
      <head>
        <title>Business Model Canvas</title>
        <style>
          body {
            margin: 0;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: white;
          }
          .bmc-container {
            max-width: none !important;
            width: 100% !important;
          }
          .bmc-grid {
            display: grid !important;
            grid-template-columns: 1fr 1fr 1fr 1fr 1fr !important;
            grid-template-rows: 200px 200px 160px !important;
            gap: 16px !important;
          }
          @media print {
            body { margin: 0; padding: 10px; }
            .bmc-container { 
              page-break-inside: avoid;
              width: 100% !important;
            }
          }
        </style>
      </head>
      <body>
        ${clonedElement.outerHTML}
      </body>
    </html>
  `);
  
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 1000);
};