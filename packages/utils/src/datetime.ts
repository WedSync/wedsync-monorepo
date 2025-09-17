export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const addHours = (date: Date, hours: number): Date => {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
};

export const addMinutes = (date: Date, minutes: number): Date => {
  const result = new Date(date);
  result.setMinutes(result.getMinutes() + minutes);
  return result;
};

export const startOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

export const endOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};

export const startOfWeek = (date: Date, startDay: number = 0): Date => {
  const result = new Date(date);
  const day = result.getDay();
  const diff = day - startDay;
  result.setDate(result.getDate() - diff);
  return startOfDay(result);
};

export const endOfWeek = (date: Date, startDay: number = 0): Date => {
  const result = startOfWeek(date, startDay);
  result.setDate(result.getDate() + 6);
  return endOfDay(result);
};

export const startOfMonth = (date: Date): Date => {
  const result = new Date(date);
  result.setDate(1);
  return startOfDay(result);
};

export const endOfMonth = (date: Date): Date => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + 1, 0);
  return endOfDay(result);
};

export const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

export const isBefore = (date1: Date, date2: Date): boolean => {
  return date1.getTime() < date2.getTime();
};

export const isAfter = (date1: Date, date2: Date): boolean => {
  return date1.getTime() > date2.getTime();
};

export const isBetween = (date: Date, start: Date, end: Date): boolean => {
  return isAfter(date, start) && isBefore(date, end);
};

export const getDaysDifference = (date1: Date, date2: Date): number => {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getHoursDifference = (date1: Date, date2: Date): number => {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60));
};

export const getMinutesDifference = (date1: Date, date2: Date): number => {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60));
};

export const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
};

export const isBusinessDay = (date: Date): boolean => {
  return !isWeekend(date);
};

export const getNextBusinessDay = (date: Date): Date => {
  let result = addDays(date, 1);
  while (isWeekend(result)) {
    result = addDays(result, 1);
  }
  return result;
};

export const getPreviousBusinessDay = (date: Date): Date => {
  let result = addDays(date, -1);
  while (isWeekend(result)) {
    result = addDays(result, -1);
  }
  return result;
};

export const parseTimeString = (timeString: string): { hours: number; minutes: number } => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return { hours, minutes };
};

export const createTimeString = (hours: number, minutes: number): string => {
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

export const isTimeInRange = (
  time: string,
  startTime: string,
  endTime: string
): boolean => {
  const current = parseTimeString(time);
  const start = parseTimeString(startTime);
  const end = parseTimeString(endTime);
  
  const currentMinutes = current.hours * 60 + current.minutes;
  const startMinutes = start.hours * 60 + start.minutes;
  const endMinutes = end.hours * 60 + end.minutes;
  
  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  } else {
    // Handles overnight ranges (e.g., 23:00 to 02:00)
    return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
  }
};

export const getTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

export const convertToTimezone = (date: Date, timezone: string): Date => {
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  const targetTime = new Date(utc + (getTimezoneOffset(timezone) * 60000));
  return targetTime;
};

export const getTimezoneOffset = (timezone: string): number => {
  const now = new Date();
  const utc = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 
                       now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
  const target = new Date(utc.toLocaleString('en-US', { timeZone: timezone }));
  return (utc.getTime() - target.getTime()) / 60000;
};