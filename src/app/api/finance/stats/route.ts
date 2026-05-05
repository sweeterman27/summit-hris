import { NextResponse } from 'next/server';
import { withAdmin } from '@/lib/apiUtils';

/**
 * MOCK Financial Intelligence Engine
 * Provides realistic-looking payroll projections for the UI while the full 
 * CHRONICLE-integrated calculation engine is being developed.
 */
export async function GET() {
  return withAdmin(async () => {
    // Simulated calculations for the current month
    const mockData = {
      success: true,
      month: new Date().toLocaleString('default', { month: 'long' }),
      totalProjected: 1245750,
      departmentBreakdown: {
        'Engineering': 540000,
        'Operations': 320000,
        'Sales': 210000,
        'HR & Admin': 175750
      },
      projections: [
        { employeeNo: 'EMP-001', name: 'John Doe', daysWorked: 18, projectedEarnings: 45000 },
        { employeeNo: 'EMP-012', name: 'Jane Smith', daysWorked: 20, projectedEarnings: 38500 },
        { employeeNo: 'EMP-045', name: 'Alex River', daysWorked: 15, projectedEarnings: 32000 },
        { employeeNo: 'EMP-009', name: 'Sam Stone', daysWorked: 21, projectedEarnings: 31000 },
        { employeeNo: 'EMP-022', name: 'Sarah Lee', daysWorked: 19, projectedEarnings: 29500 }
      ]
    };

    return NextResponse.json(mockData);
  });
}
