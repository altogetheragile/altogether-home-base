import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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

export interface BMCExportOptions {
  format?: 'png' | 'pdf' | 'jpeg';
  quality?: number;
  filename?: string;
  companyName?: string;
}

const BMC_SECTIONS = [
  { key: 'keyPartners', title: 'Key Partners', gridArea: 'partners' },
  { key: 'keyActivities', title: 'Key Activities', gridArea: 'activities' },
  { key: 'keyResources', title: 'Key Resources', gridArea: 'resources' },
  { key: 'valuePropositions', title: 'Value Propositions', gridArea: 'value' },
  { key: 'customerRelationships', title: 'Customer Relationships', gridArea: 'relationships' },
  { key: 'channels', title: 'Channels', gridArea: 'channels' },
  { key: 'customerSegments', title: 'Customer Segments', gridArea: 'segments' },
  { key: 'costStructure', title: 'Cost Structure', gridArea: 'costs' },
  { key: 'revenueStreams', title: 'Revenue Streams', gridArea: 'revenue' },
];

/**
 * Creates a clean, export-ready DOM structure for the BMC
 */
const createExportDOM = (data: BMCData, companyName?: string): HTMLElement => {
  const container = document.createElement('div');
  container.style.cssText = `
    width: 1200px;
    height: 800px;
    background: white;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    position: absolute;
    top: -10000px;
    left: -10000px;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    grid-template-rows: auto 1fr 1fr;
    grid-template-areas:
      "title title title title title"
      "partners activities value relationships segments"
      "partners resources value channels segments"
      "costs costs revenue revenue revenue";
    gap: 2px;
    padding: 20px;
    box-sizing: border-box;
  `;

  // Add title if company name is provided
  if (companyName) {
    const titleDiv = document.createElement('div');
    titleDiv.style.cssText = `
      grid-area: title;
      text-align: center;
      font-size: 24px;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 16px;
      padding: 8px;
    `;
    titleDiv.textContent = `${companyName} - Business Model Canvas`;
    container.appendChild(titleDiv);
  }

  // Create sections
  BMC_SECTIONS.forEach(section => {
    const sectionDiv = document.createElement('div');
    sectionDiv.style.cssText = `
      grid-area: ${section.gridArea};
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      padding: 12px;
      background: #fefefe;
      display: flex;
      flex-direction: column;
      min-height: 120px;
    `;

    // Section title
    const titleDiv = document.createElement('div');
    titleDiv.style.cssText = `
      font-weight: 600;
      font-size: 14px;
      color: #374151;
      margin-bottom: 8px;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 4px;
    `;
    titleDiv.textContent = section.title;
    sectionDiv.appendChild(titleDiv);

    // Section content
    const contentDiv = document.createElement('div');
    contentDiv.style.cssText = `
      flex: 1;
      font-size: 12px;
      line-height: 1.4;
      color: #4b5563;
      white-space: pre-wrap;
      word-wrap: break-word;
      overflow-wrap: break-word;
    `;
    
    // Get the content and ensure proper text rendering
    const content = data[section.key as keyof BMCData] || '';
    contentDiv.textContent = content;
    sectionDiv.appendChild(contentDiv);

    container.appendChild(sectionDiv);
  });

  return container;
};

/**
 * Export BMC data to various formats
 */
export const exportBMC = async (
  data: BMCData,
  options: BMCExportOptions = {}
): Promise<string> => {
  const {
    format = 'png',
    quality = 0.95,
    filename = 'business-model-canvas',
    companyName
  } = options;

  console.log('🎯 Starting BMC export with clean data:', data);
  console.log('📋 Export options:', options);

  // Create clean export DOM
  const exportElement = createExportDOM(data, companyName);
  document.body.appendChild(exportElement);

  try {
    console.log('📸 Capturing with html2canvas...');
    
    // Capture with html2canvas
    const canvas = await html2canvas(exportElement, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      width: 1200,
      height: 800,
    });

    console.log('✅ Canvas captured successfully:', {
      width: canvas.width,
      height: canvas.height
    });

    // Generate output based on format
    let dataUrl: string;
    
    if (format === 'pdf') {
      dataUrl = await exportToPDF(canvas, filename);
    } else if (format === 'jpeg') {
      dataUrl = canvas.toDataURL('image/jpeg', quality);
    } else {
      dataUrl = canvas.toDataURL('image/png');
    }

    console.log('📁 Export completed, data URL length:', dataUrl.length);
    return dataUrl;

  } catch (error) {
    console.error('❌ Export failed:', error);
    throw new Error(`Failed to export BMC: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    // Clean up
    document.body.removeChild(exportElement);
  }
};

/**
 * Export canvas to PDF
 */
const exportToPDF = async (canvas: HTMLCanvasElement, filename: string): Promise<string> => {
  const imgData = canvas.toDataURL('image/png');
  
  // BMC is landscape oriented
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  
  // Calculate dimensions to fit page while maintaining aspect ratio
  const aspectRatio = canvas.width / canvas.height;
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

/**
 * Download the exported file
 */
export const downloadBMC = (dataUrl: string, filename: string, format: string) => {
  const link = document.createElement('a');
  link.download = `${filename}.${format}`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Print BMC data
 */
export const printBMC = async (data: BMCData, companyName?: string) => {
  console.log('🖨️ Starting BMC print with data:', data);

  const exportElement = createExportDOM(data, companyName);
  document.body.appendChild(exportElement);

  try {
    const canvas = await html2canvas(exportElement, {
      backgroundColor: '#ffffff',
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
          <title>Business Model Canvas - ${companyName || 'Print'}</title>
          <style>
            body { 
              margin: 0; 
              padding: 20px; 
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            img { 
              max-width: 100%; 
              height: auto; 
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            @media print {
              body { padding: 0; }
              img { width: 100%; }
            }
          </style>
        </head>
        <body>
          <img src="${imgData}" alt="Business Model Canvas" />
        </body>
      </html>
    `);
    
    printWindow.document.close();
    
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };

  } catch (error) {
    console.error('❌ Print failed:', error);
    throw new Error(`Failed to print BMC: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    document.body.removeChild(exportElement);
  }
};