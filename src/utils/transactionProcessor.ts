
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';
import { ProcessFileResult, ColumnMapping } from './types';
import { columnLabelToIndex } from './columnUtils';
import { workbookToBlob, formatPhoneNumber } from './excelUtils';

/**
 * Process a transaction file with the given column mapping
 */
export const processFile = async (file: File, columnMapping: ColumnMapping): Promise<ProcessFileResult> => {
  try {
    console.log("Processing file:", file.name);
    console.log("With column mapping:", columnMapping);
    
    // Read the uploaded file
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer);
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Convert to array of arrays
    const rawData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
    console.log(`Raw data loaded, ${rawData.length} rows found`);
    
    if (rawData.length <= 1) {
      throw new Error("File contains no data rows");
    }
    
    // Create a new workbook for the processed transactions
    const transactionWB = XLSX.utils.book_new();
    
    // Define headers for the output file
    const transactionHeaders = ["mobile", "txn_type", "bill_number", "bill_amount", "order_time", "points_earned", "points_redeemed"];
    
    // Initialize with headers
    const transactionData: any[][] = [transactionHeaders];
    
    // Convert column labels to indices
    const columnIndices = {
      mobile: columnMapping.mobile ? columnLabelToIndex(columnMapping.mobile) : -1,
      bill_number: columnMapping.bill_number ? columnLabelToIndex(columnMapping.bill_number) : -1,
      bill_amount: columnMapping.bill_amount ? columnLabelToIndex(columnMapping.bill_amount) : -1,
      order_time: columnMapping.order_time ? columnLabelToIndex(columnMapping.order_time) : -1,
      points_earned: columnMapping.points_earned ? columnLabelToIndex(columnMapping.points_earned) : -1,
      points_redeemed: columnMapping.points_redeemed ? columnLabelToIndex(columnMapping.points_redeemed) : -1,
    };
    
    console.log("Mapped column indices:", columnIndices);
    
    // Skip the header row and process each data row
    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i];
      
      // Skip undefined or empty rows
      if (!row || !Array.isArray(row)) {
        console.warn(`Skipping invalid row at index ${i}`);
        continue;
      }

      const newRow = ["", "purchase", "", "", "", "", ""];
      
      // Check if row has any data
      const hasData = row.some((cell: any) => cell !== undefined && cell !== null && cell !== "");
      
      if (hasData) {
        // Process mobile number (required)
        if (columnIndices.mobile >= 0 && row[columnIndices.mobile] !== undefined) {
          // Format phone number to remove prefixes like +91 or 91
          newRow[0] = formatPhoneNumber(String(row[columnIndices.mobile] || ""));
          
          // Log the original and formatted mobile numbers to help debug
          console.log(`Row ${i} - Original mobile: ${row[columnIndices.mobile]}, Formatted: ${newRow[0]}`);
        }
        
        // Process bill number
        if (columnIndices.bill_number >= 0 && row[columnIndices.bill_number] !== undefined) {
          newRow[2] = String(row[columnIndices.bill_number] || "").trim();
        }
        
        // Process bill amount
        if (columnIndices.bill_amount >= 0 && row[columnIndices.bill_amount] !== undefined) {
          newRow[3] = String(row[columnIndices.bill_amount] || "").trim();
        }
        
        // Process order time
        if (columnIndices.order_time >= 0 && row[columnIndices.order_time] !== undefined) {
          newRow[4] = String(row[columnIndices.order_time] || "").trim();
        }
        
        // Process points earned
        if (columnIndices.points_earned >= 0 && row[columnIndices.points_earned] !== undefined) {
          newRow[5] = String(row[columnIndices.points_earned] || "").trim();
        }
        
        // Process points redeemed
        if (columnIndices.points_redeemed >= 0 && row[columnIndices.points_redeemed] !== undefined) {
          newRow[6] = String(row[columnIndices.points_redeemed] || "").trim();
        }
        
        // Add row to the output data
        transactionData.push(newRow);
      }
    }
    
    console.log(`Transaction data prepared, ${transactionData.length} rows (including header)`);
    
    // Create a worksheet from the data
    const transactionWS = XLSX.utils.aoa_to_sheet(transactionData);
    
    // Apply some formatting to make the headers stand out
    const headerStyle = { font: { bold: true }, fill: { fgColor: { rgb: "EFEFEF" } } };
    for (let i = 0; i < transactionHeaders.length; i++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: i });
      transactionWS[cellRef].s = headerStyle;
    }
    
    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(transactionWB, transactionWS, "Transactions");
    
    // Generate a filename with timestamp
    const timestamp = new Date().toISOString().replace(/:/g, '-').slice(0, -5);
    const transactionFileName = `transaction_${timestamp}.xlsx`;
    
    // Convert the workbook to a Blob for download
    const transactionBlob = await workbookToBlob(transactionWB);
    
    // Check if we have any mobile numbers for contacts
    const hasContactData = transactionData.some((row, index) => 
      index > 0 && row[0] !== undefined && row[0] !== null && row[0] !== ""
    );
    
    // Save processing record to Supabase
    try {
      const { error } = await supabase.from('processed_files').insert({
        file_name: transactionFileName,
        original_file_name: file.name,
        column_mapping: columnMapping,
      });
      
      if (error) {
        console.error("Error saving to Supabase:", error);
      }
    } catch (dbError) {
      console.error("Exception during Supabase operation:", dbError);
      // Continue processing even if database operation fails
    }
    
    return {
      transactionData: transactionBlob,
      transactionFileName,
      rawData,
      hasContactData
    };
  } catch (error) {
    console.error("Error in processFile:", error);
    throw new Error(`Failed to process transaction file: ${error instanceof Error ? error.message : String(error)}`);
  }
};
