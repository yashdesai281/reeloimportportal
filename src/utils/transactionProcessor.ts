
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';
import { ProcessFileResult, ColumnMapping } from './types';
import { columnLabelToIndex } from './columnUtils';
import { workbookToBlob } from './excelUtils';
import { formatPhoneNumber } from './excelUtils';

/**
 * Process a transaction file with the given column mapping
 */
export const processFile = async (file: File, columnMapping: ColumnMapping): Promise<ProcessFileResult> => {
  try {
    console.log("Processing file:", file.name);
    console.log("With column mapping:", columnMapping);
    
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer);
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    const rawData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
    console.log(`Raw data loaded, ${rawData.length} rows found`);
    
    if (rawData.length <= 1) {
      throw new Error("File contains no data rows");
    }
    
    const transactionWB = XLSX.utils.book_new();
    
    const transactionHeaders = ["mobile", "txn_type", "bill_number", "bill_amount", "order_time", "points_earned", "points_redeemed"];
    
    const transactionData: any[][] = [transactionHeaders];
    
    const columnIndices = {
      mobile: columnMapping.mobile ? columnLabelToIndex(columnMapping.mobile) : -1,
      bill_number: columnMapping.bill_number ? columnLabelToIndex(columnMapping.bill_number) : -1,
      bill_amount: columnMapping.bill_amount ? columnLabelToIndex(columnMapping.bill_amount) : -1,
      order_time: columnMapping.order_time ? columnLabelToIndex(columnMapping.order_time) : -1,
      points_earned: columnMapping.points_earned ? columnLabelToIndex(columnMapping.points_earned) : -1,
      points_redeemed: columnMapping.points_redeemed ? columnLabelToIndex(columnMapping.points_redeemed) : -1,
    };
    
    console.log("Mapped column indices:", columnIndices);
    
    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i];
      const newRow = ["", "", "", "", "", "", ""];
      
      const hasData = row.some((cell: any) => cell !== undefined && cell !== null && cell !== "");
      
      if (hasData) {
        if (columnIndices.mobile >= 0 && row[columnIndices.mobile] !== undefined) {
          // Format phone number to remove prefixes like +91 or 91
          newRow[0] = formatPhoneNumber(String(row[columnIndices.mobile]));
        }
        
        newRow[1] = "purchase";
        
        if (columnIndices.bill_number >= 0 && row[columnIndices.bill_number] !== undefined) {
          newRow[2] = String(row[columnIndices.bill_number]).trim();
        }
        
        if (columnIndices.bill_amount >= 0 && row[columnIndices.bill_amount] !== undefined) {
          newRow[3] = String(row[columnIndices.bill_amount]).trim();
        }
        
        if (columnIndices.order_time >= 0 && row[columnIndices.order_time] !== undefined) {
          newRow[4] = String(row[columnIndices.order_time]).trim();
        }
        
        if (columnIndices.points_earned >= 0 && row[columnIndices.points_earned] !== undefined) {
          newRow[5] = String(row[columnIndices.points_earned]).trim();
        }
        
        if (columnIndices.points_redeemed >= 0 && row[columnIndices.points_redeemed] !== undefined) {
          newRow[6] = String(row[columnIndices.points_redeemed]).trim();
        }
        
        transactionData.push(newRow);
      }
    }
    
    console.log(`Transaction data prepared, ${transactionData.length} rows (including header)`);
    
    const transactionWS = XLSX.utils.aoa_to_sheet(transactionData);
    XLSX.utils.book_append_sheet(transactionWB, transactionWS, "Transactions");
    
    const timestamp = new Date().toISOString().replace(/:/g, '-').slice(0, -5);
    const transactionFileName = `transaction_${timestamp}.xlsx`;
    
    const transactionBlob = await workbookToBlob(transactionWB);
    
    const hasContactData = transactionData.some((row, index) => 
      index > 0 && row[0] !== undefined && row[0] !== null && row[0] !== ""
    );
    
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
