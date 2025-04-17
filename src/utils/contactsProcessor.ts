
import * as XLSX from 'xlsx';
import { ContactsColumnMapping, ContactsFileResult } from './types';
import { columnLabelToIndex } from './columnUtils';
import { 
  workbookToBlob, 
  formatPhoneNumber, 
  validateMobileNumber, 
  cleanNameString,
  applyWorksheetStyling 
} from './excelUtils';
import { parseAndFormatDate } from './dateUtils';

/**
 * Generate a contacts file from raw data using the specified column mapping
 */
export const generateContactsFile = async (rawData: any[][], mapping: ContactsColumnMapping): Promise<ContactsFileResult> => {
  try {
    console.log("Generating contacts file with mapping:", mapping);

    // Create a new workbook
    const contactsWB = XLSX.utils.book_new();
    
    // Ensure the headers are in the correct order as requested
    const contactsHeaders = ["mobile", "name", "email", "birthday", "anniversary", "gender", "points", "tags"];
    const rejectedHeaders = ["mobile", "name", "email", "birthday", "anniversary", "gender", "points", "tags", "rejection_reason"];
    
    const contactsData: any[][] = [contactsHeaders];
    const rejectedData: any[][] = [rejectedHeaders];

    // Convert column labels to indices
    const columnIndex = {
      mobile: mapping.mobile ? columnLabelToIndex(mapping.mobile) : -1,
      name: mapping.name ? columnLabelToIndex(mapping.name) : -1,
      email: mapping.email ? columnLabelToIndex(mapping.email) : -1,
      birthday: mapping.birthday ? columnLabelToIndex(mapping.birthday) : -1,
      anniversary: mapping.anniversary ? columnLabelToIndex(mapping.anniversary) : -1,
      gender: mapping.gender ? columnLabelToIndex(mapping.gender) : -1,
      points: mapping.points ? columnLabelToIndex(mapping.points) : -1,
      tags: mapping.tags ? columnLabelToIndex(mapping.tags) : -1
    };

    console.log("Contacts column indices:", columnIndex);

    // Create a map to track unique mobile numbers to avoid duplicates
    const uniqueMobileNumbers = new Map<string, any[]>();
    
    let validRecords = 0;
    let rejectedRecords = 0;
    let duplicateRecords = 0;

    // Skip the header row and process each data row
    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row || !Array.isArray(row)) {
        console.warn(`Skipping invalid row at index ${i}`);
        continue;
      }

      // Create a new row with the same order as contactsHeaders
      // [mobile, name, email, birthday, anniversary, gender, points, tags]
      const newRow = ["", "", "", "", "", "", "", ""];
      let hasValidData = false;
      let rejectionReason = "";

      // Process mobile (required) - index 0
      if (columnIndex.mobile >= 0 && row[columnIndex.mobile] !== undefined) {
        const mobileValue = formatPhoneNumber(String(row[columnIndex.mobile] || ""));
        newRow[0] = mobileValue;
        
        // Validate the mobile number
        if (!mobileValue) {
          rejectionReason = "Missing mobile number";
        } else if (mobileValue.length < 10) {
          rejectionReason = "Mobile number has fewer than 10 digits";
        } else if (!/^[6-9]/.test(mobileValue)) {
          rejectionReason = "Mobile number starts with digit 5 or lower";
        } else {
          // Only consider the row valid if it has a valid mobile number
          hasValidData = true;
        }
      } else {
        rejectionReason = "Missing mobile number column";
      }

      // Process name - index 1
      if (columnIndex.name >= 0 && row[columnIndex.name] !== undefined) {
        // Clean the name to contain only text and spaces
        newRow[1] = cleanNameString(String(row[columnIndex.name] || ""));
        hasValidData = hasValidData || !!newRow[1];
      }

      // Process email - index 2
      if (columnIndex.email >= 0 && row[columnIndex.email] !== undefined) {
        newRow[2] = String(row[columnIndex.email] || "").trim();
        hasValidData = hasValidData || !!newRow[2];
      }

      // Process birthday - index 3
      if (columnIndex.birthday >= 0 && row[columnIndex.birthday] !== undefined) {
        const rawBirthday = String(row[columnIndex.birthday] || "").trim();
        if (rawBirthday) {
          newRow[3] = parseAndFormatDate(rawBirthday, 'yyyy-MM-dd');
          console.log(`Row ${i}: Original birthday "${rawBirthday}", Formatted: "${newRow[3]}"`);
          hasValidData = hasValidData || !!newRow[3];
        }
      }
      
      // Process anniversary - index 4
      if (columnIndex.anniversary >= 0 && row[columnIndex.anniversary] !== undefined) {
        const rawAnniversary = String(row[columnIndex.anniversary] || "").trim();
        if (rawAnniversary) {
          newRow[4] = parseAndFormatDate(rawAnniversary, 'yyyy-MM-dd');
          console.log(`Row ${i}: Original anniversary "${rawAnniversary}", Formatted: "${newRow[4]}"`);
          hasValidData = hasValidData || !!newRow[4];
        }
      }
      
      // Process gender - index 5
      if (columnIndex.gender >= 0 && row[columnIndex.gender] !== undefined) {
        newRow[5] = String(row[columnIndex.gender] || "").trim();
        hasValidData = hasValidData || !!newRow[5];
      }
      
      // Process points - index 6
      if (columnIndex.points >= 0 && row[columnIndex.points] !== undefined) {
        newRow[6] = String(row[columnIndex.points] || "").trim();
        hasValidData = hasValidData || !!newRow[6];
      }
      
      // Process tags - index 7
      if (columnIndex.tags >= 0 && row[columnIndex.tags] !== undefined) {
        newRow[7] = String(row[columnIndex.tags] || "").trim();
        hasValidData = hasValidData || !!newRow[7];
      }

      // Handle the row based on validation results
      if (rejectionReason) {
        // Add to rejected data with reason
        rejectedData.push([...newRow, rejectionReason]);
        rejectedRecords++;
      } 
      else if (hasValidData && newRow[0]) {
        const mobileNumber = newRow[0];
        
        // Check if this mobile number already exists
        if (!uniqueMobileNumbers.has(mobileNumber)) {
          // If it's a new number, store the row
          uniqueMobileNumbers.set(mobileNumber, newRow);
          validRecords++;
        } else {
          // If duplicate, add to rejected with reason
          rejectedData.push([...newRow, "Duplicate mobile number"]);
          duplicateRecords++;
        }
      }
    }

    // Add all unique rows to the contactsData
    uniqueMobileNumbers.forEach(row => {
      contactsData.push(row);
    });

    console.log(`Contacts data prepared, ${contactsData.length} rows (including header), ${uniqueMobileNumbers.size} unique mobile numbers, ${rejectedData.length - 1} rejected rows`);

    // Create worksheets from the data
    const contactsWS = XLSX.utils.aoa_to_sheet(contactsData);
    const rejectedWS = XLSX.utils.aoa_to_sheet(rejectedData);
    
    // Apply column styling and formatting
    applyWorksheetStyling(contactsWS, contactsHeaders);
    applyWorksheetStyling(rejectedWS, rejectedHeaders);
    
    // Add the worksheets to the workbook
    XLSX.utils.book_append_sheet(contactsWB, contactsWS, "Contacts");
    XLSX.utils.book_append_sheet(contactsWB, rejectedWS, "Rejected");

    // Generate a filename with timestamp
    const timestamp = new Date().toISOString().replace(/:/g, '-').slice(0, -5);
    const contactsFileName = `contacts_${timestamp}.csv`;

    // Convert the workbook to a CSV Blob for download - explicitly specify 'csv'
    const contactsBlob = await workbookToBlob(contactsWB, 'csv');

    return {
      data: contactsBlob,
      fileName: contactsFileName,
      stats: {
        totalRecords: validRecords + rejectedRecords + duplicateRecords,
        validRecords,
        rejectedRecords,
        duplicateRecords
      }
    };
  } catch (error) {
    console.error("Error in generateContactsFile:", error);
    throw new Error(`Failed to generate contacts file: ${error instanceof Error ? error.message : String(error)}`);
  }
};
