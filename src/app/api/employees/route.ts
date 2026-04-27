import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDoc, SHEET_NAMES } from '@/lib/googleSheets';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const doc = await getDoc();
    const empSheet = doc.sheetsByTitle[SHEET_NAMES.EMPLOYEES];
    const accSheet = doc.sheetsByTitle[SHEET_NAMES.ACCESS];

    const empRows = await empSheet.getRows();
    const accRows = await accSheet.getRows();

    const employees = empRows.map(r => {
      const empNo = r.get('Employee No.');
      const acc = accRows.find(a => a.get('Employee No.')?.toString() === empNo?.toString());
      return {
        employeeNo: empNo,
        firstName: r.get('First Name'),
        lastName: r.get('Last Name'),
        email: r.get('Email Address'),
        department: r.get('Department'),
        position: r.get('Position'),
        workLat: r.get('Work Latitude'),
        workLng: r.get('Work Longitude'),
        workRadius: r.get('Work Radius'),
        shiftStart: r.get('Shift Start'),
        shiftEnd: r.get('Shift End'),
        role: acc?.get('Role') || 'Unassigned',
        status: acc?.get('Status') || 'Inactive',
        photo: r.get('Profile Photo'),
        middleName: r.get('Middle Name'),
        birthdate: r.get('Birthdate'),
        civilStatus: r.get('Civil Status'),
        gender: r.get('Gender'),
        mobileNo: r.get('Mobile No.'),
        completeAddress: r.get('Complete Address'),
        sssNo: r.get('SSS No.'),
        tinNo: r.get('TIN No.'),
        philhealthNo: r.get('Philhealth No.'),
        pagibigNo: r.get('Pag-ibig No.'),
        emergencyContact: r.get('Emergency Contact Person'),
        emergencyNo: r.get('Emergency Contact No.')
      };
    });

    return NextResponse.json({ success: true, employees });
  } catch (e: unknown) {
    const error = e as Error;
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const user = session.user as any;
    const { employeeNo, action, value, ...profileData } = await request.json();
    
    const isAdmin = ['ADMIN', 'SUPERADMIN', 'HR'].includes(user.role?.toUpperCase());
    const isSelf = user.employeeNo?.toString() === employeeNo?.toString();

    if (!isAdmin && !isSelf) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const doc = await getDoc();
    
    // 1. Update Access (Role/Status) - Admin Only
    if (action === 'role' || action === 'status') {
      if (!isAdmin) return NextResponse.json({ success: false, message: 'Admin only' }, { status: 403 });
      
      const accSheet = doc.sheetsByTitle[SHEET_NAMES.ACCESS];
      const accRows = await accSheet.getRows();
      const accRow = accRows.find(r => r.get('Employee No.')?.toString() === employeeNo.toString());
      if (accRow) {
        if (action === 'role') accRow.set('Role', value);
        if (action === 'status') accRow.set('Status', value || (accRow.get('Status') === 'Active' ? 'Inactive' : 'Active'));
        await accRow.save();
      }
    }

    // 2. Update Profile Data
    if (Object.keys(profileData).length > 0) {
      const empSheet = doc.sheetsByTitle[SHEET_NAMES.EMPLOYEES];
      const empRows = await empSheet.getRows();
      const empRow = empRows.find(r => r.get('Employee No.')?.toString() === employeeNo.toString());
      
      if (!empRow) return NextResponse.json({ success: false, message: 'Employee not found' }, { status: 404 });

      // If self-edit, restrict fields? (Actually user said "self edit to fill their insufficient profiles")
      // We'll allow editing basic info.
      if (profileData.firstName) empRow.set('First Name', profileData.firstName);
      if (profileData.lastName) empRow.set('Last Name', profileData.lastName);
      if (profileData.middleName) empRow.set('Middle Name', profileData.middleName);
      if (profileData.email) empRow.set('Email Address', profileData.email);
      if (profileData.department) empRow.set('Department', profileData.department);
      if (profileData.position) empRow.set('Position', profileData.position);
      
      // Personal Info
      if (profileData.birthdate) empRow.set('Birthdate', profileData.birthdate);
      if (profileData.civilStatus) empRow.set('Civil Status', profileData.civilStatus);
      if (profileData.gender) empRow.set('Gender', profileData.gender);
      if (profileData.mobileNo) empRow.set('Mobile No.', profileData.mobileNo);
      if (profileData.completeAddress) empRow.set('Complete Address', profileData.completeAddress);
      
      // Government Info
      if (profileData.sssNo) empRow.set('SSS No.', profileData.sssNo);
      if (profileData.tinNo) empRow.set('TIN No.', profileData.tinNo);
      if (profileData.philhealthNo) empRow.set('Philhealth No.', profileData.philhealthNo);
      if (profileData.pagibigNo) empRow.set('Pag-ibig No.', profileData.pagibigNo);
      
      // Emergency Info
      if (profileData.emergencyContact) empRow.set('Emergency Contact Person', profileData.emergencyContact);
      if (profileData.emergencyNo) empRow.set('Emergency Contact No.', profileData.emergencyNo);

      // Workspace Info
      if (profileData.workLat) empRow.set('Work Latitude', profileData.workLat);
      if (profileData.workLng) empRow.set('Work Longitude', profileData.workLng);

      // Admin only fields
      if (isAdmin) {
        if (profileData.workRadius) empRow.set('Work Radius', profileData.workRadius);
        if (profileData.shiftStart) empRow.set('Shift Start', profileData.shiftStart);
        if (profileData.shiftEnd) empRow.set('Shift End', profileData.shiftEnd);
      }

      await empRow.save();
    }

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const error = e as Error;
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
