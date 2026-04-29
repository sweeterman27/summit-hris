import { getDoc, SHEET_NAMES } from './googleSheets';

export type AuditAction = 
  | 'CREDENTIAL_RESET' 
  | 'PROFILE_UPDATE' 
  | 'SECURITY_LOGIN' 
  | 'GEOFENCE_MODIFICATION' 
  | 'ADMIN_ACTION';

/**
 * Log a high-integrity security event to the Compliance Registry
 */
export async function logAudit(
  actorNo: string,
  targetNo: string,
  action: AuditAction,
  details: string,
  severity: 'INFO' | 'WARNING' | 'CRITICAL' = 'INFO'
) {
  try {
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle[SHEET_NAMES.COMPLIANCE];
    
    if (!sheet) {
      console.error('Compliance sheet not found for audit logging');
      return;
    }

    await sheet.addRow({
      'Timestamp': new Date().toISOString(),
      'Actor No.': actorNo,
      'Target No.': targetNo,
      'Action': action,
      'Details': details,
      'Severity': severity,
      'IP Address': 'SYSTEM_INTERNAL', // Could be expanded to capture client IP
      'Status': 'VERIFIED'
    });

    console.log(`[AUDIT_LOG] ${action} recorded for Actor: ${actorNo}`);
  } catch (error) {
    console.error('Audit Logging Error:', error);
  }
}
