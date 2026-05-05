import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDoc, SHEET_NAMES } from '@/lib/googleSheets';
import { logAudit } from '@/lib/audit';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const doc = await getDoc();
    let sheet = doc.sheetsByTitle[SHEET_NAMES.OFFBOARDING];
    
    if (!sheet) {
      sheet = await doc.addSheet({ 
        title: SHEET_NAMES.OFFBOARDING, 
        headerValues: ['Employee No.', 'Name', 'Exit Date', 'Reason', 'IT Clear', 'HR Clear', 'Finance Clear', 'Status', 'Initiated By', 'Notes'] 
      });
    }

    const rows = await sheet.getRows();
    const offboardings = rows.map(r => ({
      employeeNo: r.get('Employee No.'),
      name: r.get('Name'),
      exitDate: r.get('Exit Date'),
      reason: r.get('Reason'),
      itClear: r.get('IT Clear') === 'TRUE',
      hrClear: r.get('HR Clear') === 'TRUE',
      financeClear: r.get('Finance Clear') === 'TRUE',
      status: r.get('Status'),
      initiatedBy: r.get('Initiated By'),
      notes: r.get('Notes'),
    }));

    return NextResponse.json({ success: true, offboardings });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const user = session.user as any;
    const isAdmin = ['ADMIN', 'SUPERADMIN', 'HR'].includes(user.role?.toUpperCase());
    if (!isAdmin) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });

    const { employeeNo, name, exitDate, reason, notes } = await request.json();

    const doc = await getDoc();
    let sheet = doc.sheetsByTitle[SHEET_NAMES.OFFBOARDING];
    
    if (!sheet) {
      sheet = await doc.addSheet({ 
        title: SHEET_NAMES.OFFBOARDING, 
        headerValues: ['Employee No.', 'Name', 'Exit Date', 'Reason', 'IT Clear', 'HR Clear', 'Finance Clear', 'Status', 'Initiated By', 'Notes'] 
      });
    }

    // Check if already exists
    const rows = await sheet.getRows();
    if (rows.find(r => r.get('Employee No.') === employeeNo)) {
      return NextResponse.json({ success: false, message: 'Offboarding already initiated for this employee.' }, { status: 400 });
    }

    await sheet.addRow({
      'Employee No.': employeeNo,
      'Name': name,
      'Exit Date': exitDate,
      'Reason': reason,
      'IT Clear': 'FALSE',
      'HR Clear': 'FALSE',
      'Finance Clear': 'FALSE',
      'Status': 'IN_PROGRESS',
      'Initiated By': user.employeeNo,
      'Notes': notes || '',
    });

    await logAudit(user.employeeNo, employeeNo, 'ADMIN_ACTION', `Exit protocol initiated for ${name} (${employeeNo}).`, 'WARNING');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const user = session.user as any;
    const isAdmin = ['ADMIN', 'SUPERADMIN', 'HR'].includes(user.role?.toUpperCase());
    if (!isAdmin) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });

    const { employeeNo, itClear, hrClear, financeClear, status, notes } = await request.json();

    const doc = await getDoc();
    const sheet = doc.sheetsByTitle[SHEET_NAMES.OFFBOARDING];
    const rows = await sheet.getRows();
    const row = rows.find(r => r.get('Employee No.') === employeeNo);

    if (!row) return NextResponse.json({ success: false, message: 'Record not found' }, { status: 404 });

    if (itClear !== undefined) row.set('IT Clear', itClear ? 'TRUE' : 'FALSE');
    if (hrClear !== undefined) row.set('HR Clear', hrClear ? 'TRUE' : 'FALSE');
    if (financeClear !== undefined) row.set('Finance Clear', financeClear ? 'TRUE' : 'FALSE');
    if (status) row.set('Status', status);
    if (notes !== undefined) row.set('Notes', notes);

    await row.save();

    // If fully cleared and status changed to COMPLETED, we could trigger the archiving here
    // but usually HR does a final "Confirm Termination" button in the UI.

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
