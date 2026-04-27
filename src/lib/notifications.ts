import { getDoc, SHEET_NAMES } from './googleSheets';
import { EventEmitter } from 'events';

// Global event emitter for real-time SSE updates
// In Next.js dev mode, this might reset on HMR, but in production/persistent server it works
export const notificationEvents = new EventEmitter();

export async function sendNotification(
  userId: string, 
  title: string, 
  message: string, 
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' = 'INFO',
  email?: string
) {
  try {
    const doc = await getDoc();
    let sheet = doc.sheetsByTitle[SHEET_NAMES.NOTIFICATIONS];
    
    if (!sheet) {
      sheet = await doc.addSheet({ 
        title: SHEET_NAMES.NOTIFICATIONS, 
        headerValues: ['ID', 'Employee No.', 'Title', 'Message', 'Type', 'Status', 'Created At'] 
      });
    }

    if (sheet) {
      await sheet.addRow({
        'ID': `NOTIF-${Date.now()}`,
        'Employee No.': userId,
        'Title': title,
        'Message': message,
        'Type': type,
        'Status': 'Unread',
        'Created At': new Date().toISOString()
      });
    }

    // Broadcast to active SSE streams
    notificationEvents.emit('notification', { userId, title, message, type, createdAt: new Date().toISOString() });

    // Email logic (Placeholder for now)
    if (email) {
      console.log(`[EMAIL NOTIFICATION] To: ${email} | Subject: ${title} | Body: ${message}`);
    }

    return true;
  } catch (error) {
    console.error('Notification Error:', error);
    return false;
  }
}

/**
 * Sends a notification to all users with specific roles
 */
export async function notifyRoles(
  roles: string[],
  title: string,
  message: string,
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' = 'INFO'
) {
  try {
    const doc = await getDoc();
    const accessSheet = doc.sheetsByTitle[SHEET_NAMES.ACCESS];
    const accessRows = await accessSheet.getRows();
    
    // Filter rows by role (case-insensitive)
    const targetUsers = accessRows.filter(row => {
      const userRole = row.get('Role')?.toUpperCase();
      return roles.some(r => r.toUpperCase() === userRole) && row.get('Status') !== 'Inactive';
    });

    const promises = targetUsers.map(user => 
      sendNotification(user.get('Employee No.'), title, message, type, user.get('Email'))
    );

    await Promise.all(promises);
    return true;
  } catch (error) {
    console.error('NotifyRoles Error:', error);
    return false;
  }
}

/**
 * Sends a notification to all active employees
 */
export async function notifyAll(
  title: string,
  message: string,
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' = 'INFO'
) {
  try {
    const doc = await getDoc();
    const empSheet = doc.sheetsByTitle[SHEET_NAMES.EMPLOYEES];
    const empRows = await empSheet.getRows();
    
    const activeEmployees = empRows.filter(row => 
      row.get('Status') !== 'Inactive' && 
      row.get('Status') !== 'Resigned' && 
      row.get('Employee No.')
    );

    const promises = activeEmployees.map(emp => 
      sendNotification(emp.get('Employee No.'), title, message, type, emp.get('Personal Email') || emp.get('Work Email'))
    );

    await Promise.all(promises);
    return true;
  } catch (error) {
    console.error('NotifyAll Error:', error);
    return false;
  }
}
