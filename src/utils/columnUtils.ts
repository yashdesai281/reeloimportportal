
/**
 * Utilities for working with Excel column labels
 */

/**
 * Converts a zero-based column index to an Excel-style column label (A, B, C, ..., Z, AA, AB, ...)
 */
export const indexToColumnLabel = (index: number): string => {
  let columnLabel = '';
  let tempIndex = index;

  while (tempIndex >= 0) {
    columnLabel = String.fromCharCode((tempIndex % 26) + 65) + columnLabel;
    tempIndex = Math.floor(tempIndex / 26) - 1;
  }

  return columnLabel;
};

/**
 * Converts an Excel-style column label (A, B, C, ...) to a zero-based column index
 */
export const columnLabelToIndex = (columnLabel: string): number => {
  let index = 0;
  for (let i = 0; i < columnLabel.length; i++) {
    index *= 26;
    index += columnLabel.charCodeAt(i) - 'A'.charCodeAt(0) + 1;
  }
  return index - 1;
};
