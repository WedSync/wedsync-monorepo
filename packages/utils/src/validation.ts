import type { Email, PhoneNumber } from '@wedsync/types';

export const isValidEmail = (email: string): email is Email => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhoneNumber = (phone: string): phone is PhoneNumber => {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

export const isValidURL = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const isValidPostalCode = (postalCode: string, country: string = 'US'): boolean => {
  const patterns: Record<string, RegExp> = {
    US: /^\d{5}(-\d{4})?$/,
    CA: /^[A-Za-z]\d[A-Za-z] \d[A-Za-z]\d$/,
    UK: /^[A-Za-z]{1,2}\d[A-Za-z\d]? \d[A-Za-z]{2}$/,
    AU: /^\d{4}$/,
  };
  
  const pattern = patterns[country.toUpperCase()];
  return pattern ? pattern.test(postalCode) : true; // Allow unknown countries
};

export const sanitizeHTML = (html: string): string => {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/javascript:/gi, '');
};

export const validateRequired = (value: any): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

export const validateMinLength = (value: string, minLength: number): boolean => {
  return value.length >= minLength;
};

export const validateMaxLength = (value: string, maxLength: number): boolean => {
  return value.length <= maxLength;
};

export const validatePattern = (value: string, pattern: string): boolean => {
  const regex = new RegExp(pattern);
  return regex.test(value);
};

export const validateFileType = (filename: string, allowedTypes: string[]): boolean => {
  const extension = filename.split('.').pop()?.toLowerCase();
  return extension ? allowedTypes.includes(extension) : false;
};

export const validateFileSize = (fileSize: number, maxSize: number): boolean => {
  return fileSize <= maxSize;
};

// Wedding-specific validation functions
export const validateWeddingDate = (date: Date): { isValid: boolean; message?: string } => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (date < today) {
    return { isValid: false, message: 'Wedding date cannot be in the past' };
  }
  
  // Check if date is too far in the future (5 years)
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 5);
  
  if (date > maxDate) {
    return { isValid: false, message: 'Wedding date cannot be more than 5 years in the future' };
  }
  
  return { isValid: true };
};

export const validateGuestCount = (count: number): { isValid: boolean; message?: string } => {
  if (count < 1) {
    return { isValid: false, message: 'Guest count must be at least 1' };
  }
  
  if (count > 10000) {
    return { isValid: false, message: 'Guest count cannot exceed 10,000' };
  }
  
  return { isValid: true };
};

export const validateBudget = (budget: number): { isValid: boolean; message?: string } => {
  if (budget < 0) {
    return { isValid: false, message: 'Budget cannot be negative' };
  }
  
  if (budget > 10000000) {
    return { isValid: false, message: 'Budget cannot exceed $10,000,000' };
  }
  
  return { isValid: true };
};

export const validateVenueName = (name: string): { isValid: boolean; message?: string } => {
  if (!name.trim()) {
    return { isValid: false, message: 'Venue name is required' };
  }
  
  if (name.length < 2) {
    return { isValid: false, message: 'Venue name must be at least 2 characters' };
  }
  
  if (name.length > 100) {
    return { isValid: false, message: 'Venue name cannot exceed 100 characters' };
  }
  
  return { isValid: true };
};

export const validateTimelineEvent = (event: {
  title: string;
  startTime: Date;
  endTime?: Date;
  location?: string;
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!event.title.trim()) {
    errors.push('Event title is required');
  } else if (event.title.length > 200) {
    errors.push('Event title cannot exceed 200 characters');
  }
  
  if (event.endTime && event.endTime <= event.startTime) {
    errors.push('End time must be after start time');
  }
  
  if (event.location && event.location.length > 500) {
    errors.push('Location cannot exceed 500 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateSupplierBusinessName = (name: string): { isValid: boolean; message?: string } => {
  if (!name.trim()) {
    return { isValid: false, message: 'Business name is required' };
  }
  
  if (name.length < 2) {
    return { isValid: false, message: 'Business name must be at least 2 characters' };
  }
  
  if (name.length > 100) {
    return { isValid: false, message: 'Business name cannot exceed 100 characters' };
  }
  
  // Check for valid business name characters
  const validPattern = /^[a-zA-Z0-9\s\-'&.,!()]+$/;
  if (!validPattern.test(name)) {
    return { isValid: false, message: 'Business name contains invalid characters' };
  }
  
  return { isValid: true };
};

export const validateFormField = (field: {
  label: string;
  type: string;
  required?: boolean;
  options?: string[];
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!field.label.trim()) {
    errors.push('Field label is required');
  } else if (field.label.length > 100) {
    errors.push('Field label cannot exceed 100 characters');
  }
  
  const validTypes = ['text', 'textarea', 'select', 'radio', 'checkbox', 'email', 'phone', 'date', 'number'];
  if (!validTypes.includes(field.type)) {
    errors.push('Invalid field type');
  }
  
  if ((field.type === 'select' || field.type === 'radio') && (!field.options || field.options.length === 0)) {
    errors.push('Options are required for select and radio fields');
  }
  
  if (field.options) {
    field.options.forEach((option, index) => {
      if (!option.trim()) {
        errors.push(`Option ${index + 1} cannot be empty`);
      } else if (option.length > 200) {
        errors.push(`Option ${index + 1} cannot exceed 200 characters`);
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateGuestData = (guest: {
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!guest.firstName.trim()) {
    errors.push('First name is required');
  } else if (guest.firstName.length > 50) {
    errors.push('First name cannot exceed 50 characters');
  }
  
  if (!guest.lastName.trim()) {
    errors.push('Last name is required');
  } else if (guest.lastName.length > 50) {
    errors.push('Last name cannot exceed 50 characters');
  }
  
  if (guest.email && !isValidEmail(guest.email)) {
    errors.push('Invalid email format');
  }
  
  if (guest.phoneNumber && !isValidPhoneNumber(guest.phoneNumber)) {
    errors.push('Invalid phone number format');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (password.length > 128) {
    errors.push('Password cannot exceed 128 characters');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateAddress = (address: {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!address.street.trim()) {
    errors.push('Street address is required');
  } else if (address.street.length > 200) {
    errors.push('Street address cannot exceed 200 characters');
  }
  
  if (!address.city.trim()) {
    errors.push('City is required');
  } else if (address.city.length > 100) {
    errors.push('City cannot exceed 100 characters');
  }
  
  if (!address.state.trim()) {
    errors.push('State/Province is required');
  } else if (address.state.length > 100) {
    errors.push('State/Province cannot exceed 100 characters');
  }
  
  if (!address.postalCode.trim()) {
    errors.push('Postal code is required');
  } else if (!isValidPostalCode(address.postalCode, address.country)) {
    errors.push('Invalid postal code format for the selected country');
  }
  
  if (!address.country.trim()) {
    errors.push('Country is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};