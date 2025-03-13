
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';

export interface ColumnMapping {
  mobile: number;
  bill_number: number;
  bill_amount: number;
  order_time: number;
}

export interface ContactsColumnMapping {
  mobile: number;
  name?: number;
  email?: number;
  birthday?: number;
  anniversary?: number;
  gender?: number;
  points?: number;
  tags?: number;
}

export async function processFile(file: File, mapping: ColumnMapping): Promise<{ 
  transactionData: Blob; 
  transactionFileName: string;
  rawData: any[][];
  hasContactData: boolean;
}> {
  return new Promise(async (resolve, reject) => {
    try {
      // Read the file
      const fileReader = new FileReader();
      
      fileReader.onload = async (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheet = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheet];
          
          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
          
          // Process based on mapping for transaction file
          const processedData = processTransactionData(jsonData, mapping);
          
          // Convert back to workbook
          const processedWorkbook = XLSX.utils.book_new();
          const processedWorksheet = XLSX.utils.aoa_to_sheet(processedData);
          XLSX.utils.book_append_sheet(processedWorkbook, processedWorksheet, 'Processed Data');
          
          // Generate processed file
          const processedExcel = XLSX.write(processedWorkbook, { bookType: 'xlsx', type: 'binary' });
          const processedBlob = new Blob(
            [s2ab(processedExcel)], 
            { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
          );
          
          // Generate filename
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const fileName = `transaction_${timestamp}.xlsx`;
          
          // Store metadata in Supabase
          const { error } = await supabase
            .from('processed_files')
            .insert({
              file_name: fileName,
              original_file_name: file.name,
              column_mapping: mapping,
            });
          
          if (error) {
            console.error('Error storing file metadata:', error);
          }
          
          // Check if we have potential contacts data
          const hasContactData = detectContactsData(jsonData);
          
          resolve({ 
            transactionData: processedBlob, 
            transactionFileName: fileName,
            rawData: jsonData,
            hasContactData
          });
        } catch (error) {
          console.error('Processing error:', error);
          reject(error);
        }
      };
      
      fileReader.onerror = (error) => {
        reject(error);
      };
      
      fileReader.readAsBinaryString(file);
    } catch (error) {
      reject(error);
    }
  });
}

function processTransactionData(data: any[][], mapping: ColumnMapping): any[][] {
  // Create header row for new file
  const header = ['Mobile Number', 'Bill Number', 'Bill Amount', 'Order Time'];
  
  // Process each row according to the mapping
  const processedRows = data.slice(1).map(row => [
    cleanMobileNumber(row[mapping.mobile - 1]),  // Mobile Number
    row[mapping.bill_number - 1],                // Bill Number
    cleanNumericValue(row[mapping.bill_amount - 1]), // Bill Amount
    formatDate(row[mapping.order_time - 1]),     // Order Time
  ]);
  
  // Return processed data with header
  return [header, ...processedRows];
}

