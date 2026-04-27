import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDoc, SHEET_NAMES } from '@/lib/googleSheets';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const user = session.user as any;
    const doc = await getDoc();
    const empSheet = doc.sheetsByTitle[SHEET_NAMES.EMPLOYEES];
    const empRows = await empSheet.getRows();
    
    const empRow = empRows.find(r => r.get('Employee No.')?.toString() === user.employeeNo?.toString());
    
    if (!empRow) {
      return NextResponse.json({ success: false, message: 'Employee profile not found' }, { status: 404 });
    }

    const profile = {
      employeeNo: empRow.get('Employee No.'),
      firstName: empRow.get('First Name'),
      lastName: empRow.get('Last Name'),
      middleName: empRow.get('Middle Name'),
      email: empRow.get('Email Address'),
      department: empRow.get('Department'),
      position: empRow.get('Position'),
      workLat: empRow.get('Work Latitude'),
      workLng: empRow.get('Work Longitude'),
      workRadius: empRow.get('Work Radius'),
      shiftStart: empRow.get('Shift Start'),
      shiftEnd: empRow.get('Shift End'),
      photo: empRow.get('Profile Photo'),
      birthdate: empRow.get('Birthdate'),
      civilStatus: empRow.get('Civil Status'),
      gender: empRow.get('Gender'),
      mobileNo: empRow.get('Mobile No.'),
      completeAddress: empRow.get('Complete Address'),
      sssNo: empRow.get('SSS No.'),
      tinNo: empRow.get('TIN No.'),
      philhealthNo: empRow.get('Philhealth No.'),
      pagibigNo: empRow.get('Pag-ibig No.'),
      emergencyContact: empRow.get('Emergency Contact Person'),
      emergencyNo: empRow.get('Emergency Contact No.')
    };

    return NextResponse.json({ success: true, profile });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
