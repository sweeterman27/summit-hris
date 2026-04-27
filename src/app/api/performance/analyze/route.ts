import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDoc, SHEET_NAMES } from '@/lib/googleSheets';

/**
 * AI Performance Analysis Endpoint
 * This endpoint cross-references OKRs with Attendance to provide "Neuro-Intelligence"
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const user = session.user as any;
    if (!['ADMIN', 'SUPERADMIN', 'HR'].includes(user.role?.toUpperCase())) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');

    const doc = await getDoc();
    const okrSheet = doc.sheetsByTitle[SHEET_NAMES.OKR];
    const attendanceSheet = doc.sheetsByTitle[SHEET_NAMES.ATTENDANCE];
    const empSheet = doc.sheetsByTitle[SHEET_NAMES.EMPLOYEES];

    const [okrRows, attRows, empRows] = await Promise.all([
      okrSheet.getRows(),
      attendanceSheet.getRows(),
      empSheet.getRows()
    ]);

    // 1. Filter by department if needed
    let targetEmployees = empRows;
    if (department) {
      targetEmployees = empRows.filter(r => r.get('Department') === department);
    }

    const report = targetEmployees.map(emp => {
      const empNo = emp.get('Employee No.').toString();
      const name = `${emp.get('First Name')} ${emp.get('Last Name')}`;
      
      // Calculate OKR Completion Rate
      const userOkrs = okrRows.filter(r => r.get('Employee No.').toString() === empNo);
      const avgProgress = userOkrs.length > 0 
        ? userOkrs.reduce((acc, curr) => acc + (parseFloat(curr.get('Current')) / parseFloat(curr.get('Target'))), 0) / userOkrs.length 
        : 0;

      // Calculate Attendance Reliability (Last 30 days)
      const userAtt = attRows.filter(r => r.get('Employee No.').toString() === empNo);
      const onTimeCount = userAtt.filter(r => r.get('Status') === 'On Time').length;
      const reliability = userAtt.length > 0 ? (onTimeCount / userAtt.length) : 1;

      // AI "Neuro" Scoring Logic
      let healthScore = 100;
      let status = 'Stable';
      let insight = 'Operating at optimal capacity.';

      if (avgProgress > 0.8 && reliability < 0.6) {
        healthScore = 45;
        status = 'Burnout Warning';
        insight = 'High output coupled with declining attendance reliability. High risk of burnout.';
      } else if (avgProgress < 0.3 && reliability < 0.7) {
        healthScore = 30;
        status = 'Engagement Drop';
        insight = 'Low output and erratic attendance. Potential flight risk detected.';
      } else if (avgProgress > 0.9 && reliability > 0.9) {
        healthScore = 95;
        status = 'Elite Performer';
        insight = 'Exceptional alignment and consistency. Ready for expansion roles.';
      }

      return {
        employeeNo: empNo,
        name,
        department: emp.get('Department'),
        healthScore,
        status,
        insight,
        metrics: {
          okrProgress: Math.round(avgProgress * 100),
          reliability: Math.round(reliability * 100)
        }
      };
    });

    return NextResponse.json({ success: true, report });
  } catch (e: unknown) {
    const error = e as Error;
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
