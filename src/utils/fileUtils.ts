
/**
 * Utility functions for file handling
 */

// Convert a File to ArrayBuffer
export const fileToArrayBuffer = (file: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to ArrayBuffer'));
      }
    };
    reader.onerror = () => {
      reject(reader.error || new Error('Unknown error reading file'));
    };
    reader.readAsArrayBuffer(file);
  });
};

// Generate a timestamp string for filenames
export const generateTimestamp = (): string => {
  return new Date().toISOString().replace(/:/g, '-').slice(0, -5);
};

// Check if a file is an Excel file based on extension
export const isExcelFile = (file: File): boolean => {
  const extension = file.name.split('.').pop()?.toLowerCase();
  return extension === 'xlsx' || extension === 'xls' || extension === 'csv';
};

// Get a human-readable file size
export const getReadableFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
