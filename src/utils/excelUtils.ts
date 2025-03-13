
import * as XLSX from 'xlsx';

/**
 * Utilities for working with Excel files
 */

/**
 * Converts a workbook to a Blob for file download
 */
export const workbookToBlob = (workbook: XLSX.WorkBook): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    try {
      const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([new Uint8Array(wbout)], { type: 'application/octet-stream' });
      resolve(blob);
    } catch (error) {
      console.error("Error converting workbook to blob:", error);
      reject(error);
    }
  });
};

/**
 * Creates a download link for a blob
 */
export const downloadFile = (data: Blob, fileName: string) => {
  const url = window.URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

/**
 * Formats a phone number by removing common prefixes like +91, 91
 */
export const formatPhoneNumber = (phoneNumber: string): string => {
  if (!phoneNumber) return '';
  
  // Convert to string and trim
  let formattedNumber = String(phoneNumber).trim();
  
  // Remove country code prefix +91 or 91
  if (formattedNumber.startsWith('+91')) {
    formattedNumber = formattedNumber.substring(3);
  } else if (formattedNumber.startsWith('91') && formattedNumber.length > 10) {
    formattedNumber = formattedNumber.substring(2);
  }
  
  // Remove any spaces, dashes or parentheses
  formattedNumber = formattedNumber.replace(/[\s\-\(\)]/g, '');
  
  return formattedNumber;
};
