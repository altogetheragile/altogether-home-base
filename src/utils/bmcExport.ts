import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export interface ExportOptions {
  format: 'pdf' | 'png' | 'jpeg';
  quality?: number;
  filename?: string;
}

export const exportBMC = async (elementId: string, options: ExportOptions) => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('BMC element not found');
  }

  try {
    // Force element to be fully visible and get complete dimensions
    const originalOverflow = element.style.overflow;
    const originalPosition = element.style.position;
    
    element.style.overflow = 'visible';
    element.style.position = 'relative';
    
    // Wait for layout to stabilize
    await new Promise(resolve => requestAnimationFrame(resolve));
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Get the full content dimensions
    const scrollWidth = Math.max(element.scrollWidth, element.offsetWidth, 1200);
    const scrollHeight = Math.max(element.scrollHeight, element.offsetHeight, 600);

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: scrollWidth,
      height: scrollHeight,
      scrollX: 0,
      scrollY: 0,
      x: 0,
      y: 0,
      foreignObjectRendering: false,
      removeContainer: true,
      logging: false,
      onclone: (clonedDoc) => {
        const clonedElement = clonedDoc.getElementById(elementId);
        if (clonedElement) {
          // Ensure the cloned element maintains full dimensions
          clonedElement.style.width = `${scrollWidth}px`;
          clonedElement.style.height = 'auto';
          clonedElement.style.minHeight = `${scrollHeight}px`;
          clonedElement.style.overflow = 'visible';
          clonedElement.style.position = 'relative';
          
          // Replace textareas with divs for better rendering
          const textareas = clonedElement.querySelectorAll('textarea');
          textareas.forEach(textarea => {
            const div = clonedDoc.createElement('div');
            div.textContent = textarea.value;
            div.style.cssText = textarea.style.cssText;
            div.style.whiteSpace = 'pre-wrap';
            div.style.wordBreak = 'break-word';
            div.style.overflowWrap = 'anywhere';
            div.style.hyphens = 'auto';
            div.className = textarea.className;
            textarea.parentNode?.replaceChild(div, textarea);
          });
          
          // Ensure all grid items are visible
          const gridItems = clonedElement.querySelectorAll('[style*="grid-area"]');
          gridItems.forEach((el) => {
            if (el instanceof HTMLElement) {
              el.style.overflow = 'visible';
              el.style.height = 'auto';
              el.style.minHeight = '150px';
            }
          });
        }
      }
    });

    // Restore original styles
    element.style.overflow = originalOverflow;
    element.style.position = originalPosition;

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

const exportToPDF = (canvas: HTMLCanvasElement, filename: string) => {
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
    unit: 'mm',
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
          }
          .bmc-container {
            max-width: none !important;
            width: 100% !important;
          }
          @media print {
            body { margin: 0; padding: 0; }
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
  }, 500);
};