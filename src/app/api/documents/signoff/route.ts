import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDoc, SHEET_NAMES } from '@/lib/googleSheets';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    const { documentId, documentTitle } = await request.json();

    if (!documentId || !documentTitle) {
      return NextResponse.json({ success: false, message: 'Missing document ID or title' }, { status: 400 });
    }

    const doc = await getDoc();
    let sheet = doc.sheetsByTitle[SHEET_NAMES.COMPLIANCE];
    
    if (!sheet) {
      // Create Compliance Logs sheet if missing
      sheet = await doc.addSheet({ 
        title: SHEET_NAMES.COMPLIANCE, 
        headerValues: ['ID', 'Employee No.', 'Name', 'Document ID', 'Document Title', 'Acknowledged At', 'IP Address', 'Status'] 
      });
    }

    // Check if already signed
    const rows = await sheet.getRows();
    const alreadySigned = rows.find(r => r.get('Employee No.')?.toString() === user.employeeNo?.toString() && r.get('Document ID') === documentId);
    
    if (alreadySigned) {
      return NextResponse.json({ success: false, message: 'Document already acknowledged' }, { status: 400 });
    }

    // Get IP address from headers (best effort)
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown';

    await sheet.addRow({
      ID: `SIGNOFF-${uuidv4().substring(0, 8).toUpperCase()}`,
      'Employee No.': user.employeeNo,
      'Name': user.name || 'Unknown',
      'Document ID': documentId,
      'Document Title': documentTitle,
      'Acknowledged At': new Date().toISOString(),
      'IP Address': ip,
      'Status': 'ACKNOWLEDGED',
    });

    return NextResponse.json({ success: true, message: 'Sign-off complete.' });
  } catch (e: any) {
    console.error('Sign-off Error:', e);
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}
