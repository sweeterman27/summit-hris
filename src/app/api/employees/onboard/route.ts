import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDoc, SHEET_NAMES } from '@/lib/googleSheets';
import bcrypt from 'bcrypt';

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

    const body = await request.json();
    const { 
      firstName, 
      lastName, 
      email, 
      password, 
      role, 
      department, 
      position, 
      employeeNo 
    } = body;

    if (!firstName || !lastName || !email || !password || !employeeNo) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    const doc = await getDoc();
    const empSheet = doc.sheetsByTitle[SHEET_NAMES.EMPLOYEES];
    const accessSheet = doc.sheetsByTitle[SHEET_NAMES.ACCESS];

    // Check for existing employee
    const empRows = await empSheet.getRows();
    const exists = empRows.some(r => r.get('Employee No.')?.toString() === employeeNo.toString() || r.get('Email Address')?.toLowerCase() === email.toLowerCase());
    
    if (exists) {
      return NextResponse.json({ success: false, message: 'Employee ID or Email already exists' }, { status: 409 });
    }

    // 1. Create Employee Profile
    await empSheet.addRow({
      'Employee No.': employeeNo,
      'First Name': firstName,
      'Last Name': lastName,
      'Email Address': email,
      'Department': department || 'Operations',
      'Position': position || 'Associate',
      'Status': 'Active',
      'Date Hired': new Date().toISOString().split('T')[0],
    });

    // 2. Create Access Account
    const hashedPassword = await bcrypt.hash(password, 10);
    await accessSheet.addRow({
      'Employee No.': employeeNo,
      'Email': email,
      'Password Hash': hashedPassword,
      'Role': role || 'Employee',
      'Status': 'Active',
      'Created At': new Date().toISOString(),
    });

    return NextResponse.json({ success: true, message: 'Employee onboarded successfully' });

  } catch (error: any) {
    console.error('Onboarding Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
