import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDoc, SHEET_NAMES } from '@/lib/googleSheets';
import { v4 as uuidv4 } from 'uuid';
import { notifyAll } from '@/lib/notifications';

export async function GET() {
  try {
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle[SHEET_NAMES.ANNOUNCEMENTS];
    if (!sheet) return NextResponse.json({ success: true, announcements: [] });

    const rows = await sheet.getRows();
    const now = new Date();

    const announcements = rows
      .map(r => ({
        id: r.get('ID'),
        content: r.get('Content'),
        type: r.get('Type') || 'Info',
        priority: parseInt(r.get('Priority')) || 1,
        createdAt: r.get('Created At'),
        expiryDate: r.get('Expiry Date'),
      }))
      .filter(a => !a.expiryDate || new Date(a.expiryDate) > now)
      .sort((a, b) => b.priority - a.priority);

    return NextResponse.json({ success: true, announcements });
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

    const { content, type, priority, expiryDate } = await request.json();

    const doc = await getDoc();
    const sheet = doc.sheetsByTitle[SHEET_NAMES.ANNOUNCEMENTS];
    if (!sheet) {
      await doc.addSheet({ title: SHEET_NAMES.ANNOUNCEMENTS, headerValues: ['ID', 'Content', 'Type', 'Priority', 'Created At', 'Created By', 'Expiry Date'] });
    }

    await sheet.addRow({
      ID: uuidv4(),
      Content: content,
      Type: type || 'Info',
      Priority: priority || 1,
      'Created At': new Date().toISOString(),
      'Created By': user.employeeNo,
      'Expiry Date': expiryDate || '',
    });

    // Notify All Employees
    await notifyAll(
      'New System Announcement',
      content.length > 100 ? `${content.substring(0, 97)}...` : content,
      'INFO'
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const user = session.user as any;
    const isAdmin = ['ADMIN', 'SUPERADMIN', 'HR'].includes(user.role?.toUpperCase());
    if (!isAdmin) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });

    const { id, content, type, priority, expiryDate } = await request.json();

    const doc = await getDoc();
    const sheet = doc.sheetsByTitle[SHEET_NAMES.ANNOUNCEMENTS];
    const rows = await sheet.getRows();
    const row = rows.find(r => r.get('ID') === id);

    if (row) {
      if (content !== undefined) row.set('Content', content);
      if (type !== undefined) row.set('Type', type);
      if (priority !== undefined) row.set('Priority', priority);
      if (expiryDate !== undefined) row.set('Expiry Date', expiryDate);
      
      await row.save();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const user = session.user as any;
    const isAdmin = ['ADMIN', 'SUPERADMIN', 'HR'].includes(user.role?.toUpperCase());
    if (!isAdmin) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    const doc = await getDoc();
    const sheet = doc.sheetsByTitle[SHEET_NAMES.ANNOUNCEMENTS];
    const rows = await sheet.getRows();
    const row = rows.find(r => r.get('ID') === id);

    if (row) {
      await row.delete();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
