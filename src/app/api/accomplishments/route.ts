import { uploadToCloudinary } from '@/lib/cloudinary';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDoc, SHEET_NAMES } from '@/lib/googleSheets';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const user = session.user as any;
    const formData = await request.formData();
    
    const summary = formData.get('summary') as string;
    const files = formData.getAll('files') as File[];
    const employeeNo = user.employeeNo;
    const date = new Date().toISOString().split('T')[0];

    if (!summary) {
      return NextResponse.json({ success: false, message: 'Summary is required' }, { status: 400 });
    }

    if (files.length === 0) {
      return NextResponse.json({ success: false, message: 'At least one proof of work (media) is required' }, { status: 400 });
    }

    // 1. Upload files to Cloudinary - PARALLEL OPTIMIZED
    const mediaUrls = await Promise.all(files.map(async (file) => {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      const result = await uploadToCloudinary(
        buffer, 
        'SUMMIT/Accomplishment Report',
        `${employeeNo}_${Date.now()}_${file.name.split('.')[0]}`
      ) as any;
      
      return result.url;
    }));

    // 2. Save to Spreadsheet
    const doc = await getDoc();
    let sheet = doc.sheetsByTitle[SHEET_NAMES.ACCOMPLISHMENTS];
    
    // Create sheet if missing (Auto-Migration)
    if (!sheet) {
      sheet = await doc.addSheet({ 
        title: SHEET_NAMES.ACCOMPLISHMENTS,
        headerValues: ['ID', 'Employee No.', 'Name', 'Date', 'Summary', 'Media URLs', 'Status', 'Remarks', 'Timestamp']
      });
    }

    const id = `AC-${Date.now()}`;
    await sheet.addRow({
      'ID': id,
      'Employee No.': employeeNo,
      'Name': user.name,
      'Date': date,
      'Summary': summary,
      'Media URLs': mediaUrls.join(','),
      'Status': 'Pending',
      'Remarks': '',
      'Timestamp': new Date().toISOString()
    });

    return NextResponse.json({ success: true, id });
  } catch (e: any) {
    console.error('Accomplishment Submission Error:', e);
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const user = session.user as any;
    const isAdmin = ['ADMIN', 'SUPERADMIN', 'HR'].includes(user.role?.toUpperCase());
    const { searchParams } = new URL(request.url);
    const targetDate = searchParams.get('date');
    const targetEmployeeNo = searchParams.get('employeeNo');

    const doc = await getDoc();
    const sheet = doc.sheetsByTitle[SHEET_NAMES.ACCOMPLISHMENTS];
    if (!sheet) return NextResponse.json({ success: true, reports: [] });

    const rows = await sheet.getRows();
    
    let filteredRows = rows;
    if (!isAdmin) {
      filteredRows = rows.filter(r => r.get('Employee No.')?.toString() === user.employeeNo?.toString());
    } else {
      if (targetEmployeeNo) {
        filteredRows = filteredRows.filter(r => r.get('Employee No.')?.toString() === targetEmployeeNo.toString());
      }
      if (targetDate) {
        filteredRows = filteredRows.filter(r => r.get('Date') === targetDate);
      }
    }

    const reports = filteredRows.map(r => ({
      id: r.get('ID'),
      employeeNo: r.get('Employee No.'),
      name: r.get('Name'),
      date: r.get('Date'),
      summary: r.get('Summary'),
      mediaUrls: r.get('Media URLs')?.split(',') || [],
      status: r.get('Status'),
      remarks: r.get('Remarks'),
      timestamp: r.get('Timestamp')
    })).reverse();

    return NextResponse.json({ success: true, reports });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    
    if (!['ADMIN', 'SUPERADMIN', 'HR'].includes(user?.role?.toUpperCase())) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const { id, status, remarks } = await request.json();
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle[SHEET_NAMES.ACCOMPLISHMENTS];
    const rows = await sheet.getRows();
    const row = rows.find(r => r.get('ID') === id);

    if (!row) return NextResponse.json({ success: false, message: 'Report not found' }, { status: 404 });

    if (status) row.set('Status', status);
    if (remarks !== undefined) row.set('Remarks', remarks);
    
    await row.save();

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}