export async function generateContactsFile(rawData: any[][], mapping: ContactsColumnMapping): Promise<{ data: Blob; fileName: string }> {
  return new Promise((resolve, reject) => {
    try {
      // Process the contacts data
      const processedData = processContactsData(rawData, mapping);
      
      // Convert to workbook
      const contactsWorkbook = XLSX.utils.book_new();
      const contactsWorksheet = XLSX.utils.aoa_to_sheet(processedData);
      XLSX.utils.book_append_sheet(contactsWorkbook, contactsWorksheet, 'Contacts');
      
      // Generate file
      const contactsExcel = XLSX.write(contactsWorkbook, { bookType: 'xlsx', type: 'binary' });
      const contactsBlob = new Blob(
        [s2ab(contactsExcel)], 
        { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
      );
      
      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `contacts_${timestamp}.xlsx`;
      
      resolve({ data: contactsBlob, fileName });
    } catch (error) {
      console.error('Error generating contacts file:', error);
      reject(error);
    }
  });
}

function processContactsData(data: any[][], mapping: ContactsColumnMapping): any[][] {
  // Create header row for contacts file
  const header = ['Phone Number', 'Name', 'Email', 'Birthday', 'Anniversary', 'Gender', 'Points', 'Tags'];
  
  // Process each row according to the mapping
  const processedRows = data.slice(1).map(row => {
    return [
      cleanMobileNumber(row[mapping.mobile - 1]),              // Phone Number
      mapping.name ? cleanTextValue(row[mapping.name - 1]) : '',              // Name
      mapping.email ? cleanEmailValue(row[mapping.email - 1]) : '',           // Email
      mapping.birthday ? formatDate(row[mapping.birthday - 1]) : '',          // Birthday
      mapping.anniversary ? formatDate(row[mapping.anniversary - 1]) : '',    // Anniversary
      mapping.gender ? cleanTextValue(row[mapping.gender - 1]) : '',          // Gender
      mapping.points ? cleanNumericValue(row[mapping.points - 1]) : '',       // Points
      mapping.tags ? cleanTextValue(row[mapping.tags - 1]) : '',              // Tags
    ];
  });

  // Remove duplicate contacts based on phone number
  const uniqueContacts = removeDuplicateContacts(processedRows);
  
  // Return processed data with header
  return [header, ...uniqueContacts];
}

// Data cleaning functions

function cleanMobileNumber(value: any): string {
  if (!value) return '';
  
  // Convert to string if it's not already
  const strValue = String(value);
  
  // Remove non-numeric characters
  let cleanValue = strValue.replace(/\D/g, '');
  
  // Remove prefixes like +91 or 91
  if (cleanValue.startsWith('91') && cleanValue.length > 10) {
    cleanValue = cleanValue.substring(2);
  }
  
  return cleanValue;
}

function cleanTextValue(value: any): string {
  if (!value) return '';
  
  // Convert to string if it's not already
  const strValue = String(value);
  
  // Remove special characters and extra spaces
  return strValue.replace(/[^\w\s]/gi, '').replace(/\s+/g, ' ').trim();
}

function cleanEmailValue(value: any): string {
  if (!value) return '';
  
  // Convert to string if it's not already
  const strValue = String(value);
  
  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(strValue) ? strValue.trim().toLowerCase() : '';
}

function cleanNumericValue(value: any): number | string {
  if (value === undefined || value === null || value === '') return '';
  
  // If it's already a number, return it
  if (typeof value === 'number') return value;
  
  // Convert string to number
  const strValue = String(value);
  const numericValue = parseFloat(strValue.replace(/[^\d.-]/g, ''));
  
  return isNaN(numericValue) ? '' : numericValue;
}

function formatDate(value: any): string {
  if (!value) return '';
  
  let dateValue;
  
  // If it's already a Date object
  if (value instanceof Date) {
    dateValue = value;
  } else {
    // Try to parse various date formats
    const strValue = String(value).trim();
    
    // Check if it's an Excel date (numeric)
    if (/^[0-9]+(\.[0-9]+)?$/.test(strValue)) {
      try {
        dateValue = XLSX.SSF.parse_date_code(parseFloat(strValue));
        const year = dateValue.y;
        const month = dateValue.m.toString().padStart(2, '0');
        const day = dateValue.d.toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
      } catch (e) {
        // Not an Excel date, continue with other parsing methods
      }
    }
    
    // Try to parse as Date
    dateValue = new Date(strValue);
    if (isNaN(dateValue.getTime())) {
      // Not a valid date
      return '';
    }
  }
  
  // Format as YYYY-MM-DD
  const year = dateValue.getFullYear();
  const month = (dateValue.getMonth() + 1).toString().padStart(2, '0');
  const day = dateValue.getDate().toString().padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

function removeDuplicateContacts(rows: any[][]): any[][] {
  const seen = new Set();
  return rows.filter(row => {
    const phoneNumber = row[0]; // Phone number is the first column
    if (!phoneNumber || seen.has(phoneNumber)) {
      return false;
    }
    seen.add(phoneNumber);
    return true;
  });
}

function detectContactsData(data: any[][]): boolean {
  // Basic heuristic to detect if this data might contain contacts
  // Check if header row contains common contact fields
  if (data.length < 2) return false;
  
  const headerRow = data[0].map(cell => String(cell || '').toLowerCase());
  const contactFields = [
    'mobile', 'phone', 'contact', 'cell', 'name', 'email', 
    'birthday', 'birth', 'dob', 'anniversary', 'gender', 'points', 'tag', 'tags'
  ];
  
  // Count how many contact-related fields we can find
  const contactFieldCount = contactFields.reduce((count, field) => {
    return count + (headerRow.some(header => header.includes(field)) ? 1 : 0);
  }, 0);
  
  // If we find at least 2 contact-related fields, assume it might be contact data
  return contactFieldCount >= 2;
}

// Convert string to ArrayBuffer
function s2ab(s: string): ArrayBuffer {
  const buf = new ArrayBuffer(s.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < s.length; i++) {
    view[i] = s.charCodeAt(i) & 0xFF;
  }
  return buf;
}

export function downloadFile(data: Blob, fileName: string): void {
  const url = window.URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
