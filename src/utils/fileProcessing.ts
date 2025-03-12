
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';

export interface ColumnMapping {
  mobile: number;
  bill_number: number;
  bill_amount: number;
  order_time: number;
}

export async function processFile(file: File, mapping: ColumnMapping): Promise<{ data: Blob; fileName: string }> {
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
          
          // Process based on mapping
          const processedData = processData(jsonData, mapping);
          
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
          const fileName = `processed_${timestamp}.xlsx`;
          
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
          
          resolve({ data: processedBlob, fileName });
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

function processData(data: any[][], mapping: ColumnMapping): any[][] {
  // Create header row for new file
  const header = ['Mobile Number', 'Bill Number', 'Bill Amount', 'Order Time'];
  
  // Process each row according to the mapping
  const processedRows = data.slice(1).map(row => [
    row[mapping.mobile - 1],       // Mobile Number
    row[mapping.bill_number - 1],  // Bill Number
    row[mapping.bill_amount - 1],  // Bill Amount
    row[mapping.order_time - 1],   // Order Time
  ]);
  
  // Return processed data with header
  return [header, ...processedRows];
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
