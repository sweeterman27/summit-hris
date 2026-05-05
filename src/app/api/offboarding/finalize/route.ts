import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDoc, SHEET_NAMES } from '@/lib/googleSheets';
import { logAudit } from '@/lib/audit';
import { withAdmin, getOrCreateSheet } from '@/lib/apiUtils';

export async function POST(request: Request) {
  return withAdmin(async (session, doc) => {
    const { employeeNo } = await request.json();
    const user = session.user as any;

    const empSheet = doc.sheetsByTitle[SHEET_NAMES.EMPLOYEES];
    const offSheet = doc.sheetsByTitle[SHEET_NAMES.OFFBOARDING];
    const archiveSheet = await getOrCreateSheet(doc, SHEET_NAMES.ARCHIVE, [
      'Employee No.', 'First Name', 'Last Name', 'Department', 'Role', 'Email', 
      'Archive Date', 'Exit Reason', 'Last Known Status'
    ]);

    const empRows = await empSheet.getRows();
    const offRows = await offSheet.getRows();

    const empRow = empRows.find(r => r.get('Employee No.') === employeeNo);
    const offRow = offRows.find(r => r.get('Employee No.') === employeeNo);

    if (!empRow) return NextResponse.json({ success: false, message: 'Employee not found in Registry' }, { status: 404 });
    if (!offRow) return NextResponse.json({ success: false, message: 'No active exit protocol found' }, { status: 404 });

    // Verify all clearances
    const isCleared = 
      offRow.get('IT Clear') === 'TRUE' && 
      offRow.get('HR Clear') === 'TRUE' && 
      offRow.get('Finance Clear') === 'TRUE';

    if (!isCleared) {
      return NextResponse.json({ 
        success: false, 
        message: 'Security Block: All clearances (IT, HR, Finance) must be verified before final archiving.' 
      }, { status: 403 });
    }

    // 1. Move to Archive
    await archiveSheet.addRow({
      'Employee No.': empRow.get('Employee No.'),
      'First Name': empRow.get('First Name'),
      'Last Name': empRow.get('Last Name'),
      'Department': empRow.get('Department'),
      'Role': empRow.get('Role'),
      'Email': empRow.get('Email Address') || empRow.get('Email'),
      'Archive Date': new Date().toISOString().split('T')[0],
      'Exit Reason': offRow.get('Reason'),
      'Last Known Status': 'Terminated/Resigned'
    });

    // 2. Delete from Active Registry
    await empRow.delete();

    // 3. Update Offboarding Status
    offRow.set('Status', 'COMPLETED');
    await offRow.save();

    // 4. Log Forensic Audit
    await logAudit(
      user.employeeNo,
      employeeNo,
      'ADMIN_ACTION',
      `CRITICAL: Finalized exit protocol and archived personnel record for ${empRow.get('First Name')} ${empRow.get('Last Name')}. Access Revoked.`,
      'CRITICAL'
    );

    return NextResponse.json({ success: true, message: 'Personnel record successfully archived and deactivated.' });
  });
}
