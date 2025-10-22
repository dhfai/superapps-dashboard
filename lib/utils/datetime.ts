/**
 * Date and Time Utilities
 * Handles timezone-aware date/time operations based on user's local timezone
 */

/**
 * Get current date and time in user's local timezone
 * @returns ISO string in user's local timezone
 */
export function getCurrentLocalDateTime(): string {
  const now = new Date();

  // Get timezone offset in minutes and convert to milliseconds
  const timezoneOffset = now.getTimezoneOffset() * 60000;

  // Adjust for timezone
  const localTime = new Date(now.getTime() - timezoneOffset);

  // Return as ISO string (will be in format: 2025-10-23T08:46:00.000Z)
  return localTime.toISOString().slice(0, -1);
}

/**
 * Get current date in user's local timezone (YYYY-MM-DD format)
 * @returns Date string in YYYY-MM-DD format
 */
export function getCurrentLocalDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Get current time in user's local timezone (HH:MM format)
 * @returns Time string in HH:MM format
 */
export function getCurrentLocalTime(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');

  return `${hours}:${minutes}`;
}

/**
 * Get current time in user's local timezone (HH:MM:SS format)
 * @returns Time string in HH:MM:SS format
 */
export function getCurrentLocalTimeWithSeconds(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Format date for datetime-local input (YYYY-MM-DDTHH:MM)
 * @param date Optional date to format, defaults to now
 * @returns Formatted string for datetime-local input
 */
export function formatForDateTimeLocalInput(date?: Date): string {
  // Return empty string for SSR to avoid hydration mismatch
  if (typeof window === 'undefined' && !date) return '';

  const d = date || new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Convert datetime-local input value to ISO string for backend
 * @param datetimeLocalValue Value from datetime-local input
 * @returns ISO string for backend
 */
export function convertDateTimeLocalToISO(datetimeLocalValue: string): string {
  if (!datetimeLocalValue) {
    // Return empty string for SSR, will be set on client
    if (typeof window === 'undefined') return '';
    return new Date().toISOString();
  }

  // datetime-local gives us: "2025-10-23T08:46"
  // We need to convert to ISO: "2025-10-23T08:46:00Z"
  const date = new Date(datetimeLocalValue);
  return date.toISOString();
}

/**
 * Convert ISO string from backend to datetime-local input format
 * @param isoString ISO string from backend
 * @returns Formatted string for datetime-local input
 */
export function convertISOToDateTimeLocal(isoString: string): string {
  if (!isoString) return formatForDateTimeLocalInput();

  const date = new Date(isoString);
  return formatForDateTimeLocalInput(date);
}

/**
 * Get user's timezone name
 * @returns Timezone string (e.g., "Asia/Jakarta", "America/New_York")
 */
export function getUserTimezone(): string {
  // Check if running in browser environment
  if (typeof window === 'undefined') {
    return 'UTC'; // Default for SSR
  }

  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (e) {
    return 'UTC'; // Fallback if timezone detection fails
  }
}

/**
 * Get user's timezone offset in hours
 * @returns Offset in hours (e.g., +7, -5)
 */
export function getUserTimezoneOffset(): number {
  if (typeof window === 'undefined') {
    return 0; // Default for SSR
  }

  const offset = new Date().getTimezoneOffset();
  return -offset / 60; // Negative because getTimezoneOffset returns opposite sign
}

/**
 * Get timezone abbreviation (WIB, WITA, WIT, etc.)
 * @returns Timezone abbreviation
 */
export function getTimezoneAbbreviation(): string {
  if (typeof window === 'undefined') {
    return 'UTC';
  }

  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const offset = getUserTimezoneOffset();

    // Indonesia timezone abbreviations
    if (timezone.includes('Jakarta') || offset === 7) return 'WIB';
    if (timezone.includes('Makassar') || offset === 8) return 'WITA';
    if (timezone.includes('Jayapura') || offset === 9) return 'WIT';

    // Other common timezones
    if (timezone.includes('Singapore')) return 'SGT';
    if (timezone.includes('Tokyo')) return 'JST';
    if (timezone.includes('London')) return 'GMT';
    if (timezone.includes('New_York')) return 'EST';

    // Default: show offset
    const sign = offset >= 0 ? '+' : '';
    return `GMT${sign}${offset}`;
  } catch (e) {
    return 'UTC';
  }
}

/**
 * Format time for display in 24-hour format with timezone
 * @param date Date to format
 * @param showTimezone Optional, show timezone abbreviation
 * @returns Formatted time string (e.g., "05:30 WIT")
 */
export function formatTimeForDisplay(date: Date | string, showTimezone: boolean = false): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const timeStr = `${hours}:${minutes}`;

  if (showTimezone) {
    return `${timeStr} ${getTimezoneAbbreviation()}`;
  }

  return timeStr;
}

/**
 * Format date for display in user's locale
 * @param date Date to format
 * @param options Optional Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export function formatDateForDisplay(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...options,
  };

  return d.toLocaleDateString('id-ID', defaultOptions);
}

/**
 * Check if a date is today
 * @param date Date to check
 * @returns True if date is today
 */
export function isToday(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();

  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

/**
 * Get relative time string (e.g., "2 hours ago", "just now")
 * @param date Date to compare
 * @returns Relative time string
 */
export function getRelativeTimeString(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;

  return formatDateForDisplay(d);
}
