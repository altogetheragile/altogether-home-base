import jsPDF from 'jspdf';

export interface ExportOptions {
  format: 'pdf' | 'png' | 'jpeg';
  quality?: number;
  filename?: string;
}

export const exportFabricBMC = async (canvasElement: any, options: ExportOptions) => {
  const { format, quality = 0.95, filename = 'business-model-canvas' } = options;

  try {
    if (!canvasElement || !canvasElement.exportCanvas) {
      throw new Error('Canvas element or export function not found');
    }

    const dataURL = canvasElement.exportCanvas(format, quality);
    
    if (!dataURL) {
      throw new Error('Failed to generate canvas data');
    }

    if (format === 'pdf') {
      // Create PDF with proper dimensions
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Calculate dimensions to fit A4 landscape while maintaining aspect ratio
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const canvasAspectRatio = 1200 / 800; // BMC canvas aspect ratio
      
      let imgWidth = pdfWidth - 20; // 10mm margin on each side
      let imgHeight = imgWidth / canvasAspectRatio;
      
      if (imgHeight > pdfHeight - 20) {
        imgHeight = pdfHeight - 20; // 10mm margin top/bottom
        imgWidth = imgHeight * canvasAspectRatio;
      }
      
      const x = (pdfWidth - imgWidth) / 2;
      const y = (pdfHeight - imgHeight) / 2;
      
      pdf.addImage(dataURL, 'PNG', x, y, imgWidth, imgHeight);
      pdf.save(`${filename}.pdf`);
    } else {
      // For PNG/JPEG, create download link
      const link = document.createElement('a');
      link.download = `${filename}.${format}`;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    return { success: true, message: `BMC exported as ${format.toUpperCase()} successfully!` };
  } catch (error) {
    console.error('Export failed:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Export failed due to an unknown error' 
    };
  }
};

export const printFabricBMC = (canvasElement: any) => {
  try {
    if (!canvasElement || !canvasElement.exportCanvas) {
      throw new Error('Canvas element or export function not found');
    }

    const dataURL = canvasElement.exportCanvas('png', 1.0);
    
    if (!dataURL) {
      throw new Error('Failed to generate canvas data for printing');
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Failed to open print window');
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Business Model Canvas - Print</title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background: white;
            }
            img {
              max-width: 100%;
              max-height: 100%;
              object-fit: contain;
            }
            @media print {
              body { padding: 0; }
              img { 
                width: 100vw;
                height: 100vh;
                object-fit: contain;
              }
            }
          </style>
        </head>
        <body>
          <img src="${dataURL}" alt="Business Model Canvas" onload="window.print(); window.close();" />
        </body>
      </html>
    `);
    
    printWindow.document.close();
    
    return { success: true, message: 'Print dialog opened successfully!' };
  } catch (error) {
    console.error('Print failed:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Print failed due to an unknown error' 
    };
  }
};