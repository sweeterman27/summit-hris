import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDoc, SHEET_NAMES } from '@/lib/googleSheets';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle[SHEET_NAMES.DOCUMENTS];
    if (!sheet) return NextResponse.json({ success: true, documents: [] });

    const rows = await sheet.getRows();
    const documents = rows.map(r => ({
      id: r.get('ID'),
      title: r.get('Title'),
      category: r.get('Category') || 'Uncategorized',
      url: r.get('URL'),
      type: r.get('Type') || 'PDF',
      size: r.get('Size') || 'Unknown',
      uploadedAt: r.get('Uploaded At'),
      uploadedBy: r.get('Uploaded By'),
      targetRoles: r.get('Target Roles') || 'All',
    }));

    return NextResponse.json({ success: true, documents });
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
    const sheet = doc.sheetsByTitle[SHEET_NAMES.DOCUMENTS];
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
