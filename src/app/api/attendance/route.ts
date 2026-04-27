import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDoc, SHEET_NAMES } from '@/lib/googleSheets';
import { notifyRoles } from '@/lib/notifications';

interface SessionUser {
  employeeNo: string;
  role: string;
  email: string;
  name: string;
}

// --- Geofence Helper ---
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // meters
  const p1 = lat1 * Math.PI / 180;
  const p2 = lat2 * Math.PI / 180;
  const dp = (lat2 - lat1) * Math.PI / 180;
  const dl = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(dp / 2) * Math.sin(dp / 2) +
            Math.cos(p1) * Math.cos(p2) *
            Math.sin(dl / 2) * Math.sin(dl / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const user = session.user as unknown as SessionUser;
    const { searchParams } = new URL(request.url);
    const targetEmployeeNo = searchParams.get('employeeNo');
    
    const isAdmin = ['ADMIN', 'SUPERADMIN', 'HR'].includes(user.role?.toUpperCase());

    const doc = await getDoc();
    const sheet = doc.sheetsByTitle[SHEET_NAMES.ATTENDANCE];
    if (!sheet) return NextResponse.json({ success: true, records: [] });

    const rows = await sheet.getRows();
    
    // Filter logic: 
    // - If targetEmployeeNo provided and user is Admin, show that employee's logs.
    // - If no targetEmployeeNo and user is Admin, show ALL logs (or last 500).
    // - If user is not Admin, ONLY show their own logs.
    
    let filteredRows = rows;
    if (!isAdmin) {
      filteredRows = rows.filter(r => r.get('Employee No.')?.toString() === user.employeeNo?.toString());
    } else if (targetEmployeeNo) {
      filteredRows = rows.filter(r => r.get('Employee No.')?.toString() === targetEmployeeNo.toString());
    }

    const records = filteredRows
      .map(r => ({
        id: r.get('ID'),
        employeeNo: r.get('Employee No.'),
        name: r.get('Name'),
        date: r.get('Date'),
        timeIn: r.get('Time In'),
        timeOut: r.get('Time Out'),
        hours: r.get('Hours'),
        status: r.get('Status'),
        location: r.get('Location'),
        photo: r.get('Photo')
      }))
      .reverse()
      .slice(0, 500); // Limit to last 500 for performance

    return NextResponse.json({ success: true, records });
  } catch (e: unknown) {
    const error = e as Error;
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const user = session.user as unknown as SessionUser;

    if (user.role?.toUpperCase() === 'SUPERADMIN') {
      return NextResponse.json({ 
        success: false, 
        message: 'Superadmins are exempt from attendance tracking and cannot clock in/out.' 
      }, { status: 403 });
    }

    const { type, lat, lng, photo } = await request.json();
    const employeeNo = user.employeeNo;

    const doc = await getDoc();
    
    // 1. Check Geofence
    const empSheet = doc.sheetsByTitle[SHEET_NAMES.EMPLOYEES];
    const empRows = await empSheet.getRows();
    const empRow = empRows.find(r => r.get('Employee No.')?.toString() === employeeNo.toString());
    
    if (empRow && empRow.get('Work Latitude')) {
      const workLat = parseFloat(empRow.get('Work Latitude'));
      const workLng = parseFloat(empRow.get('Work Longitude'));
      const radius = parseFloat(empRow.get('Work Radius')) || 100;
      
      const distance = getDistance(lat, lng, workLat, workLng);
      if (distance > radius) {
        // Log Violation Notification
        await notifyRoles(
          ['HR', 'ADMIN', 'SUPERADMIN'],
          'Geofencing Violation',
          `${user.name} attempted to clock in ${Math.round(distance)}m away from their work zone (Limit: ${radius}m).`,
          'ERROR'
        );

        return NextResponse.json({ 
          success: false, 
          message: `Outside work zone. Distance: ${Math.round(distance)}m (Limit: ${radius}m)` 
        }, { status: 403 });
      }
    }

    const attSheet = doc.sheetsByTitle[SHEET_NAMES.ATTENDANCE];
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (type === 'in') {
      // Check if already clocked in today
      const rows = await attSheet.getRows();
      const existing = rows.find(r => 
        r.get('Employee No.')?.toString() === employeeNo.toString() &&
        r.get('Date')?.toString().includes(todayStr)
      );

      if (existing) return NextResponse.json({ success: false, message: 'Already clocked in for today.' });

      // --- Status Calculation (Personal Shift Override) ---
      const settingsSheet = doc.sheetsByTitle["Global Settings"];
      const settingsRows = await settingsSheet.getRows();
      
      const getSetting = (name: string) => settingsRows.find(r => r.get('Setting Name') === name)?.get('Value');
      
      const globalShiftStart = getSetting('Shift Start') || '09:00 AM';
      const gracePeriod = parseInt(getSetting('Late Grace Period') || '15');
      
      // Personal Override or Global
      const personalShiftStart = empRow?.get('Shift Start');
      const activeShiftStart = personalShiftStart || globalShiftStart;

      // Parse time (handles 12h/24h)
      const [time, modifier] = activeShiftStart.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;

      const shiftDate = new Date(now);
      shiftDate.setHours(hours, minutes, 0, 0);
      
      const graceLimit = new Date(shiftDate.getTime() + gracePeriod * 60000);
      const status = now > graceLimit ? 'Late' : 'On Time';

      const name = `${empRow?.get('First Name') || ''} ${empRow?.get('Last Name') || ''}`.trim();
      const dept = empRow?.get('Department') || '';
      
      // Upload biometric photo to Vercel Blob if provided
      let photoUrl = '';
      if (photo) {
        try {
          const blob = await put(`attendance/${employeeNo}_${Date.now()}.jpg`, Buffer.from(photo.split(',')[1], 'base64'), {
            access: 'public',
            contentType: 'image/jpeg'
          });
          photoUrl = blob.url;
        } catch (blobErr) {
          console.error('Blob upload failed:', blobErr);
        }
      }

      await attSheet.addRow({
        'ID': `ATT-${Date.now()}`,
        'Employee No.': employeeNo,
        'Name': name,
        'Department': dept,
        'Date': todayStr,
        'Time In': now.toISOString(),
        'Status': status,
        'Location': `LAT: ${lat.toFixed(6)}, LNG: ${lng.toFixed(6)}`,
        'Photo': photoUrl
      });

      return NextResponse.json({ 
        success: true, 
        message: status === 'Late' 
          ? `Clocked in. Status: LATE (Shift: ${activeShiftStart})` 
          : 'Clocked in successfully. Status: ON TIME' 
      });
    } else {
      // Clock Out
      const rows = await attSheet.getRows();
      const record = rows.find(r => 
        r.get('Employee No.')?.toString() === employeeNo.toString() &&
        r.get('Date')?.toString().includes(todayStr) &&
        !r.get('Time Out')
      );

      if (!record) return NextResponse.json({ success: false, message: 'No active clock-in found for today.' });

      // --- Accomplishment Check ---
      const accSheet = doc.sheetsByTitle[SHEET_NAMES.ACCOMPLISHMENTS];
      if (accSheet) {
        const accRows = await accSheet.getRows();
        const hasReport = accRows.some(r => 
          r.get('Employee No.')?.toString() === employeeNo.toString() &&
          r.get('Date') === todayStr
        );

        if (!hasReport) {
          return NextResponse.json({ 
            success: false, 
            message: 'Operational protocol violation: You must submit your Accomplishment Report before clocking out.' 
          }, { status: 403 });
        }
      }

      const timeIn = new Date(record.get('Time In'));
      const hours = Math.round(((now.getTime() - timeIn.getTime()) / 3600000) * 100) / 100;

      record.set('Time Out', now.toISOString());
      record.set('Hours', hours);
      await record.save();

      return NextResponse.json({ success: true, message: `Clocked out. Hours worked: ${hours}` });
    }
  } catch (e: unknown) {
    const error = e as Error;
    console.error(error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
