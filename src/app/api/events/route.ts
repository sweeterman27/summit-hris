import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDoc, SHEET_NAMES } from '@/lib/googleSheets';
import { sendNotification } from '@/lib/notifications';

async function notifyCollaborators(collaboratorNames: string, title: string, date: string, location: string, type: string) {
  if (!collaboratorNames) return;

  try {
    const doc = await getDoc();
    const empSheet = doc.sheetsByTitle[SHEET_NAMES.EMPLOYEES];
    const empRows = await empSheet.getRows();
    
    const names = collaboratorNames.split(',').map(n => n.trim());
    
    for (const name of names) {
      const emp = empRows.find(r => `${r.get('First Name')} ${r.get('Last Name')}` === name);
      if (emp) {
        const empNo = emp.get('Employee No.');
        const email = emp.get('Email');
        const message = `You have been tagged in a new ${type}: "${title}" on ${date}${location ? ` at ${location}` : ''}.`;
        
        await sendNotification(empNo, `Event: ${title}`, message, 'INFO', email);
      }
    }
  } catch (err) {
    console.error('Failed to notify collaborators:', err);
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // Expecting '2026-04'
    const upcoming = searchParams.get('upcoming') === 'true';
    
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle[SHEET_NAMES.CALENDAR];
    if (!sheet) return NextResponse.json({ success: true, events: [] });

    const rows = await sheet.getRows();
    let events = rows.map(r => ({
      id: r.get('ID'),
      title: r.get('Title'),
      description: r.get('Remarks') || '',
      startDate: r.get('StartDate'),
      endDate: r.get('EndDate'),
      startTime: r.get('StartTime'),
      endTime: r.get('EndTime'),
      type: r.get('Type'), 
      priority: r.get('Category') || 'Medium',
      location: r.get('Location') || '',
      collaborators: r.get('Collaborators') || '',
      createdBy: r.get('CreatedBy'),
    }));

    if (month) {
      events = events.filter(e => e.startDate?.startsWith(month));
    } else if (upcoming) {
      const today = new Date().toISOString().split('T')[0];
      events = events
        .filter(e => e.startDate >= today)
        .sort((a, b) => a.startDate.localeCompare(b.startDate))
        .slice(0, 10);
    }

    return NextResponse.json({ success: true, events });
  } catch (e: unknown) {
    const error = e as Error;
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as { role?: string; name?: string } | undefined;
    
    if (!['ADMIN', 'SUPERADMIN', 'HR'].includes(user?.role?.toUpperCase() || '')) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const payload = await request.json();
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle[SHEET_NAMES.CALENDAR];
    
    if (!sheet) throw new Error('Calendar sheet not found in database.');

    const id = `EVT-${Date.now()}`;
    await sheet.addRow({
      'ID': id,
      'Title': payload.title,
      'Remarks': payload.description || '',
      'StartDate': payload.startDate,
      'EndDate': payload.endDate,
      'StartTime': payload.startTime || '',
      'EndTime': payload.endTime || '',
      'Type': payload.type || 'Event',
      'Category': payload.priority || 'Medium',
      'Location': payload.location || '',
      'Collaborators': payload.collaborators || '',
      'CreatedBy': user?.name || 'System',
      'Timestamp': new Date().toISOString()
    });

    // Notify collaborators in background
    notifyCollaborators(payload.collaborators, payload.title, payload.startDate, payload.location, payload.type);

    return NextResponse.json({ success: true, id });
  } catch (e: unknown) {
    const error = e as Error;
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as { role?: string } | undefined;
    
    if (!['ADMIN', 'SUPERADMIN', 'HR'].includes(user?.role?.toUpperCase() || '')) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const { id, ...updates } = await request.json();
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle[SHEET_NAMES.CALENDAR];
    const rows = await sheet.getRows();
    const row = rows.find(r => r.get('ID') === id);

    if (!row) return NextResponse.json({ success: false, message: 'Event not found' }, { status: 404 });

    if (updates.title) row.set('Title', updates.title);
    if (updates.description) row.set('Remarks', updates.description);
    if (updates.startDate) row.set('StartDate', updates.startDate);
    if (updates.endDate) row.set('EndDate', updates.endDate);
    if (updates.startTime) row.set('StartTime', updates.startTime);
    if (updates.endTime) row.set('EndTime', updates.endTime);
    if (updates.type) row.set('Type', updates.type);
    if (updates.priority) row.set('Category', updates.priority);
    if (updates.location) row.set('Location', updates.location);
    if (updates.collaborators) row.set('Collaborators', updates.collaborators);
    
    await row.save();

    // Notify updated collaborators
    if (updates.collaborators) {
      notifyCollaborators(updates.collaborators, updates.title || row.get('Title'), updates.startDate || row.get('StartDate'), updates.location || row.get('Location'), updates.type || row.get('Type'));
    }

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const error = e as Error;
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    
    if (!['ADMIN', 'SUPERADMIN', 'HR'].includes(user?.role?.toUpperCase())) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle[SHEET_NAMES.CALENDAR];
    const rows = await sheet.getRows();
    const row = rows.find(r => r.get('ID') === id);

    if (row) await row.delete();

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const error = e as Error;
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
