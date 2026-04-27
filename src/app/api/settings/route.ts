import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDoc, SHEET_NAMES } from '@/lib/googleSheets';

const SETTINGS_SHEET_NAME = "Global Settings";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const doc = await getDoc();
    let sheet = doc.sheetsByTitle[SETTINGS_SHEET_NAME];
    
    if (!sheet) {
      // Create if missing
      sheet = await doc.addSheet({ 
        title: SETTINGS_SHEET_NAME, 
        headerValues: ['Setting Name', 'Value', 'Description', 'Last Updated', 'Updated By'] 
      });
      
      // Seed default values
      await sheet.addRows([
        { 'Setting Name': 'Global Latitude', 'Value': '14.5995', 'Description': 'Default HQ Latitude' },
        { 'Setting Name': 'Global Longitude', 'Value': '120.9842', 'Description': 'Default HQ Longitude' },
        { 'Setting Name': 'Global Radius', 'Value': '100', 'Description': 'Default Geofence Radius in meters' },
        { 'Setting Name': 'Shift Start', 'Value': '09:00 AM', 'Description': 'Standard shift start time' },
        { 'Setting Name': 'Shift End', 'Value': '06:00 PM', 'Description': 'Standard shift end time' },
        { 'Setting Name': 'Late Grace Period', 'Value': '15', 'Description': 'Grace period in minutes' },
      ]);
    }

    const rows = await sheet.getRows();
    const settings = rows.map(r => ({
      name: r.get('Setting Name'),
      value: r.get('Value'),
      description: r.get('Description'),
      lastUpdated: r.get('Last Updated'),
      updatedBy: r.get('Updated By'),
    }));

    return NextResponse.json({ success: true, settings });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const user = session.user as any;
    const isAdmin = ['ADMIN', 'SUPERADMIN', 'HR'].includes(user.role?.toUpperCase());
    if (!isAdmin) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });

    const { settings } = await request.json(); // Array of { name, value }

    const doc = await getDoc();
    const sheet = doc.sheetsByTitle[SETTINGS_SHEET_NAME];
    const rows = await sheet.getRows();

    for (const s of settings) {
      const row = rows.find(r => r.get('Setting Name') === s.name);
      if (row) {
        row.set('Value', s.value);
        row.set('Last Updated', new Date().toISOString());
        row.set('Updated By', user.employeeNo);
        await row.save();
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
