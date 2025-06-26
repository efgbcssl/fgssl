import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format date to relative time (e.g., "2 days ago")
export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
    }
  }

  return 'Just now';
};

// Generate excerpt from content
export const generateExcerpt = (content: string, length: number = 150): string => {
  const plainText = content.replace(/<[^>]*>/g, '');
  return plainText.length > length
    ? `${plainText.substring(0, length)}...`
    : plainText;
};

// Validate slug format
export const isValidSlug = (slug: string): boolean => {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
};

// Get featured image from content
export const extractFeaturedImage = (content: string): string | null => {
  const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
  return imgMatch ? imgMatch[1] : null;
};

/**
 * Format bytes as human-readable text.
 * 
 * @param bytes Number of bytes.
 * @param decimals Number of decimal places to show.
 * @returns Formatted string with appropriate unit (B, KB, MB, GB, TB)
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Format date as human-readable text.
 * 
 * @param dateString ISO date string or Date object
 * @param options Intl.DateTimeFormat options
 * @returns Formatted date string
 */
export function formatDate(
  dateString: string | Date,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }
): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;

  // Check if date is valid
  if (isNaN(date.getTime())) {
    console.warn('Invalid date provided to formatDate:', dateString);
    return 'Invalid date';
  }

  return new Intl.DateTimeFormat('en-US', options).format(date);
}

/**
 * Generate a unique ID
 * 
 * @returns Unique ID string
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Debounce a function to limit how often it's called
 * 
 * @param func Function to debounce
 * @param wait Time to wait in milliseconds
 * @returns Debounced function
 */
export function debounce<F extends (...args: any[]) => any>(
  func: F,
  wait: number
): (...args: Parameters<F>) => void {
  let timeout: NodeJS.Timeout;

  return function executedFunction(...args: Parameters<F>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Truncate text with ellipsis if it exceeds max length
 * 
 * @param text Text to truncate
 * @param maxLength Maximum length before truncation
 * @returns Truncated text
 */
export function truncate(text: string, maxLength: number = 50): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Validate file type against accepted types
 * 
 * @param file File object
 * @param acceptedTypes Array of accepted MIME types
 * @returns Error message if invalid, null if valid
 */
export function validateFileType(
  file: File,
  acceptedTypes: string[]
): string | null {
  if (!acceptedTypes.includes(file.type)) {
    return `File type not allowed. Accepted types: ${acceptedTypes.join(', ')}`;
  }
  return null;
}

/**
 * Validate file size against max size
 * 
 * @param file File object
 * @param maxSize Maximum size in bytes
 * @returns Error message if too large, null if valid
 */
export function validateFileSize(
  file: File,
  maxSize: number
): string | null {
  if (file.size > maxSize) {
    return `File too large. Maximum size: ${formatBytes(maxSize)}`;
  }
  return null;
}