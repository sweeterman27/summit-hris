import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDoc, SHEET_NAMES } from '@/lib/googleSheets';
import { v4 as uuidv4 } from 'uuid';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    const isAdmin = ['ADMIN', 'SUPERADMIN', 'HR'].includes(user.role?.toUpperCase());
    if (!isAdmin) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title');
    const category = searchParams.get('category') || 'Policy';
    const targetRoles = searchParams.get('targetRoles') || 'All';
    const originalFilename = searchParams.get('filename') || 'document.pdf';

    if (!request.body || !title) {
      return NextResponse.json({ success: false, message: 'Missing title or file' }, { status: 400 });
    }

    // 1. Upload to Cloudinary via ArrayBuffer
    const arrayBuffer = await request.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadPromise = new Promise<{ secure_url: string }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'hris_documents', resource_type: 'raw', public_id: `${uuidv4()}_${originalFilename}` },
        (error, result) => {
          if (error) reject(error);
          else resolve(result as { secure_url: string });
        }
      );
      uploadStream.end(buffer);
    });

    const result = await uploadPromise;
    const secureUrl = result.secure_url;

    // 2. Log to Google Sheets
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle[SHEET_NAMES.DOCUMENTS];
    
    if (!sheet) {
      // Create sheet if missing
      await doc.addSheet({ 
        title: SHEET_NAMES.DOCUMENTS, 
        headerValues: ['ID', 'Title', 'Category', 'URL', 'Type', 'Size', 'Uploaded At', 'Uploaded By', 'Target Roles'] 
      });
    }

    await sheet.addRow({
      ID: uuidv4(),
      Title: title,
      Category: category,
      URL: secureUrl,
      Type: originalFilename.split('.').pop()?.toUpperCase() || 'PDF',
      Size: `${(buffer.length / 1024 / 1024).toFixed(2)} MB`,
      'Uploaded At': new Date().toISOString(),
      'Uploaded By': user.employeeNo,
      'Target Roles': targetRoles,
    });

    return NextResponse.json({ success: true, url: secureUrl });
  } catch (e: any) {
    console.error('Document Upload Error:', e);
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}
