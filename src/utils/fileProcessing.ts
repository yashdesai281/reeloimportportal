import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';

export interface ColumnMapping {
  mobile: string;
  bill_number: string;
  bill_amount: string;
  order_time: string;
  points_earned: string;
  points_redeemed: string;
}

export interface ContactsColumnMapping {
  name: string;
  mobile: string;
  email: string;
  birthday: string;
  points: string;
}

interface ProcessFileResult {
  transactionData: Blob;
  transactionFileName: string;
  rawData: any[][];
  hasContactData: boolean;
}

const workbook_to_blob = (workbook: XLSX.WorkBook): Promise<Blob> => {
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

export const indexToColumnLabel = (index: number): string => {
  let columnLabel = '';
  let tempIndex = index;

  while (tempIndex >= 0) {
    columnLabel = String.fromCharCode((tempIndex % 26) + 65) + columnLabel;
    tempIndex = Math.floor(tempIndex / 26) - 1;
  }

  return columnLabel;
};

export const columnLabelToIndex = (columnLabel: string): number => {
  let index = 0;
  for (let i = 0; i < columnLabel.length; i++) {
    index *= 26;
    index += columnLabel.charCodeAt(i) - 'A'.charCodeAt(0) + 1;
  }
  return index - 1;
};

export const processFile = async (file: File, columnMapping: ColumnMapping): Promise<ProcessFileResult> => {
  try {
    console.log("Processing file:", file.name);
    console.log("With column mapping:", columnMapping);
    
    // Read the file
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer);
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Convert to array of arrays for easier processing
    const rawData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
    console.log(`Raw data loaded, ${rawData.length} rows found`);
    
    if (rawData.length <= 1) {
      throw new Error("File contains no data rows");
    }
    
    // Create new workbook with specific format
    const transactionWB = XLSX.utils.book_new();
    
    // Create header row for transaction file
    const transactionHeaders = ["mobile", "txn_type", "bill_number", "bill_amount", "order_time", "points_earned", "points_redeemed"];
    
    // Map data using column mapping
    const transactionData: any[][] = [transactionHeaders];
    
    // Map column indices to actual indices
    const columnIndices = {
      mobile: columnMapping.mobile ? columnLabelToIndex(columnMapping.mobile) : -1,
      bill_number: columnMapping.bill_number ? columnLabelToIndex(columnMapping.bill_number) : -1,
      bill_amount: columnMapping.bill_amount ? columnLabelToIndex(columnMapping.bill_amount) : -1,
      order_time: columnMapping.order_time ? columnLabelToIndex(columnMapping.order_time) : -1,
      points_earned: columnMapping.points_earned ? columnLabelToIndex(columnMapping.points_earned) : -1,
      points_redeemed: columnMapping.points_redeemed ? columnLabelToIndex(columnMapping.points_redeemed) : -1,
    };
    
    console.log("Mapped column indices:", columnIndices);
    
    // Skip the header row of the original data
    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i];
      const newRow = ["", "", "", "", "", "", ""];  // Initialize with empty strings for all columns
      
      // Check if the row has any data
      const hasData = row.some((cell: any) => cell !== undefined && cell !== null && cell !== "");
      
      if (hasData) {
        // Mobile number
        if (columnIndices.mobile >= 0 && row[columnIndices.mobile] !== undefined) {
          newRow[0] = String(row[columnIndices.mobile]).trim();
        }
        
        // Transaction type (always "purchase")
        newRow[1] = "purchase";
        
        // Bill number
        if (columnIndices.bill_number >= 0 && row[columnIndices.bill_number] !== undefined) {
          newRow[2] = String(row[columnIndices.bill_number]).trim();
        }
        
        // Bill amount
        if (columnIndices.bill_amount >= 0 && row[columnIndices.bill_amount] !== undefined) {
          newRow[3] = String(row[columnIndices.bill_amount]).trim();
        }
        
        // Order time
        if (columnIndices.order_time >= 0 && row[columnIndices.order_time] !== undefined) {
          // Maintain the date format but ensure it's a string
          newRow[4] = String(row[columnIndices.order_time]).trim();
        }
        
        // Points earned
        if (columnIndices.points_earned >= 0 && row[columnIndices.points_earned] !== undefined) {
          newRow[5] = String(row[columnIndices.points_earned]).trim();
        }
        
        // Points redeemed
        if (columnIndices.points_redeemed >= 0 && row[columnIndices.points_redeemed] !== undefined) {
          newRow[6] = String(row[columnIndices.points_redeemed]).trim();
        }
        
        transactionData.push(newRow);
      }
    }
    
    console.log(`Transaction data prepared, ${transactionData.length} rows (including header)`);
    
    // Create worksheet and add to workbook
    const transactionWS = XLSX.utils.aoa_to_sheet(transactionData);
    XLSX.utils.book_append_sheet(transactionWB, transactionWS, "Transactions");
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/:/g, '-').slice(0, -5);
    const transactionFileName = `transaction_${timestamp}.xlsx`;
    
    // Convert to blob
    const transactionBlob = await workbook_to_blob(transactionWB);
    
    // Determine if the file has contact data (check mobile column)
    const hasContactData = transactionData.some((row, index) => 
      index > 0 && row[0] !== undefined && row[0] !== null && row[0] !== ""
    );
    
    console.log("Has contact data:", hasContactData);
    
    // Store processing information in Supabase
    try {
      const { error } = await supabase.from('processed_files').insert({
        file_name: transactionFileName,
        original_file_name: file.name,
        column_mapping: columnMapping,
      });
      
      if (error) {
        console.error("Error saving to Supabase:", error);
        // Continue processing even if Supabase storage fails
      }
    } catch (dbError) {
      console.error("Exception during Supabase operation:", dbError);
      // Continue processing even if Supabase operation fails
    }
    
    return {
      transactionData: transactionBlob,
      transactionFileName,
      rawData,
      hasContactData
    };
  } catch (error) {
    console.error("Error in processFile:", error);
    throw error;
  }
};

