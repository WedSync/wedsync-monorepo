// Validation utilities
export * from './validation';

// Formatting utilities
export * from './formatting';

// Date/time utilities
export * from './datetime';

// Array utilities
export * from './array';

// String utilities
export * from './string';

// Object utilities
export * from './object';

// Services
export * from './services/user.service';

// Re-export commonly used functions for convenience
export {
  isValidEmail,
  isValidPhoneNumber,
  formatName,
  formatPhoneNumber,
  formatCurrency,
  formatDate,
  formatTime,
  addDays,
  addHours,
  addMinutes,
  isSameDay,
  chunk,
  unique,
  groupBy,
  capitalize,
  camelCase,
  kebabCase,
  deepClone,
  deepMerge,
  isEmpty,
  get,
  set,
  pick,
  omit
} from './validation';
export {
  formatName,
  formatPhoneNumber,
  formatCurrency,
  formatDate,
  formatTime
} from './formatting';
export {
  addDays,
  addHours,
  addMinutes,
  isSameDay
} from './datetime';
export {
  chunk,
  unique,
  groupBy
} from './array';
export {
  capitalize,
  camelCase,
  kebabCase
} from './string';
export {
  deepClone,
  deepMerge,
  isEmpty,
  get,
  set,
  pick,
  omit
} from './object';