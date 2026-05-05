/**
 * SUMMIT HRIS - DATABASE KERNEL (MOCK MODE)
 * The Google Sheets connection has been 'cut' to transition to a high-speed placeholder layer.
 */

import { 
  MOCK_EMPLOYEES, 
  MOCK_ATTENDANCE, 
  MOCK_LEAVE, 
  MOCK_EVENTS, 
  MOCK_SETTINGS, 
  MOCK_AUDIT 
} from './mockData';

// Legacy sheet names preserved for compatibility
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
  RECRUITMENT: "Recruitment Pipeline",
  SCHEDULES: "Employee Schedules",
  OFFBOARDING: "Offboarding Registry",
  SETTINGS: "Global Settings",
};

/**
 * Mock Row implementation to mirror google-spreadsheet behavior
 */
class MockRow {
  private _data: any;
  constructor(data: any) {
    this._data = data;
  }
  get(key: string) {
    // Map sheet headers to mock data keys
    const mapping: any = {
      'ID': 'id',
      'Employee No.': 'employeeNo',
      'Name': 'name',
      'First Name': 'firstName',
      'Last Name': 'lastName',
      'Email Address': 'email',
      'Department': 'department',
      'Position': 'position',
      'Role': 'role',
      'Status': 'status',
      'Profile Photo': 'photo',
      'Password Hash': 'passwordHash',
      'Shift Start': 'shiftStart',
      'Shift End': 'shiftEnd',
      'Work Latitude': 'workLat',
      'Work Longitude': 'workLng',
      'Work Radius': 'workRadius',
      'Reports To': 'reportsTo',
      'Date': 'date',
      'Time In': 'timeIn',
      'Time Out': 'timeOut',
      'Type': 'type',
      'Leave Type': 'type',
      'Start Date': 'startDate',
      'End Date': 'endDate',
      'Days': 'days',
      'Reason': 'reason',
      'Title': 'title',
      'Location': 'location',
      'Timestamp': 'timestamp',
      'Action': 'action',
      'Details': 'details',
      'Severity': 'severity'
    };
    const mappedKey = mapping[key] || key;
    return this._data[mappedKey];
  }
  set(key: string, val: any) {
    const mapping: any = { 'Employee No.': 'employeeNo', 'Status': 'status' }; 
    const mappedKey = mapping[key] || key;
    this._data[mappedKey] = val;
  }
  async save() {
    console.log('[MOCK_DB] Record synchronized.');
    return Promise.resolve();
  }
}

/**
 * Mock Sheet implementation
 */
class MockSheet {
  private _data: any[];
  constructor(data: any[]) {
    this._data = data;
  }
  async getRows() {
    return this._data.map(d => new MockRow(d));
  }
  async addRow(data: any) {
    this._data.push(data);
    return new MockRow(data);
  }
}

/**
 * Mock Document implementation (The 'Cord Cutter')
 */
class MockDoc {
  public sheetsByTitle: any = {};
  
  constructor() {
    this.sheetsByTitle[SHEET_NAMES.EMPLOYEES] = new MockSheet(MOCK_EMPLOYEES);
    this.sheetsByTitle[SHEET_NAMES.ATTENDANCE] = new MockSheet(MOCK_ATTENDANCE);
    this.sheetsByTitle[SHEET_NAMES.LEAVE] = new MockSheet(MOCK_LEAVE);
    this.sheetsByTitle[SHEET_NAMES.CALENDAR] = new MockSheet(MOCK_EVENTS);
    this.sheetsByTitle[SHEET_NAMES.SETTINGS] = new MockSheet([MOCK_SETTINGS]);
    this.sheetsByTitle[SHEET_NAMES.COMPLIANCE] = new MockSheet(MOCK_AUDIT);
  }

  async loadInfo() {
    return Promise.resolve();
  }
}

export const getDoc = async () => {
  console.log('[SYSTEM_NOTICE] Application running in STATIC MOCK MODE. External DB connection is inactive.');
  return new MockDoc();
};
