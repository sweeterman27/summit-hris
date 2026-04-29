import { uploadToCloudinary } from '@/lib/cloudinary';
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
    const user = session.user as any;
    const filename = searchParams.get('filename') || `profile_${user.employeeNo}`;

    if (!request.body) {
      return NextResponse.json({ success: false, message: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await request.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Upload to Cloudinary (EASY & FAST)
    const photoUrl = await uploadToCloudinary(
      buffer, 
      'profiles',
      filename
    );

    // 2. Update Google Sheet (Skip if Shadow Admin)
    if (user.employeeNo !== 'SA-001') {
      const doc = await getDoc();
      const sheet = doc.sheetsByTitle[SHEET_NAMES.EMPLOYEES];
      const rows = await sheet.getRows();
      const userRow = rows.find(
        (r) => r.get('Employee No.')?.toString() === user.employeeNo?.toString()
      );

      if (userRow) {
        userRow.set('Profile Photo', photoUrl);
        await userRow.save();
      }
    }

    return NextResponse.json({ success: true, url: photoUrl });
  } catch (e: any) {
    console.error('Upload Error:', e);
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}
