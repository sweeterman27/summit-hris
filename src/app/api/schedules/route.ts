import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDoc, SHEET_NAMES } from '@/lib/googleSheets';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const employeeNo = searchParams.get('employeeNo');
    const date = searchParams.get('date'); // YYYY-MM-DD
    const month = searchParams.get('month'); // YYYY-MM

    const doc = await getDoc();
    let sheet = doc.sheetsByTitle[SHEET_NAMES.SCHEDULES];
    
    if (!sheet) {
      sheet = await doc.addSheet({ 
        title: SHEET_NAMES.SCHEDULES, 
        headerValues: ['Employee No.', 'Date', 'Start Time', 'End Time', 'Notes', 'Updated At'] 
      });
    }

    const rows = await sheet.getRows();
    let filtered = rows;

    if (employeeNo) {
      filtered = filtered.filter(r => r.get('Employee No.')?.toString() === employeeNo.toString());
    }
    if (date) {
      filtered = filtered.filter(r => r.get('Date') === date);
    }
    if (month) {
      filtered = filtered.filter(r => r.get('Date')?.toString().startsWith(month));
    }

    const schedules = filtered.map(r => ({
      employeeNo: r.get('Employee No.'),
      date: r.get('Date'),
      startTime: r.get('Start Time'),
      endTime: r.get('End Time'),
      notes: r.get('Notes'),
      updatedAt: r.get('Updated At'),
    }));

    return NextResponse.json({ success: true, schedules });
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

    const { employeeNo, date, startTime, endTime, notes } = await request.json();

    const doc = await getDoc();
    let sheet = doc.sheetsByTitle[SHEET_NAMES.SCHEDULES];
    
    if (!sheet) {
      sheet = await doc.addSheet({ 
        title: SHEET_NAMES.SCHEDULES, 
        headerValues: ['Employee No.', 'Date', 'Start Time', 'End Time', 'Notes', 'Updated At'] 
      });
    }

    const rows = await sheet.getRows();
    const existing = rows.find(r => 
      r.get('Employee No.')?.toString() === employeeNo.toString() && 
      r.get('Date') === date
    );

    if (existing) {
      existing.set('Start Time', startTime);
      existing.set('End Time', endTime);
      existing.set('Notes', notes || '');
      existing.set('Updated At', new Date().toISOString());
      await existing.save();
    } else {
      await sheet.addRow({
        'Employee No.': employeeNo,
        'Date': date,
        'Start Time': startTime,
        'End Time': endTime,
        'Notes': notes || '',
        'Updated At': new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
