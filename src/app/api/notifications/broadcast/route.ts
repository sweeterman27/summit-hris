import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendNotification, notifyAll, notifyRoles } from '@/lib/notifications';

/**
 * Superadmin Broadcast API
 * Allows high-level dispatch of operational briefings
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const user = session.user as any;
    const isAdmin = ['ADMIN', 'SUPERADMIN', 'HR'].includes(user.role?.toUpperCase());

    if (!isAdmin) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });

    const { target, targetValue, title, message, type } = await request.json();

    if (!title || !message) {
      return NextResponse.json({ success: false, message: 'Title and message are required' }, { status: 400 });
    }

    let result = false;

    switch (target) {
      case 'ALL':
        result = await notifyAll(title, message, type);
        break;
      case 'ROLE':
        result = await notifyRoles([targetValue], title, message, type);
        break;
      case 'INDIVIDUAL':
        result = await sendNotification(targetValue, title, message, type);
        break;
      default:
        return NextResponse.json({ success: false, message: 'Invalid target' }, { status: 400 });
    }

    if (result) {
      return NextResponse.json({ success: true, message: 'Broadcast synchronized successfully' });
    } else {
      throw new Error('Notification dispatch failed');
    }
  } catch (e: unknown) {
    const error = e as Error;
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
