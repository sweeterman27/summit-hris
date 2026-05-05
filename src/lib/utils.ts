/**
 * SUMMIT HRIS - SHARED UTILITIES
 * Pure functions that can be used on both Client and Server.
 * Do NOT import any Node.js built-ins or server-only modules here.
 */

/**
 * Formats a time string (e.g., '14:00' or '02:00 PM') to consistent 12-hour AM/PM format.
 */
export function formatTimeTo12h(timeStr: string): string {
  if (!timeStr) return '';
  
  const cleanStr = timeStr.trim().toUpperCase();
  
  // If already in 12h format, return as is
  if (cleanStr.includes('AM') || cleanStr.includes('PM')) {
    return cleanStr;
  }

  try {
    const parts = cleanStr.split(':');
    if (parts.length < 2) return timeStr;
    
    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);
    
    if (isNaN(hours) || isNaN(minutes)) return timeStr;

    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    
    return `${displayHours.toString().padStart(2, '0')}:${displayMinutes} ${period}`;
  } catch {
    return timeStr;
  }
}

/**
 * Standard fetcher for SWR and other data fetching hooks
 */
export const fetcher = (url: string) => fetch(url).then(res => res.json());
