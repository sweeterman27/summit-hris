import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDoc, SHEET_NAMES } from '@/lib/googleSheets';
import bcrypt from 'bcrypt';
import { logAudit } from '@/lib/audit';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const user = session.user as any;
    const isAdmin = ['ADMIN', 'SUPERADMIN', 'HR'].includes(user.role?.toUpperCase());

    const doc = await getDoc();
    const empSheet = doc.sheetsByTitle[SHEET_NAMES.EMPLOYEES];
    const archiveSheet = doc.sheetsByTitle[SHEET_NAMES.ARCHIVE];

    if (!empSheet) {
      return NextResponse.json({ success: false, message: 'Database tab not found' }, { status: 500 });
    }

    const [empRows, archiveRows] = await Promise.all([
      empSheet.getRows(),
      archiveSheet ? archiveSheet.getRows() : Promise.resolve([])
    ]);

    const normalizeEmployee = (r: any, isArchived: boolean) => {
      const baseInfo = {
        employeeNo: r.get('Employee No.')?.toString() || 'Unknown',
        firstName: r.get('First Name') || '',
        lastName: r.get('Last Name') || '',
        email: r.get('Email Address') || r.get('Updated Email Address') || '',
        department: r.get('Department') || 'Unassigned',
        position: r.get('Position') || 'Unassigned',
        role: r.get('Role') ? (String(r.get('Role')).charAt(0).toUpperCase() + String(r.get('Role')).slice(1).toLowerCase()) : 'Employee',
        status: isArchived ? 'Archived' : (r.get('Status') || 'Inactive'),
        photo: r.get('Profile Photo'),
        shiftStart: r.get('Shift Start'),
        shiftEnd: r.get('Shift End'),
        reportsTo: r.get('Reports To') || '',
        isArchived
      };

      if (isAdmin) {
        return {
          ...baseInfo,
          workLat: r.get('Work Latitude'),
          workLng: r.get('Work Longitude'),
          workRadius: r.get('Work Radius'),
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
      }
      return baseInfo;
    };

    const activeEmployees = empRows
      .filter(r => r.get('Employee No.') && r.get('First Name'))
      .map(r => normalizeEmployee(r, false));

    const archivedEmployees = archiveRows
      .filter(r => r.get('Employee No.') && r.get('First Name'))
      .map(r => normalizeEmployee(r, true));

    const employees = [...activeEmployees, ...archivedEmployees];

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
    const empSheet = doc.sheetsByTitle[SHEET_NAMES.EMPLOYEES];
    const empRows = await empSheet.getRows();
    const empRow = empRows.find(r => r.get('Employee No.')?.toString() === employeeNo.toString());
    
    if (!empRow) return NextResponse.json({ success: false, message: 'Employee not found' }, { status: 404 });

    // 1. Update Role/Status - Admin Only
    if (action === 'role' || action === 'status') {
      if (!isAdmin) return NextResponse.json({ success: false, message: 'Admin only' }, { status: 403 });
      
      if (action === 'role') empRow.set('Role', value);
      if (action === 'status') empRow.set('Status', value || (empRow.get('Status') === 'Active' ? 'Inactive' : 'Active'));
    }

    // 2. Update Profile Data
    if (Object.keys(profileData).length > 0) {
      // Use existing empRow found above to ensure updates are saved correctly
      if (!empRow) return NextResponse.json({ success: false, message: 'Employee not found' }, { status: 404 });

      // If self-edit, restrict fields? (Actually user said "self edit to fill their insufficient profiles")
      // We'll allow editing basic info.
      if (profileData.firstName) empRow.set('First Name', profileData.firstName.toUpperCase());
      if (profileData.lastName) empRow.set('Last Name', profileData.lastName.toUpperCase());
      if (profileData.middleName) empRow.set('Middle Name', profileData.middleName.toUpperCase());
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
      if (profileData.reportsTo) empRow.set('Reports To', profileData.reportsTo);

      // Admin only fields
      if (isAdmin) {
        if (profileData.workRadius) empRow.set('Work Radius', profileData.workRadius);
        if (profileData.shiftStart) empRow.set('Shift Start', profileData.shiftStart);
        if (profileData.shiftEnd) empRow.set('Shift End', profileData.shiftEnd);
        
        // Log Administrative Override
        await logAudit(
          (session.user as any).employeeNo,
          employeeNo,
          'PROFILE_UPDATE',
          `Administrative update to profile fields: ${Object.keys(profileData).join(', ')}`,
          'INFO'
        );

        // Executive Power: Set Password
        if (profileData.password) {
          console.log(`[AUTH_RESET] Recalibrating credentials for: ${employeeNo}`);
          const hashedPassword = await bcrypt.hash(profileData.password, 10);
          empRow.set('Password Hash', hashedPassword);
          console.log('[AUTH_RESET] New Bcrypt hash synchronized.');

          await logAudit(
            (session.user as any).employeeNo,
            employeeNo,
            'CREDENTIAL_RESET',
            'Executive password override initiated and synchronized.',
            'CRITICAL'
          );
        }
      }

    }
 
    console.log(`[REGISTRY_SYNC] Saving updates for employee: ${employeeNo}`);
    await empRow.save();
    console.log('[REGISTRY_SYNC] Database commit successful.');
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const error = e as Error;
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
