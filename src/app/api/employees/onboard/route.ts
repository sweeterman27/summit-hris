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

    // Check for existing employee
    const empRows = await empSheet.getRows();
    const exists = empRows.some(r => 
      r.get('Employee No.')?.toString() === employeeNo.toString() || 
      r.get('Email Address')?.toLowerCase() === email.toLowerCase() ||
      r.get('Updated Email Address')?.toLowerCase() === email.toLowerCase()
    );
    
    if (exists) {
      return NextResponse.json({ success: false, message: 'Employee ID or Email already exists' }, { status: 409 });
    }

    // 1. Create Employee Profile & Access Account in one go
    const hashedPassword = await bcrypt.hash(password, 10);
    const nextRowIndex = empRows.length + 2; // +1 for header, +1 for this new row
    
    await empSheet.addRow({
      'Employee No.': employeeNo,
      'First Name': firstName.toUpperCase(),
      'Last Name': lastName.toUpperCase(),
      'Complete Name': `=C${nextRowIndex}&" "&D${nextRowIndex}&" "&B${nextRowIndex}`,
      'Email Address': email,
      'Department': department || 'Operations',
      'Position': position || 'Associate',
      'Status': 'Active',
      'Role': role || 'EMPLOYEE',
      'Password Hash': hashedPassword,
      'Start Date': new Date().toISOString().split('T')[0],
    });

    return NextResponse.json({ success: true, message: 'Employee onboarded successfully' });

  } catch (error: any) {
    console.error('Onboarding Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
