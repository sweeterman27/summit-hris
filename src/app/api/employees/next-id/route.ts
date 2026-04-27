import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDoc, SHEET_NAMES } from '@/lib/googleSheets';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const doc = await getDoc();
    const sheet = doc.sheetsByTitle[SHEET_NAMES.EMPLOYEES];
    const rows = await sheet.getRows();
    
    const ids = rows
      .map(r => r.get('Employee No.'))
      .filter(id => id && typeof id === 'string' && id.startsWith('ZK-'));

    if (ids.length === 0) {
      return NextResponse.json({ success: true, nextId: 'ZK-0001' });
    }

    // Extract numbers, find max, increment
    const numbers = ids.map(id => parseInt(id.replace('ZK-', ''))).filter(n => !isNaN(n));
    const maxNum = Math.max(...numbers);
    const nextNum = maxNum + 1;
    const nextId = `ZK-${nextNum.toString().padStart(4, '0')}`;

    return NextResponse.json({ success: true, nextId });
  } catch (error: any) {
    console.error('Next ID API Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
