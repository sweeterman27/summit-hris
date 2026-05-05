import { NextResponse } from 'next/server';
import { SHEET_NAMES } from '@/lib/googleSheets';
import { withAdmin, getOrCreateSheet } from '@/lib/apiUtils';

export const dynamic = 'force-dynamic';

export async function GET() {
  return withAdmin(async (session, doc) => {
    const sheet = await getOrCreateSheet(doc, SHEET_NAMES.RECRUITMENT, ['ID', 'Name', 'Email', 'Role Applied', 'Status', 'Applied Date', 'Notes', 'Resume URL']);
    const rows = await sheet.getRows();
    const applicants = rows.map(r => ({
      id: r.get('ID'),
      name: r.get('Name'),
      email: r.get('Email'),
      roleApplied: r.get('Role Applied'),
      status: r.get('Status') || 'New',
      appliedDate: r.get('Applied Date'),
      notes: r.get('Notes') || '',
      resumeUrl: r.get('Resume URL') || ''
    }));
    return NextResponse.json({ success: true, applicants });
  });
}

export async function POST(request: Request) {
  return withAdmin(async (session, doc) => {
    const { name, email, roleApplied, notes, resumeUrl } = await request.json();
    const sheet = doc.sheetsByTitle[SHEET_NAMES.RECRUITMENT];
    
    await sheet.addRow({
      'ID': `APP-${crypto.randomUUID().substring(0, 8).toUpperCase()}`,
      'Name': name,
      'Email': email,
      'Role Applied': roleApplied,
      'Status': 'New',
      'Applied Date': new Date().toISOString(),
      'Notes': notes || '',
      'Resume URL': resumeUrl || ''
    });

    return NextResponse.json({ success: true });
  });
}

export async function PUT(request: Request) {
  return withAdmin(async (session, doc) => {
    const { id, status } = await request.json();
    const sheet = doc.sheetsByTitle[SHEET_NAMES.RECRUITMENT];
    const rows = await sheet.getRows();
    const row = rows.find(r => r.get('ID') === id);

    if (!row) return NextResponse.json({ success: false, message: 'Applicant not found' }, { status: 404 });

    const currentStatus = row.get('Status');
    row.set('Status', status);
    await row.save();

    if (status === 'Hired' && currentStatus !== 'Hired') {
      const empSheet = doc.sheetsByTitle[SHEET_NAMES.EMPLOYEES];
      const empRows = await empSheet.getRows();
      
      const existingNos = empRows.map(r => parseInt(r.get('Employee No.')?.replace(/\D/g, '') || '0'));
      const nextNo = Math.max(...existingNos, 0) + 1;
      const formattedNo = `EMP-${nextNo.toString().padStart(3, '0')}`;
      
      const nameParts = row.get('Name').split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || 'TBD';

      await empSheet.addRow({
        'Employee No.': formattedNo,
        'First Name': firstName,
        'Last Name': lastName,
        'Department': 'TBD',
        'Role': row.get('Role Applied'),
        'Email': row.get('Email'),
        'Status': 'Pending Onboarding',
        'Shift Start': '09:00 AM',
        'Work Radius': '100',
        'Join Date': new Date().toISOString().split('T')[0]
      });
      
      return NextResponse.json({ success: true, message: `Applicant hired. Auto-provisioned ID: ${formattedNo}` });
    }

    return NextResponse.json({ success: true });
  });
}
