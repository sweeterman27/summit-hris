/**
 * SUMMIT HRIS - MOCK DATA KERNEL
 * Used to power the application without a Google Sheets connection.
 */

// SHA-256 hash for 'password123'
const MOCK_PASSWORD_HASH = 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f';

export const MOCK_EMPLOYEES = [
  {
    employeeNo: 'SA-001',
    firstName: 'SUMMIT',
    lastName: 'SUPERADMIN',
    email: 'admin@summit-enterprise.com',
    role: 'Superadmin',
    department: 'EXECUTIVE',
    position: 'System Sovereign',
    status: 'Active',
    photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop',
    passwordHash: MOCK_PASSWORD_HASH,
    shiftStart: '09:00 AM',
    shiftEnd: '06:00 PM',
    workLat: '14.5995',
    workLng: '120.9842',
    workRadius: '100',
    okrProgress: 100,
    summitLevel: 'Diamond'
  },
  {
    employeeNo: 'ADM-001',
    firstName: 'TEST',
    lastName: 'ADMIN',
    email: 'test-admin@summit.com',
    role: 'Admin',
    department: 'OPERATIONS',
    position: 'Operations Admin',
    status: 'Active',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
    passwordHash: MOCK_PASSWORD_HASH,
    shiftStart: '09:00 AM',
    shiftEnd: '06:00 PM',
    workLat: '14.5995',
    workLng: '120.9842',
    workRadius: '100',
    okrProgress: 85,
    summitLevel: 'Platinum'
  },
  {
    employeeNo: 'HR-001',
    firstName: 'TEST',
    lastName: 'HR',
    email: 'test-hr@summit.com',
    role: 'HR',
    department: 'HUMAN RESOURCES',
    position: 'HR Manager',
    status: 'Active',
    photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop',
    passwordHash: MOCK_PASSWORD_HASH,
    shiftStart: '09:00 AM',
    shiftEnd: '06:00 PM',
    workLat: '14.5995',
    workLng: '120.9842',
    workRadius: '100',
    okrProgress: 90,
    summitLevel: 'Diamond'
  },
  {
    employeeNo: 'MGR-001',
    firstName: 'TEST',
    lastName: 'MANAGER',
    email: 'test-manager@summit.com',
    role: 'Manager',
    department: 'TECHNOLOGY',
    position: 'Project Manager',
    status: 'Active',
    photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop',
    passwordHash: MOCK_PASSWORD_HASH,
    shiftStart: '09:00 AM',
    shiftEnd: '06:00 PM',
    workLat: '14.5995',
    workLng: '120.9842',
    workRadius: '100',
    okrProgress: 75,
    summitLevel: 'Gold'
  },
  {
    employeeNo: 'EMP-001',
    firstName: 'TEST',
    lastName: 'EMPLOYEE',
    email: 'test-employee@summit.com',
    role: 'Employee',
    department: 'CREATIVE',
    position: 'Junior Designer',
    status: 'Active',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    passwordHash: MOCK_PASSWORD_HASH,
    shiftStart: '09:00 AM',
    shiftEnd: '06:00 PM',
    workLat: '14.5995',
    workLng: '120.9842',
    workRadius: '100',
    okrProgress: 60,
    summitLevel: 'Silver'
  }
];

