import * as XLSX from 'xlsx';
import { parse, format, isValid } from 'date-fns';

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
  
  return formattedNumber;
};

/**
 * Validates if a mobile number is valid according to requirements:
 * - Must have exactly 10 digits
 * - Must start with 6 or higher
 */
export const validateMobileNumber = (phoneNumber: string): boolean => {
  if (!phoneNumber) return false;
  
  const formattedNumber = formatPhoneNumber(phoneNumber);
  
  // Check if it has 10 digits and starts with 6-9
  return formattedNumber.length === 10 && /^[6-9]/.test(formattedNumber);
};

/**
 * Enhanced date parsing function that handles multiple date formats
 * @param dateStr string representation of date in various formats
 * @returns Date object or null if parsing fails
 */
const parseMultiFormatDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  
  // Clean up the string - remove extra whitespace and standardize separators
  const cleanDateStr = dateStr.trim()
    .replace(/\s+/g, ' ')
    .replace(/[,،]/g, ' '); // Convert commas to spaces for easier parsing

  // Try JavaScript's native Date parsing first
  let date = new Date(cleanDateStr);
  if (isValid(date)) return date;
  
  // Array of format patterns to try
  const formatPatterns = [
    // Standard ISO formats
    'yyyy-MM-dd HH:mm:ss',
    'yyyy-MM-dd h:mm:ss a',
    'yyyy-MM-dd\'T\'HH:mm:ss\'Z\'',
    'yyyy-MM-dd\'T\'HH:mm:ss',
    
    // Date only formats
    'yyyy-MM-dd',
    'dd-MM-yyyy',
    'MM/dd/yyyy',
    'dd/MM/yyyy',
    'MM-dd-yyyy',
    'MM-dd-yy',
    'MM/dd/yy',
    'dd/MM/yy',
    
    // Month name variations
    'dd MMMM yyyy',
    'dd MMM yyyy',
    'MMM dd, yyyy',
    'MMMM dd, yyyy',
    
    // With time
    'yyyy-MM-dd HH:mm',
    'yyyy-MM-dd h:mm a',
    'MMMM dd, yyyy HH:mm',
    'MMMM dd, yyyy h:mm a',
    'MMM dd, yyyy HH:mm',
    'MMM dd, yyyy h:mm a',
    
    // Other formats
    'dd-MMM-yy',
    'dd-MMM-yyyy',
    'EEE, dd MMM yyyy',
    'EEEE, MMMM dd, yyyy'
  ];
  
  // Try different format patterns
  for (const pattern of formatPatterns) {
    try {
      date = parse(cleanDateStr, pattern, new Date());
      if (isValid(date)) return date;
    } catch (e) {
      // Continue to the next pattern
    }
  }
  
  // For numeric formats with 2-digit years, try to handle manually
  const numericRegex = /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/;
  const match = cleanDateStr.match(numericRegex);
  
  if (match) {
    const [_, part1, part2, part3] = match;
    
    // Try both MM-DD-YYYY and DD-MM-YYYY patterns
    const potentialFormats = [
      // Assume MM-DD-YYYY
      new Date(`${part1.padStart(2, '0')}/${part2.padStart(2, '0')}/${part3.length === 2 ? '20' + part3 : part3}`),
      // Assume DD-MM-YYYY
      new Date(`${part2.padStart(2, '0')}/${part1.padStart(2, '0')}/${part3.length === 2 ? '20' + part3 : part3}`)
    ];
    
    // Return the first valid date
    for (const potentialDate of potentialFormats) {
      if (isValid(potentialDate)) return potentialDate;
    }
  }
  
  // Handle Excel numeric date format (days since 1900-01-01)
  const numValue = Number(cleanDateStr);
  if (!isNaN(numValue) && numValue > 0) {
    // Excel date system (1900-01-01 = day 1)
    const excelEpoch = new Date(1900, 0, 1);
    excelEpoch.setDate(excelEpoch.getDate() + numValue - 2); // -2 adjustment for Excel's leap year bug
    if (isValid(excelEpoch)) return excelEpoch;
  }
  
  console.warn(`Could not parse date string: "${dateStr}"`);
  return null;
};

/**
 * Formats a date string to YYYY-MM-DD HH:MM:SS format
 */
export const formatDateString = (dateStr: string): string => {
  if (!dateStr) return '';
  
  try {
    const parsedDate = parseMultiFormatDate(dateStr);
    
    // Check if the date is valid
    if (!parsedDate || !isValid(parsedDate)) {
      console.warn(`Invalid date: "${dateStr}"`);
      return dateStr; // Return original if invalid
    }
    
    // Format to YYYY-MM-DD HH:MM:SS
    return format(parsedDate, 'yyyy-MM-dd HH:mm:ss');
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateStr; // Return original if error
  }
};

/**
 * Cleans a name string to contain only text and spaces
 */
export const cleanNameString = (name: string): string => {
  if (!name) return '';
  
  // Convert to string and trim
  const nameStr = String(name).trim();
  
  // Replace anything that's not a letter, space, or typical name characters
  return nameStr.replace(/[^a-zA-Z\s'-]/g, '');
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
        colWidths[col] = 25; // Name needs more space
        break;
      case 'email':
        colWidths[col] = 30; // Email needs more space
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
        colWidths[col] = 25; // Tags might be longer
        break;
      case 'txn_type':
        colWidths[col] = 15; // Transaction type
        break;
      case 'bill_number':
        colWidths[col] = 15; // Bill number
        break;
      case 'bill_amount':
        colWidths[col] = 15; // Bill amount
        break;
      case 'order_time':
        colWidths[col] = 20; // Order time (date format)
        break;
      case 'points_earned':
        colWidths[col] = 15; // Points earned
        break;
      case 'points_redeemed':
        colWidths[col] = 15; // Points redeemed
        break;
      case 'rejection_reason':
        colWidths[col] = 25; // Rejection reason
        break;
      default:
        colWidths[col] = 15; // Default width
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
