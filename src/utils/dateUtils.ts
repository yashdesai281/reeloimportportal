
import { parse, format, isValid } from 'date-fns';

/**
 * Enhanced date parsing function that handles multiple date formats
 * @param dateStr string representation of date in various formats
 * @returns Date object or null if parsing fails
 */
export const parseMultiFormatDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  
  // Clean up the string - remove extra whitespace, standardize separators and remove pipe character
  const cleanDateStr = dateStr.trim()
    .replace(/\s*\|\s*/g, ' ') // Remove pipe character with spaces around it
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
 * Formats a date string to the specified format (default: YYYY-MM-DD)
 * @param dateStr Original date string in any format
 * @param formatStr Output format pattern, defaults to yyyy-MM-dd
 * @returns Formatted date string or original string if parsing fails
 */
export const formatDateString = (dateStr: string, formatStr: string = 'yyyy-MM-dd'): string => {
  if (!dateStr) return '';
  
  try {
    const parsedDate = parseMultiFormatDate(dateStr);
    
    // Check if the date is valid
    if (!parsedDate || !isValid(parsedDate)) {
      console.warn(`Invalid date: "${dateStr}"`);
      return dateStr; // Return original if invalid
    }
    
    // Format to the desired pattern
    return format(parsedDate, formatStr);
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateStr; // Return original if error
  }
};

/**
 * Utility function for processing dates in import files
 * Parses a date and returns it in the specified format.
 * If the date cannot be parsed, returns an empty string or the original string.
 */
export const parseAndFormatDate = (
  dateStr: string, 
  outputFormat: string = 'yyyy-MM-dd', 
  returnOriginalOnError: boolean = false
): string => {
  if (!dateStr) return '';
  
  try {
    const parsedDate = parseMultiFormatDate(dateStr);
    if (!parsedDate || !isValid(parsedDate)) {
      return returnOriginalOnError ? dateStr : '';
    }
    return format(parsedDate, outputFormat);
  } catch (error) {
    console.error(`Error parsing date "${dateStr}":`, error);
    return returnOriginalOnError ? dateStr : '';
  }
};
