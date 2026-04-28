import { getDoc, SHEET_NAMES } from './googleSheets';
import { EventEmitter } from 'events';
import { Resend } from 'resend';

// Initialize Resend (Optional - will only send if API key exists)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export const notificationEvents = new EventEmitter();

/**
 * Base function for a single notification
 */
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

    // 1. Save to Sheet
    if (sheet) {
      await sheet.addRow({
        'ID': `NOTIF-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        'Employee No.': userId,
        'Title': title,
        'Message': message,
        'Type': type,
        'Status': 'Unread',
        'Created At': new Date().toISOString()
      });
    }

    // 2. Real-time Broadcast
    notificationEvents.emit('notification', { userId, title, message, type, createdAt: new Date().toISOString() });

    // 3. Real Email Delivery
    if (email && resend) {
      resend.emails.send({
        from: 'Summit Enterprise <notifications@summit-hris.app>',
        to: email,
        subject: `[SUMMIT] ${title}`,
        text: message,
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #ca8a04;">${title}</h2>
            <p style="color: #333; font-size: 16px;">${message}</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="color: #999; font-size: 12px;">This is an automated operational briefing from Summit Enterprise.</p>
          </div>
        `
      }).catch(e => console.error('Email Send Error:', e));
    }

    return true;
  } catch (error) {
    console.error('Notification Error:', error);
    return false;
  }
}

/**
 * HIGH-SPEED BULK NOTIFICATION
 * Optimizes performance by batch-saving rows to Google Sheets
 */
export async function bulkSendNotifications(
  notifications: { userId: string; title: string; message: string; type?: any; email?: string }[]
) {
  if (notifications.length === 0) return true;

  try {
    const doc = await getDoc();
    let sheet = doc.sheetsByTitle[SHEET_NAMES.NOTIFICATIONS];
    
    if (!sheet) {
      sheet = await doc.addSheet({ 
        title: SHEET_NAMES.NOTIFICATIONS, 
        headerValues: ['ID', 'Employee No.', 'Title', 'Message', 'Type', 'Status', 'Created At'] 
      });
    }

    // 1. Prepare batch data
    const rows = notifications.map(n => ({
      'ID': `NOTIF-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      'Employee No.': n.userId,
      'Title': n.title,
      'Message': n.message,
      'Type': n.type || 'INFO',
      'Status': 'Unread',
      'Created At': new Date().toISOString()
    }));

    // 2. Optimized Bulk Save (ONE request instead of many)
    if (sheet) {
      await sheet.addRows(rows);
    }

    // 3. Emit events and trigger emails
    notifications.forEach(n => {
      notificationEvents.emit('notification', { ...n, createdAt: new Date().toISOString() });
      
      if (n.email && resend) {
        resend.emails.send({
          from: 'Summit Enterprise <notifications@summit-hris.app>',
          to: n.email,
          subject: `[SUMMIT] ${n.title}`,
          text: n.message,
        }).catch(err => console.error('Bulk Email Fail:', err));
      }
    });

    return true;
  } catch (error) {
    console.error('Bulk Notification Error:', error);
    return false;
  }
}

export async function notifyRoles(
  roles: string[],
  title: string,
  message: string,
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' = 'INFO'
) {
  try {
    const doc = await getDoc();
    const empSheet = doc.sheetsByTitle[SHEET_NAMES.EMPLOYEES];
    const empRows = await empSheet.getRows();
    
    const targets = empRows
      .filter(row => {
        const userRole = row.get('Role')?.toUpperCase();
        return roles.some(r => r.toUpperCase() === userRole) && row.get('Status') === 'Active';
      })
      .map(user => ({
        userId: user.get('Employee No.'),
        title,
        message,
        type,
        email: user.get('Updated Email Address') || user.get('Email Address')
      }));

    return await bulkSendNotifications(targets);
  } catch (error) {
    console.error('NotifyRoles Error:', error);
    return false;
  }
}

export async function notifyAll(
  title: string,
  message: string,
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' = 'INFO'
) {
  try {
    const doc = await getDoc();
    const empSheet = doc.sheetsByTitle[SHEET_NAMES.EMPLOYEES];
    const empRows = await empSheet.getRows();
    
    const targets = empRows
      .filter(row => row.get('Status') === 'Active' && row.get('Employee No.'))
      .map(emp => ({
        userId: emp.get('Employee No.'),
        title,
        message,
        type,
        email: emp.get('Updated Email Address') || emp.get('Email Address')
      }));

    return await bulkSendNotifications(targets);
  } catch (error) {
    console.error('NotifyAll Error:', error);
    return false;
  }
}
