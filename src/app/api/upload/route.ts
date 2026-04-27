import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDoc, SHEET_NAMES } from '@/lib/googleSheets';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename') || `profile_${(session.user as any).employeeNo}.jpg`;

    if (!request.body) {
      return NextResponse.json({ success: false, message: 'No file provided' }, { status: 400 });
    }

    // 1. Upload to Vercel Blob
    const blob = await put(filename, request.body, {
      access: 'public',
    });

    // 2. Update Google Sheet
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle[SHEET_NAMES.EMPLOYEES];
    const rows = await sheet.getRows();
    const userRow = rows.find(
      (r) => r.get('Employee No.')?.toString() === (session.user as any).employeeNo?.toString()
    );

    if (userRow) {
      userRow.set('Profile Photo', blob.url);
      await userRow.save();
    }

    return NextResponse.json({ success: true, url: blob.url });
  } catch (e: any) {
    console.error('Upload Error:', e);
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}
