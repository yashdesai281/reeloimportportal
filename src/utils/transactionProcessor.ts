
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';
import { ProcessFileResult, ColumnMapping } from './types';
import { columnLabelToIndex } from './columnUtils';
import { 
  workbookToBlob, 
  formatPhoneNumber, 
  validateMobileNumber
} from './excelUtils';
import { parseFlexibleDateTime } from './dateUtils';
import { extractDataFromFile, createExcelWorkbook } from './fileOperations';

/**
 * Process a transaction file with the given column mapping
 */
export const processFile = async (file: File, columnMapping: ColumnMapping): Promise<ProcessFileResult> => {
  try {
    console.log("Processing file:", file.name);
    console.log("With column mapping:", columnMapping);
    
    // Extract data from file
    const { rawData } = await extractDataFromFile(file);
    console.log(`Raw data loaded, ${rawData.length} rows found`);
    
    // Define headers for the output files
    const transactionHeaders = ["mobile", "txn_type", "bill_number", "bill_amount", "order_time", "points_earned", "points_redeemed"];
    const rejectedHeaders = ["mobile", "txn_type", "bill_number", "bill_amount", "order_time", "points_earned", "points_redeemed", "rejection_reason"];
    
    // Initialize with headers
    const transactionData: any[][] = [transactionHeaders];
    const rejectedData: any[][] = [rejectedHeaders];
    
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
    
    let validRecords = 0;
    let rejectedRecords = 0;
    
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
      
      if (!hasData) {
        continue; // Skip completely empty rows
      }
      
      // Process mobile number (required)
      let mobileNumber = "";
      let rejectionReason = "";
      
      if (columnIndices.mobile >= 0 && row[columnIndices.mobile] !== undefined) {
        // Format phone number to remove prefixes like +91 or 91
        mobileNumber = formatPhoneNumber(String(row[columnIndices.mobile] || ""));
        newRow[0] = mobileNumber;
        
        // Validate the mobile number
        if (!mobileNumber) {
          rejectionReason = "Missing mobile number";
        } else if (mobileNumber.length < 10) {
          rejectionReason = "Mobile number has fewer than 10 digits";
        } else if (!/^[6-9]/.test(mobileNumber)) {
          rejectionReason = "Mobile number starts with digit 5 or lower";
        }
      } else {
        rejectionReason = "Missing mobile number column";
      }
      
      // Process bill number
      if (columnIndices.bill_number >= 0 && row[columnIndices.bill_number] !== undefined) {
        newRow[2] = String(row[columnIndices.bill_number] || "").trim();
      }
      
      // Process bill amount
      if (columnIndices.bill_amount >= 0 && row[columnIndices.bill_amount] !== undefined) {
        newRow[3] = String(row[columnIndices.bill_amount] || "").trim();
      }
      
      // Process order time - with enhanced date formatting
      if (columnIndices.order_time >= 0 && row[columnIndices.order_time] !== undefined) {
        const rawDate = String(row[columnIndices.order_time] || "");
        if (rawDate) {
          // Use our improved date formatter
          const formattedDate = parseFlexibleDateTime(rawDate);
          if (formattedDate) {
            console.log(`Row ${i}: Original date "${rawDate}", Formatted: "${formattedDate}"`);
            newRow[4] = formattedDate;
          } else {
            console.warn(`Row ${i}: Could not parse date "${rawDate}"`);
            // If we can't parse the date, use the original
            newRow[4] = rawDate;
          }
        }
      }
      
      // Process points earned
      if (columnIndices.points_earned >= 0 && row[columnIndices.points_earned] !== undefined) {
        newRow[5] = String(row[columnIndices.points_earned] || "").trim();
      }
      
      // Process points redeemed
      if (columnIndices.points_redeemed >= 0 && row[columnIndices.points_redeemed] !== undefined) {
        newRow[6] = String(row[columnIndices.points_redeemed] || "").trim();
      }
      
      // Add row to the appropriate output data array
      if (rejectionReason) {
        // Add row to rejected data with reason
        const rejectedRow = [...newRow, rejectionReason];
        rejectedData.push(rejectedRow);
        rejectedRecords++;
      } else {
        // Add row to valid transaction data
        transactionData.push(newRow);
        validRecords++;
      }
    }
    
    console.log(`Transaction data prepared, ${transactionData.length} valid rows (including header), ${rejectedData.length - 1} rejected rows`);
    
    // Create the Excel workbook for transactions
    const { workbook: transactionWB, fileName: transactionFileName } = await createExcelWorkbook(
      transactionData,
      rejectedData,
      transactionHeaders,
      rejectedHeaders,
      { valid: "Transactions", rejected: "Rejected" }
    );
    
    // Convert the workbook to a CSV Blob for download - explicitly specify 'csv'
    const transactionBlob = await workbookToBlob(transactionWB, 'csv');
    
    // Check if we have any mobile numbers for contacts - this is crucial for contacts prompt
    const hasContactData = transactionData.some((row, index) => 
      index > 0 && row[0] !== undefined && row[0] !== null && row[0] !== ""
    );
    
    console.log(`Has contact data: ${hasContactData}, valid mobile numbers found: ${validRecords}`);
    
    // Save processing record to Supabase with statistics
    try {
      const { error } = await supabase.from('processed_files').insert({
        file_name: transactionFileName,
        original_file_name: file.name,
        column_mapping: columnMapping,
        total_records: validRecords + rejectedRecords,
        valid_records: validRecords,
        rejected_records: rejectedRecords
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
      hasContactData,
      stats: {
        totalRecords: validRecords + rejectedRecords,
        validRecords,
        rejectedRecords
      }
    };
  } catch (error) {
    console.error("Error in processFile:", error);
    throw new Error(`Failed to process transaction file: ${error instanceof Error ? error.message : String(error)}`);
  }
};