export const generateContactsFile = async (rawData: any[][], mapping: ContactsColumnMapping): Promise<{ data: Blob; fileName: string }> => {
  try {
    console.log("Generating contacts file with mapping:", mapping);

    const contactsWB = XLSX.utils.book_new();
    const contactsHeaders = ["name", "mobile", "email", "birthday", "points"];
    const contactsData: any[][] = [contactsHeaders];

    // Convert column letters to indices
    const columnIndex = {
      name: mapping.name ? columnLabelToIndex(mapping.name) : -1,
      mobile: mapping.mobile ? columnLabelToIndex(mapping.mobile) : -1,
      email: mapping.email ? columnLabelToIndex(mapping.email) : -1,
      birthday: mapping.birthday ? columnLabelToIndex(mapping.birthday) : -1,
      points: mapping.points ? columnLabelToIndex(mapping.points) : -1,
    };

    console.log("Contacts column indices:", columnIndex);

    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i];
      const newRow = ["", "", "", "", ""];

      // Name
      if (columnIndex.name >= 0 && row[columnIndex.name] !== undefined) {
        newRow[0] = String(row[columnIndex.name]).trim();
      }

      // Mobile
      if (columnIndex.mobile >= 0 && row[columnIndex.mobile] !== undefined) {
        newRow[1] = String(row[columnIndex.mobile]).trim();
      }

      // Email
      if (columnIndex.email >= 0 && row[columnIndex.email] !== undefined) {
        newRow[2] = String(row[columnIndex.email]).trim();
      }

      // Birthday
      if (columnIndex.birthday >= 0 && row[columnIndex.birthday] !== undefined) {
        newRow[3] = String(row[columnIndex.birthday]).trim();
      }

      // Points
      if (columnIndex.points >= 0 && row[columnIndex.points] !== undefined) {
        newRow[4] = String(row[columnIndex.points]).trim();
      }

      contactsData.push(newRow);
    }

    console.log(`Contacts data prepared, ${contactsData.length} rows (including header)`);

    const contactsWS = XLSX.utils.aoa_to_sheet(contactsData);
    XLSX.utils.book_append_sheet(contactsWB, contactsWS, "Contacts");

    const timestamp = new Date().toISOString().replace(/:/g, '-').slice(0, -5);
    const contactsFileName = `contacts_${timestamp}.xlsx`;

    const contactsBlob = await workbook_to_blob(contactsWB);

    return {
      data: contactsBlob,
      fileName: contactsFileName
    };
  } catch (error) {
    console.error("Error in generateContactsFile:", error);
    throw error;
  }
};

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
