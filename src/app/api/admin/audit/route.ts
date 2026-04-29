import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDoc, SHEET_NAMES } from '@/lib/googleSheets';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const user = session.user as any;
    // Audit Ledger is strictly for SUPERADMIN or Shadow Admin
    if (user.role?.toUpperCase() !== 'SUPERADMIN' && user.employeeNo !== 'SA-001') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const doc = await getDoc();
    const sheet = doc.sheetsByTitle[SHEET_NAMES.COMPLIANCE];
    const rows = await sheet.getRows();

    const audits = rows
      .slice(-100) // Get last 100 entries
      .reverse()
      .map(r => ({
        timestamp: r.get('Timestamp'),
        actorNo: r.get('Actor No.'),
        targetNo: r.get('Target No.'),
        action: r.get('Action'),
        details: r.get('Details'),
        severity: r.get('Severity'),
        status: r.get('Status')
      }));

    return NextResponse.json({ success: true, audits });
  } catch (e: unknown) {
    const error = e as Error;
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
