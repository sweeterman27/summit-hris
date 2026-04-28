import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDoc, SHEET_NAMES } from '@/lib/googleSheets';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const employeeNo = (session.user as any).employeeNo;
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle[SHEET_NAMES.NOTIFICATIONS];
    const rows = await sheet.getRows();

    // Fetch last 20 notifications (include those tagged as 'ALL' for global alerts)
    const userNotifications = rows
      .filter((row) => {
        const rowEmpNo = row.get('Employee No.')?.toString();
        return rowEmpNo === employeeNo?.toString() || rowEmpNo === 'ALL';
      })
      .slice(-20)
      .reverse()
      .map((row) => ({
        id: row.get('ID'),
        title: row.get('Title'),
        message: row.get('Message'),
        type: row.get('Type'),
        status: row.get('Status'),
        createdAt: row.get('Created At'),
      }));

    return NextResponse.json({ notifications: userNotifications });
  } catch (error) {
    console.error('Fetch Notifications Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { notificationId, markAll } = await req.json();
    const employeeNo = (session.user as any).employeeNo;
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle[SHEET_NAMES.NOTIFICATIONS];
    const rows = await sheet.getRows();

    if (markAll) {
      const userRows = rows.filter(
        (row) => row.get('Employee No.')?.toString() === employeeNo?.toString() && row.get('Status') === 'Unread'
      );
      
      // OPTIMIZATION: Process all saves in parallel
      await Promise.all(userRows.map(row => {
        row.set('Status', 'Read');
        return row.save();
      }));
    } else if (notificationId) {
      const row = rows.find((r) => r.get('ID') === notificationId);
      if (row && (row.get('Employee No.')?.toString() === employeeNo?.toString() || row.get('Employee No.') === 'ALL')) {
        row.set('Status', 'Read');
        await row.save();
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update Notifications Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
