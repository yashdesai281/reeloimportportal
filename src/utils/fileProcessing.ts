
import * as XLSX from 'xlsx';
import { read, utils, write } from 'xlsx';

interface ColumnMapping {
  mobile: number;
  bill_number: number;
  bill_amount: number;
  order_time: number;
}

export const processFile = async (
  file: File, 
  columnMapping: ColumnMapping
): Promise<{ data: any; fileName: string }> => {
  try {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const isExcel = fileExtension === 'xlsx' || fileExtension === 'xls';
    
    // Create file buffer from the file
    const buffer = await file.arrayBuffer();
    
    // Parse the file based on its type
    let rawData;
    if (isExcel) {
      const workbook = read(buffer);
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      rawData = utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    } else {
      // Assume CSV
      const workbook = read(buffer, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      rawData = utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    }
    
    // Ensure we have data
    if (!rawData || rawData.length === 0) {
      throw new Error('The file appears to be empty');
    }
    
    // Process the data
    const processedData = processData(rawData, columnMapping);
    
    // Create a new workbook with the processed data
    const newWorkbook = XLSX.utils.book_new();
    const newWorksheet = XLSX.utils.aoa_to_sheet(processedData);
    XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, 'Processed Data');
    
    // Generate a buffer for the processed file
    const outputBuffer = XLSX.write(newWorkbook, { type: 'array', bookType: 'csv' });
    
    // Create a Blob from the buffer
    const blob = new Blob([outputBuffer], { type: 'text/csv' });
    
    // Generate a filename for the processed file
    const originalName = file.name.split('.')[0];
    const newFileName = `${originalName}_processed.csv`;
    
    return {
      data: blob,
      fileName: newFileName
    };
  } catch (error) {
    console.error('Error processing file:', error);
    throw error;
  }
};

const processData = (data: any[], columnMapping: ColumnMapping): any[][] => {
  // Create header row
  const headerRow = ['mobile', 'txn_type', 'bill_number', 'bill_amount', 'order_time', 'points_earned', 'points_redeemed'];
  
  // Process data rows
  const dataRows = data.slice(1).map(row => {
    // Only process rows that have at least one value
    if (row.some(cell => cell !== '')) {
      return [
        // Extract values based on the column mapping (subtract 1 as arrays are 0-indexed)
        row[columnMapping.mobile - 1] || '',
        'purchase', // Always set to "purchase"
        row[columnMapping.bill_number - 1] || '',
        row[columnMapping.bill_amount - 1] || '',
        row[columnMapping.order_time - 1] || '',
        '', // Empty for points_earned
        ''  // Empty for points_redeemed
      ];
    }
    return null;
  }).filter(row => row !== null); // Remove empty rows
  
  // Combine header and data rows
  return [headerRow, ...dataRows];
};

export const downloadFile = (blob: Blob, fileName: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
