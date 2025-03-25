
import * as XLSX from 'xlsx';
import { generateTimestamp } from './fileUtils';
import { workbookToBlob, applyWorksheetStyling } from './excelUtils';

/**
 * Creates and formats workbooks for data export as CSV
 */
export const createExcelWorkbook = (
  validData: any[][], 
  rejectedData: any[][], 
  validHeaders: string[], 
  rejectedHeaders: string[], 
  sheetNames: { valid: string, rejected: string }
): Promise<{ workbook: XLSX.WorkBook, fileName: string }> => {
  // Create a new workbook
  const workbook = XLSX.utils.book_new();
  
  // Create worksheets from the data
  const validWS = XLSX.utils.aoa_to_sheet(validData);
  const rejectedWS = XLSX.utils.aoa_to_sheet(rejectedData);
  
  // Apply styling to both worksheets
  applyWorksheetStyling(validWS, validHeaders);
  applyWorksheetStyling(rejectedWS, rejectedHeaders);
  
  // Add the worksheets to the workbook
  XLSX.utils.book_append_sheet(workbook, validWS, sheetNames.valid);
  XLSX.utils.book_append_sheet(workbook, rejectedWS, sheetNames.rejected);
  
  // Generate a filename with timestamp
  const timestamp = generateTimestamp();
  const fileName = `${sheetNames.valid.toLowerCase()}_${timestamp}.csv`;
  
  return Promise.resolve({ workbook, fileName });
};

/**
 * Extracts data from an uploaded Excel file
 */
export const extractDataFromFile = (file: File): Promise<{ workbook: XLSX.WorkBook, rawData: any[][] }> => {
  return new Promise(async (resolve, reject) => {
    try {
      // Read the uploaded file
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer);
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convert to array of arrays
      const rawData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
      
      if (rawData.length <= 1) {
        throw new Error("File contains no data rows");
      }
      
      resolve({ workbook, rawData });
    } catch (error) {
      reject(error);
    }
  });
};
