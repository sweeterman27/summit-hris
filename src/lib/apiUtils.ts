import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { getDoc, SHEET_NAMES } from './googleSheets';

/**
 * Standard fetcher for SWR and other data fetching hooks
 */
export const fetcher = (url: string) => fetch(url).then(res => res.json());

/**
 * Higher-order utility to handle common API boilerplate:
 * 1. Auth session check
 * 2. Role-based authorization
 * 3. Error handling
 */
export async function withAdmin(
  handler: (session: any, doc: any) => Promise<NextResponse>
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    const isAdmin = ['ADMIN', 'SUPERADMIN', 'HR'].includes(user.role?.toUpperCase());
    
    if (!isAdmin) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const doc = await getDoc();
    return await handler(session, doc);
  } catch (error: any) {
    console.error('[API_ERROR]', error);
    return NextResponse.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * Ensures a Google Sheet exists, or creates it with headers if it doesn't
 */
export async function getOrCreateSheet(doc: any, sheetName: string, headers: string[]) {
  let sheet = doc.sheetsByTitle[sheetName];
  if (!sheet) {
    sheet = await doc.addSheet({ title: sheetName, headerValues: headers });
  }
  return sheet;
}

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
    const [hours, minutes] = cleanStr.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return timeStr;

    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    
    return `${displayHours.toString().padStart(2, '0')}:${displayMinutes} ${period}`;
  } catch {
    return timeStr;
  }
}
