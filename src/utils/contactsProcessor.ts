
import * as XLSX from 'xlsx';
import { ContactsColumnMapping, ContactsFileResult } from './types';
import { columnLabelToIndex } from './columnUtils';
import { workbookToBlob, formatPhoneNumber } from './excelUtils';

/**
 * Generate a contacts file from raw data using the specified column mapping
 */
export const generateContactsFile = async (rawData: any[][], mapping: ContactsColumnMapping): Promise<ContactsFileResult> => {
  try {
    console.log("Generating contacts file with mapping:", mapping);

    // Create a new workbook
    const contactsWB = XLSX.utils.book_new();
    const contactsHeaders = ["name", "mobile", "email", "birthday", "points", "anniversary", "gender", "tags"];
    const contactsData: any[][] = [contactsHeaders];

    // Convert column labels to indices
    const columnIndex = {
      name: mapping.name ? columnLabelToIndex(mapping.name) : -1,
      mobile: mapping.mobile ? columnLabelToIndex(mapping.mobile) : -1,
      email: mapping.email ? columnLabelToIndex(mapping.email) : -1,
      birthday: mapping.birthday ? columnLabelToIndex(mapping.birthday) : -1,
      points: mapping.points ? columnLabelToIndex(mapping.points) : -1,
      anniversary: mapping.anniversary ? columnLabelToIndex(mapping.anniversary) : -1,
      gender: mapping.gender ? columnLabelToIndex(mapping.gender) : -1,
      tags: mapping.tags ? columnLabelToIndex(mapping.tags) : -1
    };

    console.log("Contacts column indices:", columnIndex);

    // Skip the header row and process each data row
    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row || !Array.isArray(row)) {
        console.warn(`Skipping invalid row at index ${i}`);
        continue;
      }

      const newRow = ["", "", "", "", "", "", "", ""];
      let hasValidData = false;

      // Process name
      if (columnIndex.name >= 0 && row[columnIndex.name] !== undefined) {
        newRow[0] = String(row[columnIndex.name] || "").trim();
        hasValidData = hasValidData || !!newRow[0];
      }

      // Process mobile (required)
      if (columnIndex.mobile >= 0 && row[columnIndex.mobile] !== undefined) {
        const mobileValue = formatPhoneNumber(String(row[columnIndex.mobile] || ""));
        newRow[1] = mobileValue;
        // Only consider the row valid if it has a non-empty mobile number
        hasValidData = hasValidData || !!mobileValue;
      }

      // Process email
      if (columnIndex.email >= 0 && row[columnIndex.email] !== undefined) {
        newRow[2] = String(row[columnIndex.email] || "").trim();
        hasValidData = hasValidData || !!newRow[2];
      }

      // Process birthday
      if (columnIndex.birthday >= 0 && row[columnIndex.birthday] !== undefined) {
        newRow[3] = String(row[columnIndex.birthday] || "").trim();
        hasValidData = hasValidData || !!newRow[3];
      }

      // Process points
      if (columnIndex.points >= 0 && row[columnIndex.points] !== undefined) {
        newRow[4] = String(row[columnIndex.points] || "").trim();
        hasValidData = hasValidData || !!newRow[4];
      }
      
      // Process anniversary
      if (columnIndex.anniversary >= 0 && row[columnIndex.anniversary] !== undefined) {
        newRow[5] = String(row[columnIndex.anniversary] || "").trim();
        hasValidData = hasValidData || !!newRow[5];
      }
      
      // Process gender
      if (columnIndex.gender >= 0 && row[columnIndex.gender] !== undefined) {
        newRow[6] = String(row[columnIndex.gender] || "").trim();
        hasValidData = hasValidData || !!newRow[6];
      }
      
      // Process tags
      if (columnIndex.tags >= 0 && row[columnIndex.tags] !== undefined) {
        newRow[7] = String(row[columnIndex.tags] || "").trim();
        hasValidData = hasValidData || !!newRow[7];
      }

      // Only add row if it has at least some valid data
      if (hasValidData) {
        contactsData.push(newRow);
      }
    }

    console.log(`Contacts data prepared, ${contactsData.length} rows (including header)`);

    // Create a worksheet from the data
    const contactsWS = XLSX.utils.aoa_to_sheet(contactsData);
    
    // Apply some formatting to make the headers stand out
    const headerStyle = { font: { bold: true }, fill: { fgColor: { rgb: "EFEFEF" } } };
    for (let i = 0; i < contactsHeaders.length; i++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: i });
      contactsWS[cellRef].s = headerStyle;
    }
    
    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(contactsWB, contactsWS, "Contacts");

    // Generate a filename with timestamp
    const timestamp = new Date().toISOString().replace(/:/g, '-').slice(0, -5);
    const contactsFileName = `contacts_${timestamp}.xlsx`;

    // Convert the workbook to a Blob for download
    const contactsBlob = await workbookToBlob(contactsWB);

    return {
      data: contactsBlob,
      fileName: contactsFileName
    };
  } catch (error) {
    console.error("Error in generateContactsFile:", error);
    throw new Error(`Failed to generate contacts file: ${error instanceof Error ? error.message : String(error)}`);
  }
};
