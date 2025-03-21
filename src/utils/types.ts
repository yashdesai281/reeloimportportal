
/**
 * Type definitions for file processing functionality
 */

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
  anniversary: string;
  gender: string;
  tags: string;
}

export interface ProcessingStats {
  totalRecords: number;
  validRecords: number;
  rejectedRecords: number;
  duplicateRecords?: number;
}

export interface ProcessFileResult {
  transactionData: Blob;
  transactionFileName: string;
  rawData: any[][];
  hasContactData: boolean;
  stats: ProcessingStats;
}

export interface ContactsFileResult {
  data: Blob;
  fileName: string;
  stats: ProcessingStats;
}
