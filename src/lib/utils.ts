import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { SeatStatus } from '../types/database';

/**
 * Combines class names and merges Tailwind classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats an ISO date string to a readable format (e.g., '13 Sep 2026')
 */
export function formatDate(date: string | null): string {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid Date';
  
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

/**
 * Formats an ISO date string to include time
 */
export function formatDateTime(date: string | null): string {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid Date';
  
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/**
 * Returns the first letter of the first two words of a string
 */
export function getInitials(name: string): string {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
}

/**
 * Returns basic color classes for a status string
 */
export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'active':
    case 'available':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'inactive':
    case 'released':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'suspended':
    case 'disabled':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'occupied':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'maintenance':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

/**
 * Returns complete color scheme and icon type for seat statuses
 */
export function getSeatStatusColor(status: SeatStatus): { bg: string; text: string; border: string; icon: string } {
  switch (status) {
    case 'available':
      return { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200', icon: 'check-circle' };
    case 'occupied':
      return { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', icon: 'user' };
    case 'maintenance':
      return { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-200', icon: 'wrench' };
    case 'disabled':
      return { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', icon: 'slash' };
    default:
      return { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', icon: 'help-circle' };
  }
}

/**
 * Debounces a function call
 */
export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  return function (...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}

/**
 * Validates an email address format
 */
export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Validates a phone number (basic validation)
 */
export function validatePhone(phone: string): boolean {
  const re = /^\+?[\d\s-]{10,}$/;
  return re.test(phone);
}

/**
 * Validates password strength
 */
export function validatePassword(password: string): { valid: boolean; message: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter.' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter.' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number.' };
  }
  
  return { valid: true, message: 'Valid password.' };
}
