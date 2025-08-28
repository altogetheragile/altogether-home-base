import * as XLSX from 'xlsx';

export interface ParsedFileData {
  data: Record<string, any>[];
  headers: string[];
  fileName: string;
  fileSize: number;
  rowCount: number;
}

export interface FileParseResult {
  success: boolean;
  data?: ParsedFileData;
  error?: string;
}

export const parseFile = async (file: File): Promise<FileParseResult> => {
  try {
    const fileType = getFileType(file.name);
    
    if (!fileType) {
      return { success: false, error: 'Unsupported file format. Please use Excel (.xlsx, .xls) or CSV (.csv) files.' };
    }

    let parsedData: Record<string, any>[] = [];
    let parsedHeaders: string[] = [];

    if (fileType === 'csv') {
      const result = await parseCSV(file);
      parsedData = result.data;
      parsedHeaders = result.headers;
    } else if (fileType === 'excel') {
      const result = await parseExcel(file);
      parsedData = result.data;
      parsedHeaders = result.headers;
    }

    return {
      success: true,
      data: {
        data: parsedData,
        headers: parsedHeaders,
        fileName: file.name,
        fileSize: file.size,
        rowCount: parsedData.length,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse file',
    };
  }
};

const getFileType = (filename: string): 'excel' | 'csv' | null => {
  const extension = filename.toLowerCase().split('.').pop();
  
  switch (extension) {
    case 'xlsx':
    case 'xls':
      return 'excel';
    case 'csv':
      return 'csv';
    default:
      return null;
  }
};

const parseCSV = async (file: File): Promise<{ data: Record<string, any>[]; headers: string[] }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length === 0) {
          resolve({ data: [], headers: [] });
          return;
        }

        // Parse CSV headers
        const csvHeaders = parseCSVLine(lines[0]);
        const csvData: Record<string, any>[] = [];

        // Parse CSV data rows
        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i]);
          const row: Record<string, any> = {};
          
          csvHeaders.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          
          csvData.push(row);
        }

        resolve({ data: csvData, headers: csvHeaders });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read CSV file'));
    reader.readAsText(file);
  });
};

const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
};

const parseExcel = async (file: File): Promise<{ data: Record<string, any>[]; headers: string[] }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        
        // Get the first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON with headers
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        if (jsonData.length === 0) {
          resolve({ data: [], headers: [] });
          return;
        }

        // First row contains headers
        const headers = jsonData[0].map((header: any) => String(header || '').trim()).filter(Boolean);
        const processedData: Record<string, any>[] = [];

        // Process data rows
        for (let i = 1; i < jsonData.length; i++) {
          const rowData = jsonData[i];
          const row: Record<string, any> = {};
          
          headers.forEach((header, index) => {
            const cellValue = rowData[index];
            row[header] = cellValue !== undefined && cellValue !== null ? String(cellValue).trim() : '';
          });
          
          // Only add rows that have at least one non-empty value
          if (Object.values(row).some(value => value !== '')) {
            processedData.push(row);
          }
        }

        resolve({ data: processedData, headers });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read Excel file'));
    reader.readAsArrayBuffer(file);
  });
};

export const validateFileSize = (file: File, maxSizeMB: number = 10): boolean => {
  return file.size <= maxSizeMB * 1024 * 1024;
};

export const getFileSizeDisplay = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};