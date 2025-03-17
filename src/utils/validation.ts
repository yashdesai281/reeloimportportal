
/**
 * Utility functions for data validation
 */

// Function to validate mobile number column - must be 10 digits and start with 6-9
export const validateMobileNumber = (value: string): { isValid: boolean; message?: string } => {
  if (!value) return { isValid: true }; // Allow empty values (validation will happen elsewhere)
  
  // Strip any non-numeric characters for validation
  const numericValue = value.replace(/\D/g, '');
  
  // Handle cases where number might start with 91 (country code)
  let mobileNumber = numericValue;
  if (numericValue.startsWith('91') && numericValue.length > 10) {
    mobileNumber = numericValue.substring(2);
  }
  
  const mobilePattern = /^[6-9]\d{9}$/;
  if (!mobilePattern.test(mobileNumber)) {
    return { 
      isValid: false, 
      message: mobileNumber.length !== 10 
        ? 'Mobile number must be 10 digits' 
        : 'Mobile number must start with 6, 7, 8, or 9'
    };
  }
  
  return { isValid: true };
};

// Function to validate bill number - must be numeric
export const validateBillNumber = (value: string): { isValid: boolean; message?: string } => {
  if (!value) return { isValid: true }; // Allow empty values
  
  if (!/^\d+$/.test(value)) {
    return { isValid: false, message: 'Bill number must be numeric' };
  }
  
  return { isValid: true };
};

// Function to validate bill amount - must be numeric (can have decimal)
export const validateBillAmount = (value: string): { isValid: boolean; message?: string } => {
  if (!value) return { isValid: true }; // Allow empty values
  
  if (!/^\d+(\.\d+)?$/.test(value)) {
    return { isValid: false, message: 'Bill amount must be a number' };
  }
  
  return { isValid: true };
};

// Function to validate order time - must be a valid date
export const validateOrderTime = (value: string): { isValid: boolean; message?: string } => {
  if (!value) return { isValid: true }; // Allow empty values
  
  // Try to parse the date
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return { isValid: false, message: 'Invalid date format' };
  }
  
  return { isValid: true };
};

// Function to validate email format
export const validateEmail = (value: string): { isValid: boolean; message?: string } => {
  if (!value) return { isValid: true }; // Allow empty values
  
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(value)) {
    return { isValid: false, message: 'Invalid email format' };
  }
  
  return { isValid: true };
};

// Function to check if a value is a valid date
export const validateDate = (value: string): { isValid: boolean; message?: string } => {
  if (!value) return { isValid: true }; // Allow empty values
  
  // Try to parse the date
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return { isValid: false, message: 'Invalid date format' };
  }
  
  return { isValid: true };
};

// Function to validate points (must be numeric)
export const validatePoints = (value: string): { isValid: boolean; message?: string } => {
  if (!value) return { isValid: true }; // Allow empty values
  
  if (!/^\d+(\.\d+)?$/.test(value)) {
    return { isValid: false, message: 'Points must be a number' };
  }
  
  return { isValid: true };
};
