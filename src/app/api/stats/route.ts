import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDoc, SHEET_NAMES } from '@/lib/googleSheets';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    const isAdmin = ['ADMIN', 'SUPERADMIN', 'HR'].includes(user.role?.toUpperCase());

    const doc = await getDoc();
    const empSheet = doc.sheetsByTitle[SHEET_NAMES.EMPLOYEES];
    const leaveSheet = doc.sheetsByTitle[SHEET_NAMES.LEAVE];
    const okrSheet = doc.sheetsByTitle[SHEET_NAMES.OKR];
    const attendSheet = doc.sheetsByTitle[SHEET_NAMES.ATTENDANCE];
    const calendarSheet = doc.sheetsByTitle[SHEET_NAMES.CALENDAR];

    const today = new Date().toISOString().split('T')[0];

    // 1. Employee Stats
    const empRows = await empSheet.getRows();
    const active = empRows.filter((r) => r.get('Status')?.toLowerCase() === 'active');
    
    // 2. Attendance Stats
    const attendRows = attendSheet ? await attendSheet.getRows() : [];
    const isClockedIn = attendRows.some(
      (r) => 
        r.get('Employee No.')?.toString() === user.employeeNo?.toString() &&
        r.get('Date') === today &&
        !r.get('Time Out')
    );

    // Global Attendance for Admin
    const uniqueAttendees = new Set(
      attendRows
        .filter(r => r.get('Date') === today)
        .map(r => r.get('Employee No.')?.toString())
    );

    // 3. Leave Stats
    const leaveRows = await leaveSheet.getRows();
    let pendingLeave = 0;
    let onLeaveToday = 0;
    
    leaveRows.forEach((r) => {
      const st = r.get('Status')?.toLowerCase();
      if (st === 'pending') pendingLeave++;
      
      if (st === 'approved') {
        const start = r.get('Start Date');
        const end = r.get('End Date');
        if (today >= start && today <= end) {
          onLeaveToday++;
        }
      }
    });

    // 4. Calendar Stats
    const calendarRows = calendarSheet ? await calendarSheet.getRows() : [];
    const eventsToday = calendarRows.filter(r => {
      const start = r.get('Start Date');
      const end = r.get('End Date');
      return today >= start && today <= end;
    }).length;

    // 5. OKR Stats for Current User
    const okrRows = okrSheet ? await okrSheet.getRows() : [];
    const okrSummary = { avgProgress: 0, activeCount: 0 };
    const myKRs = okrRows.filter(
      (r) => r.get('Employee No.')?.toString() === user.employeeNo?.toString() && r.get('Parent ID')
    );

    if (myKRs.length > 0) {
      let totalPct = 0;
      myKRs.forEach((kr) => {
        const tar = parseFloat(kr.get('Target')) || 1;
        const cur = parseFloat(kr.get('Current')) || 0;
        totalPct += Math.min(100, Math.max(0, (cur / tar) * 100));
      });
      okrSummary.avgProgress = Math.round(totalPct / myKRs.length);
      okrSummary.activeCount = myKRs.length;
    }

    return NextResponse.json({
      success: true,
      // Global Metrics (Visible to Admin)
      global: isAdmin ? {
        activeEmployees: active.length,
        attendanceToday: uniqueAttendees.size,
        notLoggedIn: active.length - uniqueAttendees.size,
        onLeaveToday,
        pendingLeave,
        eventsToday
      } : null,
      // User Specific Metrics
      personal: {
        isClockedIn,
        okrProgress: okrSummary.avgProgress,
        summitLevel: okrSummary.avgProgress >= 90 ? 'Elite' : okrSummary.avgProgress >= 70 ? 'Advanced' : 'Basic'
      }
    });
  } catch (e: any) {
    console.error('Stats API Error:', e);
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}
