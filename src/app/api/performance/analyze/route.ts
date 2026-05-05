import { NextResponse } from 'next/server';
import { SHEET_NAMES } from '@/lib/googleSheets';
import { withAdmin } from '@/lib/apiUtils';

/**
 * AI Performance Analysis Endpoint
 * This endpoint cross-references OKRs with Attendance to provide "Neuro-Intelligence"
 * Updated to include Security Anomaly Detection from the Forensic Ledger.
 */
export async function GET(request: Request) {
  return withAdmin(async (session, doc) => {
    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');

    const okrSheet = doc.sheetsByTitle[SHEET_NAMES.OKR];
    const attendanceSheet = doc.sheetsByTitle[SHEET_NAMES.ATTENDANCE];
    const empSheet = doc.sheetsByTitle[SHEET_NAMES.EMPLOYEES];
    const complianceSheet = doc.sheetsByTitle[SHEET_NAMES.COMPLIANCE];

    const [okrRows, attRows, empRows, complianceRows] = await Promise.all([
      okrSheet.getRows(),
      attendanceSheet.getRows(),
      empSheet.getRows(),
      complianceSheet ? complianceSheet.getRows() : Promise.resolve([])
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

      // Security Anomaly Detection (Forensic Sync)
      const userFailures = complianceRows.filter(r => 
        r.get('Target No.')?.toString() === empNo && 
        r.get('Action') === 'BIOMETRIC_FAILURE'
      );
      const securityRisk = userFailures.length;

      // AI "Neuro" Scoring Logic
      let healthScore = 100;
      let status = 'Stable';
      let insight = 'Operating at optimal capacity.';

      if (securityRisk > 0) {
        healthScore = Math.max(10, 50 - (securityRisk * 15));
        status = 'Identity Risk';
        insight = `Detected ${securityRisk} biometric verification failures. Immediate identity audit recommended.`;
      } else if (avgProgress > 0.8 && reliability < 0.6) {
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
        photo: emp.get('Profile Photo') || '',
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
  });
}
