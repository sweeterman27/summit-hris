import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

const SPREADSHEET_ID = process.env.NEXT_PUBLIC_SPREADSHEET_ID;
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!SPREADSHEET_ID) {
  throw new Error('NEXT_PUBLIC_SPREADSHEET_ID is not defined');
}

// Service account authentication
const serviceAccountAuth = new JWT({
  email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: GOOGLE_PRIVATE_KEY,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

export const getDoc = async () => {
  const doc = new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccountAuth);
  await doc.loadInfo();
  return doc;
};

// Sheet names from legacy Code.gs
export const SHEET_NAMES = {
  EMPLOYEES: "ACTIVE EMPLOYEE DATABASE",
  ARCHIVE: "EMPLOYEE ARCHIVES",
  LEAVE_BALANCES: "LEAVE BALANCES",
  LEAVE: "Leave Requests",
  ATTENDANCE: "Attendance Logs",
  ACCESS: "Access Control",
  NOTIFICATIONS: "Notifications",
  OKR: "OKR Database",
  PERFORMANCE: "Performance Reviews",
  DOCUMENTS: "Document Storage",
  COMPLIANCE: "Compliance Logs",
  CALENDAR: "Calendar",
  ANNOUNCEMENTS: "Announcements",
  ACCOMPLISHMENTS: "Accomplishment Registry",
};
