import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format lap time from milliseconds to MM:SS.mmm
 */
export function formatTime(ms: number | null): string {
  if (!ms || ms <= 0) return '-';

  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const milliseconds = ms % 1000;

  return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
}

/**
 * Get color for car class badge
 */
export function getClassColor(carClass: string): string {
  const colors: Record<string, string> = {
    'GT3': '#ef4444',           // Red
    'GT4': '#3b82f6',           // Blue
    'Porsche Cup': '#f59e0b',   // Orange
    'Super Production': '#10b981', // Green
    'Other': '#6b7280'          // Gray
  };
  return colors[carClass] || colors['Other'];
}
