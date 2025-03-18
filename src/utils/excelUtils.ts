
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
 * and ensuring it follows the Indian mobile number format
 */
export const formatPhoneNumber = (phoneNumber: string): string => {
  if (!phoneNumber) return '';
  
  // Convert to string and trim
  let formattedNumber = String(phoneNumber).trim();
  
  // Remove all non-digit characters first
  formattedNumber = formattedNumber.replace(/\D/g, '');
  
  // Remove country code prefix +91 or 91
  if (formattedNumber.startsWith('91') && formattedNumber.length > 10) {
    formattedNumber = formattedNumber.substring(2);
  }
  
  // Handle international format with + sign (already removed above)
  // Just ensure we have the correct length
  
  // Ensure we have exactly 10 digits for Indian numbers
  if (formattedNumber.length > 10) {
    // If we have more than 10 digits, take the last 10
    formattedNumber = formattedNumber.slice(-10);
  }
  
  // Validate that it's a proper Indian mobile number (starts with 6-9)
  if (formattedNumber.length === 10 && !/^[6-9]/.test(formattedNumber)) {
    console.warn(`Invalid Indian mobile number format: ${formattedNumber}`);
  }
  
  return formattedNumber;
};

/**
 * Apply column width and styling to a worksheet
 */
export const applyWorksheetStyling = (worksheet: XLSX.WorkSheet, headers: string[]): void => {
  if (!worksheet || !headers) return;
  
  // Set column widths based on headers
  const colWidths: { [key: string]: number } = {};
  
  // Default minimum width for each column
  headers.forEach((header, i) => {
    // Convert index to column reference (A, B, C, etc.)
    const col = XLSX.utils.encode_col(i);
    // Set appropriate width based on header type
    switch (header.toLowerCase()) {
      case 'mobile':
        colWidths[col] = 15; // Mobile needs fixed width
        break;
      case 'name':
        colWidths[col] = 20; // Name needs more space
        break;
      case 'email':
        colWidths[col] = 25; // Email needs more space
        break;
      case 'birthday':
        colWidths[col] = 15; // Dates need moderate space
        break;
      case 'points':
        colWidths[col] = 10; // Points is numeric and short
        break;
      case 'anniversary':
        colWidths[col] = 15; // Dates need moderate space
        break;
      case 'gender':
        colWidths[col] = 10; // Gender is short
        break;
      case 'tags':
        colWidths[col] = 20; // Tags might be longer
        break;
      default:
        colWidths[col] = 12; // Default width
    }
  });
  
  // Apply column widths
  worksheet['!cols'] = Object.keys(colWidths).map(col => ({ wch: colWidths[col] }));
  
  // Apply styling to header row
  const headerStyle = { 
    font: { bold: true, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "4F81BD" } },
    alignment: { horizontal: "center", vertical: "center" }
  };
  
  // Apply styles to each header cell
  for (let i = 0; i < headers.length; i++) {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: i });
    if (!worksheet[cellRef]) worksheet[cellRef] = { v: headers[i] };
    worksheet[cellRef].s = headerStyle;
  }
};
