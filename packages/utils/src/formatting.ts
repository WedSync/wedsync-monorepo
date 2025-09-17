import type { DietaryType, SupplierSpecialization } from '@wedsync/types';

export const formatName = (firstName: string, lastName: string): string => {
  return `${firstName.trim()} ${lastName.trim()}`.trim();
};

export const formatInitials = (firstName: string, lastName: string): string => {
  const first = firstName.trim().charAt(0).toUpperCase();
  const last = lastName.trim().charAt(0).toUpperCase();
  return `${first}${last}`;
};

export const formatPhoneNumber = (phone: string, format: 'US' | 'international' = 'US'): string => {
  const digits = phone.replace(/\D/g, '');
  
  if (format === 'US' && digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  
  if (format === 'US' && digits.length === 11 && digits.startsWith('1')) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  
  if (format === 'international') {
    return `+${digits}`;
  }
  
  return phone;
};

export const formatCurrency = (
  amount: number, 
  currency: string = 'USD', 
  locale: string = 'en-US'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
};

export const formatDate = (
  date: Date, 
  format: 'short' | 'medium' | 'long' | 'full' = 'medium',
  locale: string = 'en-US'
): string => {
  const options: Intl.DateTimeFormatOptions = {
    short: { month: 'short', day: 'numeric', year: 'numeric' },
    medium: { month: 'long', day: 'numeric', year: 'numeric' },
    long: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' },
    full: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZoneName: 'short' },
  }[format];
  
  return new Intl.DateTimeFormat(locale, options).format(date);
};

export const formatTime = (
  date: Date, 
  format: '12h' | '24h' = '12h',
  locale: string = 'en-US'
): string => {
  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: format === '12h',
  };
  
  return new Intl.DateTimeFormat(locale, options).format(date);
};

export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${(value * 100).toFixed(decimals)}%`;
};

export const formatFileSize = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

export const formatAddress = (address: {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}): string => {
  const parts = [
    address.street,
    address.city,
    address.state && address.postalCode ? `${address.state} ${address.postalCode}` : address.state || address.postalCode,
    address.country,
  ].filter(Boolean);
  
  return parts.join(', ');
};

export const formatDietaryRequirements = (requirements: DietaryType[]): string => {
  const labels: Record<DietaryType, string> = {
    vegetarian: 'Vegetarian',
    vegan: 'Vegan',
    gluten_free: 'Gluten-Free',
    dairy_free: 'Dairy-Free',
    nut_allergy: 'Nut Allergy',
    shellfish_allergy: 'Shellfish Allergy',
    kosher: 'Kosher',
    halal: 'Halal',
    keto: 'Keto',
    other: 'Other',
  };
  
  return requirements.map(req => labels[req]).join(', ');
};

export const formatSupplierSpecialization = (specialization: SupplierSpecialization): string => {
  const labels: Record<SupplierSpecialization, string> = {
    photographer: 'Photographer',
    videographer: 'Videographer',
    caterer: 'Caterer',
    florist: 'Florist',
    venue: 'Venue',
    dj: 'DJ',
    band: 'Band',
    planner: 'Wedding Planner',
    decorator: 'Decorator',
    transportation: 'Transportation',
    other: 'Other',
  };
  
  return labels[specialization];
};

export const truncateText = (text: string, maxLength: number, suffix: string = '...'): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - suffix.length) + suffix;
};

export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};