export const MOCK_ATTENDANCE = [
  // SA-001 History
  { id: 'att-001', employeeNo: 'SA-001', date: '2026-05-04', timeIn: '08:45 AM', timeOut: '06:15 PM', hours: 9.5, status: 'On Time', location: 'Summit HQ' },
  { id: 'att-002', employeeNo: 'SA-001', date: '2026-05-05', timeIn: '08:50 AM', timeOut: '06:30 PM', hours: 9.6, status: 'On Time', location: 'Summit HQ' },
  { id: 'att-003', employeeNo: 'SA-001', date: '2026-05-06', timeIn: '08:55 AM', timeOut: '', hours: 0, status: 'On Duty', location: 'Summit HQ' },
  
  // ADM-001 History
  { id: 'att-004', employeeNo: 'ADM-001', date: '2026-05-05', timeIn: '09:05 AM', timeOut: '06:00 PM', hours: 8.9, status: 'Late', location: 'Remote' },
  { id: 'att-005', employeeNo: 'ADM-001', date: '2026-05-06', timeIn: '08:58 AM', timeOut: '', hours: 0, status: 'On Duty', location: 'Summit HQ' },
  
  // HR-001 History
  { id: 'att-006', employeeNo: 'HR-001', date: '2026-05-05', timeIn: '09:00 AM', timeOut: '06:05 PM', hours: 9.1, status: 'On Time', location: 'Summit HQ' },
  { id: 'att-007', employeeNo: 'HR-001', date: '2026-05-06', timeIn: '09:02 AM', timeOut: '', hours: 0, status: 'On Duty', location: 'Summit HQ' },
  
  // MGR-001 History
  { id: 'att-008', employeeNo: 'MGR-001', date: '2026-05-05', timeIn: '09:15 AM', timeOut: '06:45 PM', hours: 9.5, status: 'Late', location: 'Satellite Hub' },
  
  // EMP-001 History
  { id: 'att-009', employeeNo: 'EMP-001', date: '2026-05-05', timeIn: '08:59 AM', timeOut: '06:00 PM', hours: 9.0, status: 'On Time', location: 'Remote' },
  { id: 'att-010', employeeNo: 'EMP-001', date: '2026-05-06', timeIn: '09:15 AM', timeOut: '', hours: 0, status: 'On Duty', location: 'Remote' },
];

export const MOCK_LEAVE = [
  { id: 'lv-001', employeeNo: 'EMP-001', name: 'TEST EMPLOYEE', type: 'Sick Leave', startDate: '2026-05-10', endDate: '2026-05-11', days: 1, status: 'Pending', reason: 'Medical Checkup' },
  { id: 'lv-002', employeeNo: 'MGR-001', name: 'TEST MANAGER', type: 'Vacation', startDate: '2026-06-01', endDate: '2026-06-05', days: 5, status: 'Approved', reason: 'Annual Leave' },
  { id: 'lv-003', employeeNo: 'ADM-001', name: 'TEST ADMIN', type: 'Emergency', startDate: '2026-05-04', endDate: '2026-05-04', days: 1, status: 'Approved', reason: 'Family Emergency' },
  { id: 'lv-004', employeeNo: 'HR-001', name: 'TEST HR', type: 'Conference', startDate: '2026-05-15', endDate: '2026-05-17', days: 3, status: 'Pending', reason: 'HR Summit 2026' },
];

export const MOCK_EVENTS = [
  { id: 'e1', title: 'Strategy Briefing', startDate: '2026-05-06', type: 'Meeting', location: 'Command Room 1' },
  { id: 'e2', title: 'Quarterly Maintenance', startDate: '2026-05-08', type: 'Operations', location: 'Data Center' },
  { id: 'e3', title: 'Unity Day', startDate: '2026-05-12', type: 'Holiday', location: 'Global' },
  { id: 'e4', title: 'Talent Acquisition Sync', startDate: '2026-05-07', type: 'Meeting', location: 'HR Suite' },
];

export const MOCK_SETTINGS = {
  geofenceRadius: '100',
  gracePeriod: '15',
  defaultShiftStart: '09:00 AM',
  defaultShiftEnd: '06:00 PM',
};

export const MOCK_AUDIT = [
  { timestamp: new Date().toISOString(), actorNo: 'SA-001', action: 'SYSTEM_BOOT', details: 'Forensic kernel initialized successfully.', severity: 'INFO' },
  { timestamp: new Date(Date.now() - 3600000).toISOString(), actorNo: 'HR-001', action: 'REGISTRY_UPDATE', details: 'Modified EMP-001 department assignment.', severity: 'WARNING' },
  { timestamp: new Date(Date.now() - 7200000).toISOString(), actorNo: 'ADM-001', action: 'GEOFENCE_BYPASS', details: 'Authorized remote clock-in for field team.', severity: 'CRITICAL' },
  { timestamp: new Date(Date.now() - 86400000).toISOString(), actorNo: 'MGR-001', action: 'SCHEDULE_SYNC', details: 'Updated team operational hours for Q2.', severity: 'INFO' },
];
