import { parse, format, isValid } from 'date-fns';

/**
 * List of known date format patterns to try when parsing dates
 */
const KNOWN_FORMATS = [
  // Standard ISO formats
  'yyyy-MM-dd HH:mm:ss',
  'yyyy-MM-dd h:mm:ss a',
  "yyyy-MM-dd'T'HH:mm:ssX",
  "yyyy-MM-dd'T'HH:mm:ss'Z'",
  "yyyy-MM-dd'T'HH:mm:ss",
  
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
  'MMM dd yyyy',
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

/**
 * Parse a date string in a flexible manner, supporting various formats
 * and returning a consistently formatted date string
 * 
 * @param input The date string to parse
 * @param returnFormat The format to return the date in (default: 'yyyy-MM-dd HH:mm:ss')
 * @returns Formatted date string or null if parsing fails
 */
export function parseFlexibleDateTime(input: string, returnFormat: string = 'yyyy-MM-dd HH:mm:ss'): string | null {
  if (!input) return null;
  
  // Clean up the input string
  const cleanInput = input.trim()
    .replace(/\s*\|\s*/g, ' ') // Remove pipe character with spaces around it
    .replace(/\s+/g, ' ')
    .replace(/[,،]/g, ' '); // Convert commas to spaces for easier parsing
  
  // Try all known formats
  for (const formatStr of KNOWN_FORMATS) {
    try {
      const parsed = parse(cleanInput, formatStr, new Date());
      if (isValid(parsed)) {
        return format(parsed, returnFormat);
      }
    } catch (_) {
      // Continue to next format
    }
  }

  // Fallback: try native Date parsing
  try {
    const fallback = new Date(cleanInput);
    if (isValid(fallback)) {
      return format(fallback, returnFormat);
    }
  } catch (_) {
    // Continue to numeric check
  }
  
  // Handle Excel numeric date format (days since 1900-01-01)
  const numValue = Number(cleanInput);
  if (!isNaN(numValue) && numValue > 0) {
    // Excel date system (1900-01-01 = day 1)
    const excelEpoch = new Date(1900, 0, 1);
    excelEpoch.setDate(excelEpoch.getDate() + numValue - 2); // -2 adjustment for Excel's leap year bug
    if (isValid(excelEpoch)) {
      return format(excelEpoch, returnFormat);
    }
  }

  // For numeric formats with 2-digit years, try to handle manually
  const numericRegex = /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/;
  const match = cleanInput.match(numericRegex);
  
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
      if (isValid(potentialDate)) {
        return format(potentialDate, returnFormat);
      }
    }
  }
  
  return null;
}

/**
 * Formats a date string to YYYY-MM-DD HH:MM:SS format
 * This is a wrapper around parseFlexibleDateTime for backward compatibility
 */
export const formatDateString = (dateStr: string): string => {
  if (!dateStr) return '';
  
  try {
    const formattedDate = parseFlexibleDateTime(dateStr);
    
    // Check if the date is valid
    if (!formattedDate) {
      console.warn(`Invalid date: "${dateStr}"`);
      return dateStr; // Return original if invalid
    }
    
    return formattedDate;
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateStr; // Return original if error
  }
};

/**
 * Enhanced date parsing function that handles multiple date formats
 * This is kept for backward compatibility but now delegates to parseFlexibleDateTime
 * @param dateStr string representation of date in various formats
 * @returns Date object or null if parsing fails
 */
export const parseMultiFormatDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  
  const formattedDate = parseFlexibleDateTime(dateStr);
  if (!formattedDate) return null;
  
  return new Date(formattedDate);
};
