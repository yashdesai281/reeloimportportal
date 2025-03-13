
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

    const contactsWB = XLSX.utils.book_new();
    const contactsHeaders = ["name", "mobile", "email", "birthday", "points", "anniversary", "gender", "tags"];
    const contactsData: any[][] = [contactsHeaders];

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

    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i];
      const newRow = ["", "", "", "", "", "", "", ""];
      
      let hasValidData = false;

      if (columnIndex.name >= 0 && row[columnIndex.name] !== undefined) {
        newRow[0] = String(row[columnIndex.name]).trim();
        hasValidData = true;
      }

      if (columnIndex.mobile >= 0 && row[columnIndex.mobile] !== undefined) {
        newRow[1] = formatPhoneNumber(String(row[columnIndex.mobile]));
        hasValidData = true;
      }

      if (columnIndex.email >= 0 && row[columnIndex.email] !== undefined) {
        newRow[2] = String(row[columnIndex.email]).trim();
        hasValidData = true;
      }

      if (columnIndex.birthday >= 0 && row[columnIndex.birthday] !== undefined) {
        newRow[3] = String(row[columnIndex.birthday]).trim();
        hasValidData = true;
      }

      if (columnIndex.points >= 0 && row[columnIndex.points] !== undefined) {
        newRow[4] = String(row[columnIndex.points]).trim();
        hasValidData = true;
      }
      
      if (columnIndex.anniversary >= 0 && row[columnIndex.anniversary] !== undefined) {
        newRow[5] = String(row[columnIndex.anniversary]).trim();
        hasValidData = true;
      }
      
      if (columnIndex.gender >= 0 && row[columnIndex.gender] !== undefined) {
        newRow[6] = String(row[columnIndex.gender]).trim();
        hasValidData = true;
      }
      
      if (columnIndex.tags >= 0 && row[columnIndex.tags] !== undefined) {
        newRow[7] = String(row[columnIndex.tags]).trim();
        hasValidData = true;
      }

      // Only add row if it has at least some valid data
      if (hasValidData) {
        contactsData.push(newRow);
      }
    }

    console.log(`Contacts data prepared, ${contactsData.length} rows (including header)`);

    const contactsWS = XLSX.utils.aoa_to_sheet(contactsData);
    XLSX.utils.book_append_sheet(contactsWB, contactsWS, "Contacts");

    const timestamp = new Date().toISOString().replace(/:/g, '-').slice(0, -5);
    const contactsFileName = `contacts_${timestamp}.xlsx`;

    const contactsBlob = await workbookToBlob(contactsWB);

    return {
      data: contactsBlob,
      fileName: contactsFileName
    };
  } catch (error) {
    console.error("Error in generateContactsFile:", error);
    throw error;
  }
};
