import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDoc, SHEET_NAMES } from '@/lib/googleSheets';
import { sendNotification, notifyRoles } from '@/lib/notifications';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const doc = await getDoc();
    const sheet = doc.sheetsByTitle[SHEET_NAMES.LEAVE];
    const balancesSheet = doc.sheetsByTitle[SHEET_NAMES.LEAVE_BALANCES];

    if (!sheet) return NextResponse.json({ success: true, requests: [], balances: [] });

    const rows = await sheet.getRows();
    const role = (session.user as any).role?.toUpperCase();
    const employeeNo = (session.user as any).employeeNo;

    let filteredRows = rows;
    if (role === 'EMPLOYEE') {
      filteredRows = rows.filter(r => r.get('Employee No.')?.toString() === employeeNo.toString());
    } 
    // Managers/HR/Admin logic can be expanded here

    const requests = filteredRows.map(r => ({
      id: r.get('ID'),
      employeeNo: r.get('Employee No.'),
      name: r.get('Name'),
      type: r.get('Leave Type'),
      start: r.get('Start Date'),
      end: r.get('End Date'),
      days: r.get('Days'),
      reason: r.get('Reason'),
      status: r.get('Status'),
      reviewedBy: r.get('Reviewed By'),
      remarks: r.get('Remarks'),
    })).reverse();

    // Fetch Balances
    let balances = [];
    if (balancesSheet) {
      const bRows = await balancesSheet.getRows();
      let filteredBRows = bRows;
      if (role === 'EMPLOYEE') {
        filteredBRows = bRows.filter(r => r.get('Employee No.')?.toString() === employeeNo.toString());
      }
      balances = filteredBRows.map(r => ({
        employeeNo: r.get('Employee No.'),
        name: r.get('Name'),
        sil: parseFloat(r.get('SIL Balance') || '0'),
        birthday: parseFloat(r.get('Birthday Leave') || '0'),
        tenure: parseFloat(r.get('Tenure Leave') || '0'),
        used: parseFloat(r.get('Used Leaves') || '0'),
        totalAllowance: parseFloat(r.get('Total Allowance') || '0'),
        remaining: parseFloat(r.get('Remaining Balance') || '0'),
      }));
    }

    return NextResponse.json({ success: true, requests, balances });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const payload = await request.json();
    const employeeNo = (session.user as any).employeeNo;

    const doc = await getDoc();
    const sheet = doc.sheetsByTitle[SHEET_NAMES.LEAVE];
    const empSheet = doc.sheetsByTitle[SHEET_NAMES.EMPLOYEES];
    const empRows = await empSheet.getRows();
    const empRow = empRows.find(r => r.get('Employee No.')?.toString() === employeeNo.toString());

    if (!empRow) throw new Error('Employee record not found.');

    const name = `${empRow.get('First Name') || ''} ${empRow.get('Last Name') || ''}`.trim();
    const dept = empRow.get('Department') || '';
    const id = `LR-${Date.now()}`;

    await sheet.addRow({
      'ID': id,
      'Employee No.': employeeNo,
      'Name': name,
      'Department': dept,
      'Leave Type': payload.type,
      'Start Date': payload.start,
      'End Date': payload.end,
      'Days': payload.days,
      'Reason': payload.reason,
      'Status': 'Pending',
      'Applied At': new Date().toISOString()
    });

    // Notify HR/Admin/Superadmin
    await notifyRoles(
      ['HR', 'ADMIN', 'SUPERADMIN'],
      'New Leave Request',
      `${name} has submitted a ${payload.type} request from ${payload.start} to ${payload.end}.`,
      'INFO'
    );

    return NextResponse.json({ success: true, id });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { id, action, remarks } = await request.json();
    const role = (session.user as any).role?.toUpperCase();

    if (!['HR', 'ADMIN', 'SUPERADMIN'].includes(role)) {
      return NextResponse.json({ success: false, message: 'Unauthorized role' }, { status: 403 });
    }

    const doc = await getDoc();
    const sheet = doc.sheetsByTitle[SHEET_NAMES.LEAVE];
    const rows = await sheet.getRows();
    const row = rows.find(r => r.get('ID') === id);

    if (!row) return NextResponse.json({ success: false, message: 'Request not found' }, { status: 404 });

    const status = action === 'approve' ? 'Approved' : 'Rejected';
    row.set('Status', status);
    row.set('Reviewed By', (session.user as any).employeeNo);
    row.set('Reviewed At', new Date().toISOString());
    row.set('Remarks', remarks || '');
    await row.save();

    // Trigger Notification
    const employeeNo = row.get('Employee No.');
    const empSheet = doc.sheetsByTitle[SHEET_NAMES.EMPLOYEES];
    const empRows = await empSheet.getRows();
    const empRow = empRows.find(r => r.get('Employee No.')?.toString() === employeeNo.toString());
    const email = empRow?.get('Email');

    await sendNotification(
      employeeNo,
      `Leave Request ${status}`,
      `Your request for ${row.get('Leave Type')} (${row.get('Start Date')} to ${row.get('End Date')}) has been ${status.toLowerCase()}. ${remarks ? `Remarks: ${remarks}` : ''}`,
      action === 'approve' ? 'SUCCESS' : 'ERROR',
      email
    );

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}
