import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export interface ExportOptions {
  format?: 'png' | 'pdf' | 'jpeg';
  quality?: number;
  filename?: string;
  scale?: number;
  backgroundColor?: string;
}

export const exportCanvas = async (
  element: HTMLElement,
  options: ExportOptions = {}
): Promise<string> => {
  const {
    format = 'png',
    quality = 2,
    filename = 'canvas-export',
    scale = 2,
    backgroundColor = 'white',
  } = options;

  try {
    const canvas = await html2canvas(element, {
      backgroundColor,
      scale,
      useCORS: true,
      allowTaint: true,
      foreignObjectRendering: false,
      logging: false,
      width: element.offsetWidth,
      height: element.offsetHeight,
      onclone: (clonedDoc) => {
        // Helper functions for proper text conversion
        const escapeHtml = (s: string) => {
          return s
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
        };

        const formatTextareaForExport = (value: string) => {
          // Ensure bullets have a trailing space; keep user typed spaces intact
          const normalized = value.replace(/•\s?/g, "• ");
          // Escape HTML then bring back line breaks as <br>
          return escapeHtml(normalized).replace(/\r\n|\r|\n/g, "<br>");
        };

        // Convert all textarea elements to properly formatted divs
        const textareas = clonedDoc.querySelectorAll('textarea');
        textareas.forEach(textarea => {
          const ta = textarea as HTMLTextAreaElement;
          
          // Build an export-safe div that visually matches the textarea
          const div = clonedDoc.createElement('div');
          
          // Copy classes (for font, color, size) then enforce export-safe text layout
          div.className = ta.className;
          div.style.cssText = (ta as HTMLElement).style.cssText;
          
          // Critical: preserve whitespace and wrapping behavior for multi-line content
          div.style.whiteSpace = "pre-wrap";       // keep spaces + wrap lines
          div.style.wordBreak = "break-word";      // avoid overflow
          div.style.overflow = "hidden";           // no scrollbars in export
          div.style.display = "block";
          
          // Match box metrics from textarea so layout doesn't shift
          const cs = clonedDoc.defaultView!.getComputedStyle(ta);
          div.style.padding = cs.padding;
          div.style.border = cs.border;
          div.style.boxSizing = cs.boxSizing;
          div.style.lineHeight = cs.lineHeight;
          div.style.letterSpacing = cs.letterSpacing || "normal";
          div.style.wordSpacing = cs.wordSpacing || "0";
          
          // Disable fancy features that can confuse html2canvas
          div.style.fontKerning = "normal";
          div.style.fontFeatureSettings = "normal";
          
          // Push formatted content
          div.innerHTML = formatTextareaForExport(ta.value);
          
          // Swap node
          ta.parentNode?.replaceChild(div, ta);
        });
      }
    });

    if (format === 'pdf') {
      return exportToPDF(canvas, filename);
    } else if (format === 'jpeg') {
      return canvas.toDataURL('image/jpeg', quality / 10);
    } else {
      return canvas.toDataURL('image/png');
    }
  } catch (error) {
    console.error('Export failed:', error);
    throw new Error('Failed to export canvas');
  }
};

const exportToPDF = (canvas: HTMLCanvasElement, filename: string): string => {
  const imgData = canvas.toDataURL('image/png');
  
  // Determine orientation based on canvas aspect ratio
  const aspectRatio = canvas.width / canvas.height;
  const orientation = aspectRatio > 1 ? 'landscape' : 'portrait';
  
  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  
  // Calculate dimensions to fit page while maintaining aspect ratio
  let imgWidth = pdfWidth - 20; // 10mm margin on each side
  let imgHeight = imgWidth / aspectRatio;
  
  if (imgHeight > pdfHeight - 20) {
    imgHeight = pdfHeight - 20; // 10mm margin top/bottom
    imgWidth = imgHeight * aspectRatio;
  }
  
  // Center the image
  const x = (pdfWidth - imgWidth) / 2;
  const y = (pdfHeight - imgHeight) / 2;
  
  pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
  
  return pdf.output('dataurlstring');
};

export const downloadFile = (dataUrl: string, filename: string, format: string) => {
  const link = document.createElement('a');
  link.download = `${filename}.${format}`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const printCanvas = async (element: HTMLElement) => {
  const canvas = await html2canvas(element, {
    backgroundColor: 'white',
    scale: 2,
    useCORS: true,
    allowTaint: true,
  });

  const imgData = canvas.toDataURL('image/png');
  
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Failed to open print window');
  }
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Canvas Print</title>
        <style>
          body { margin: 0; padding: 20px; }
          img { max-width: 100%; height: auto; }
          @media print {
            body { padding: 0; }
            img { width: 100%; }
          }
        </style>
      </head>
      <body>
        <img src="${imgData}" alt="Canvas" />
      </body>
    </html>
  `);
  
  printWindow.document.close();
  
  printWindow.onload = () => {
    printWindow.print();
    printWindow.close();
  };
};