import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDoc, SHEET_NAMES } from '@/lib/googleSheets';
import { sendNotification } from '@/lib/notifications';

interface SessionUser {
  employeeNo: string;
  role: string;
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const user = session.user as unknown as SessionUser;
    const { searchParams } = new URL(request.url);
    const targetEmployeeNo = searchParams.get('employeeNo') || user.employeeNo;
    
    const isAdmin = ['ADMIN', 'SUPERADMIN', 'HR'].includes(user.role?.toUpperCase());

    // If not admin, they can only see their own OKRs
    const finalEmployeeNo = isAdmin ? targetEmployeeNo : user.employeeNo;

    const doc = await getDoc();
    const sheet = doc.sheetsByTitle[SHEET_NAMES.OKR];
    if (!sheet) return NextResponse.json({ success: true, objectives: [] });

    const rows = await sheet.getRows();
    const userRecords = rows.filter(r => r.get('Employee No.')?.toString() === finalEmployeeNo.toString());

    if (userRecords.length === 0) return NextResponse.json({ success: true, objectives: [] });

    // Hierarchy Building
    interface OKRData {
      id: string;
      title: string;
      description: string;
      target: number;
      current: number;
      status: string;
      quarter: string;
      parentId: string;
      keyResults: OKRData[];
    }

    const objectives: OKRData[] = [];
    const krMap: { [key: string]: OKRData[] } = {};

    userRecords.forEach((r) => {
      const data: OKRData = {
        id: r.get('ID'),
        title: r.get('Title'),
        description: r.get('Description'),
        target: parseFloat(r.get('Target')) || 0,
        current: parseFloat(r.get('Current')) || 0,
        status: r.get('Status'),
        quarter: r.get('Quarter'),
        parentId: r.get('Parent ID') || '',
        keyResults: []
      };

      if (!data.parentId) {
        objectives.push(data);
      } else {
        if (!krMap[data.parentId]) krMap[data.parentId] = [];
        krMap[data.parentId].push(data);
      }
    });

    objectives.forEach((obj) => {
      if (krMap[obj.id]) obj.keyResults = krMap[obj.id];
    });

    return NextResponse.json({ success: true, objectives });
  } catch (e: unknown) {
    const error = e as Error;
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const user = session.user as unknown as SessionUser;
    const isAdmin = ['ADMIN', 'SUPERADMIN', 'HR'].includes(user.role?.toUpperCase());

    if (!isAdmin) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });

    const { employeeNo, title, description, quarter, parentId, target } = await request.json();
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle[SHEET_NAMES.OKR];

    await sheet.addRow({
      'ID': `OKR-${Date.now()}`,
      'Employee No.': employeeNo,
      'Title': title,
      'Description': description,
      'Quarter': quarter,
      'Parent ID': parentId || '',
      'Target': target || 100,
      'Current': 0,
      'Status': 'Active',
      'Created At': new Date().toISOString()
    });

    // Notify Employee
    await sendNotification(
      employeeNo,
      'New Performance Objective Assigned',
      `A new objective "${title}" has been assigned to you for ${quarter}.`,
      'INFO'
    );

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const error = e as Error;
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { id, current, title, description, target } = await request.json();
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle[SHEET_NAMES.OKR];
    const rows = await sheet.getRows();
    const row = rows.find(r => r.get('ID') === id);

    if (!row) return NextResponse.json({ success: false, message: 'OKR record not found' }, { status: 404 });

    const user = session.user as unknown as SessionUser;
    const isAdmin = ['ADMIN', 'SUPERADMIN', 'HR'].includes(user.role?.toUpperCase());
    const isOwner = row.get('Employee No.')?.toString() === user.employeeNo.toString();

    if (!isAdmin && !isOwner) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });

    if (current !== undefined) row.set('Current', current);
    
    // Admin can edit details
    if (isAdmin) {
      if (title) row.set('Title', title);
      if (description) row.set('Description', description);
      if (target) row.set('Target', target);
    }

    await row.save();

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const error = e as Error;
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const user = session.user as unknown as SessionUser;
    const isAdmin = ['ADMIN', 'SUPERADMIN', 'HR'].includes(user.role?.toUpperCase());

    if (!isAdmin) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    const doc = await getDoc();
    const sheet = doc.sheetsByTitle[SHEET_NAMES.OKR];
    const rows = await sheet.getRows();
    const row = rows.find(r => r.get('ID') === id);

    if (row) await row.delete();

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const error = e as Error;
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
