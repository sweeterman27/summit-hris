/**
 * SUMMIT HRIS | Enterprise Cloud Logic
 * @OnlyCurrentDoc
 * @NotOnlyCurrentDoc (Forces DriveApp Scope detection)
 * File: Code.gs
 */

const SPREADSHEET_ID = "1WjwlMMPpfDe48mB-KhTAfmo5MKvHT6r7_2-XgBC7IKM";
const SHEET_EMPLOYEES = "ACTIVE EMPLOYEE DATABASE";
const SHEET_ARCHIVE = "EMPLOYEE ARCHIVES";
const SHEET_LEAVE_BALANCES = "LEAVE BALANCES";
const SHEET_LEAVE = "Leave Requests";
const SHEET_ATTENDANCE = "Attendance Logs";
const SHEET_ACCESS = "Access Control";
const SHEET_NOTIFICATIONS = "Notifications";
const SHEET_OKR = "OKR Database";
const SHEET_PERFORMANCE = "Performance Reviews";
const SHEET_DOCUMENTS = "Document Storage";
const SHEET_COMPLIANCE = "Compliance Logs";
const SHEET_CALENDAR = "Calendar";
const SHEET_ANNOUNCEMENTS = "Announcements";
const EXTERNAL_LEAVE_SS_ID = "1vpmdtyzsw12wfGDxp5ljUBt9B-0CvuElIrvJ6457kmg";

/* ============================================================
   ENTRY POINT
============================================================ */

/**
 * RUN THIS FIRST: Select this function in the Google Apps Script dropdown and click "Run"
 * to authorize the spreadsheet connection.
 */
function RUN_FIRST_AUTHORIZE_SYSTEM() {
  setupDatabase_();
  Logger.log("System Authorized Successfully.");
}

function doGet() {
  setupDatabase_();
  return HtmlService.createTemplateFromFile("Index")
    .evaluate()
    .setTitle("Summit HRIS | Enterprise")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/* ============================================================
   DATABASE SETUP
============================================================ */

function setupDatabase_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // Access Control sheet
  if (!getSS_().getSheetByName(SHEET_ACCESS)) {
    const s = getSS_().insertSheet(SHEET_ACCESS);
    s.appendRow([
      "Employee No.",
      "Email",
      "Password Hash",
      "Role",
      "Status",
      "Last Login",
      "Needs PW Change",
    ]);
    s.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#f3f3f3");
    Logger.log("Access Control sheet created.");
  }

  // Active Employee Database sheet
  if (!getSS_().getSheetByName(SHEET_EMPLOYEES)) {
    const s = getSS_().insertSheet(SHEET_EMPLOYEES);
    s.appendRow([
      "Employee No.",
      "Last Name",
      "First Name",
      "Middle Name",
      "Complete Name",
      "Start Date",
      "Current Date",
      "No. of Months",
      "No. of Years",
      "Company",
      "Offer Letter",
      "Performance Evaluation",
      "Probationary Contract",
      "Regular Contract",
      "Status",
      "1st Separation Date (Rehired)",
      "Separation Date",
      "Clearance",
      "Department",
      "Position",
      "New Position",
      "Promotion Start Date",
      "Work Assignment",
      "Birthdate",
      "Age",
      "Civil Status",
      "Gender",
      "Mobile No.",
      "Email Address",
      "Updated Email Address",
      "Complete Address",
      "SSS No.",
      "TIN No.",
      "Philhealth No.",
      "Pag-ibig No.",
      "Emergency Contact Person",
      "Emergency Contact No.",
      "Remarks",
      "Work Latitude",
      "Work Longitude",
      "Work Radius"
    ]);
    s.getRange(1, 1, 1, 41).setFontWeight("bold").setBackground("#f3f3f3");
    Logger.log("Active Employee Database created.");
  }

  // Leave Balances Ledger
  if (!getSS_().getSheetByName(SHEET_LEAVE_BALANCES)) {
    const s = getSS_().insertSheet(SHEET_LEAVE_BALANCES);
    s.appendRow([
      "Employee No.",
      "Employee Name",
      "SIL Entitlement",
      "Tenure Entitlement",
      "Birthday Leave",
      "Used",
      "Remaining",
      "Last Updated"
    ]);
    s.getRange(1, 1, 1, 8).setFontWeight("bold").setBackground("#f3f3f3");
    Logger.log("Leave Balances ledger created.");
  }

  // Leave Requests sheet
  if (!getSS_().getSheetByName(SHEET_LEAVE)) {
    const s = getSS_().insertSheet(SHEET_LEAVE);
    s.appendRow([
      "ID",
      "Employee No.",
      "Employee Name",
      "Department",
      "Leave Type",
      "Start Date",
      "End Date",
      "Days",
      "Reason",
      "Status",
      "Submitted At",
      "Reviewed By",
      "Reviewed At",
      "Remarks",
    ]);
    s.getRange(1, 1, 1, 14).setFontWeight("bold").setBackground("#f3f3f3");
  }

  // Attendance sheet
  if (!getSS_().getSheetByName(SHEET_ATTENDANCE)) {
    const s = getSS_().insertSheet(SHEET_ATTENDANCE);
    s.appendRow([
      "ID",
      "Employee No.",
      "Employee Name",
      "Department",
      "Date",
      "Time In",
      "Time Out",
      "Hours",
      "Status",
      "Notes",
    ]);
    s.getRange(1, 1, 1, 10).setFontWeight("bold").setBackground("#f3f3f3");
  }

  // Notifications sheet
  if (!getSS_().getSheetByName(SHEET_NOTIFICATIONS)) {
    const s = getSS_().insertSheet(SHEET_NOTIFICATIONS);
    s.appendRow([
      "ID",
      "User ID",
      "Tier",
      "Type",
      "Title",
      "Message",
      "Status",
      "Timestamp",
    ]);
    s.getRange(1, 1, 1, 8).setFontWeight("bold").setBackground("#f3f3f3");
  }

  // Goals & OKRs sheet
  if (!getSS_().getSheetByName(SHEET_OKR)) {
    const s = getSS_().insertSheet(SHEET_OKR);
    s.appendRow([
      "ID",
      "Employee No.",
      "Parent ID",
      "Title",
      "Description",
      "Target",
      "Current",
      "Unit",
      "Status",
      "Deadline",
      "Created At",
    ]);
    s.getRange(1, 1, 1, 11).setFontWeight("bold").setBackground("#f3f3f3");
  }

  // Performance Reviews sheet
  if (!getSS_().getSheetByName(SHEET_PERFORMANCE)) {
    const s = getSS_().insertSheet(SHEET_PERFORMANCE);
    s.appendRow([
      "ID",
      "Employee No.",
      "Manager No.",
      "Period",
      "Rating",
      "Self Feedback",
      "Manager Feedback",
      "Action Plan",
      "Status",
      "Created At",
    ]);
    s.getRange(1, 1, 1, 10).setFontWeight("bold").setBackground("#f3f3f3");
  }

  // Announcements sheet
  if (!getSS_().getSheetByName(SHEET_ANNOUNCEMENTS)) {
    const s = getSS_().insertSheet(SHEET_ANNOUNCEMENTS);
    s.appendRow([
      "ID",
      "Timestamp",
      "Priority",
      "Category",
      "Title",
      "Message",
      "Author",
    ]);
    s.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#f3f3f3");
    Logger.log("Announcements sheet created.");
  }
}

/**
 * Premium Bootstrap Utility
 * Run this function from the Apps Script editor to populate high-fidelity OKR & Attendance data.
 */
function bootstrapDiamondData() {
  const userNo = "ZK-0001"; // Default Superadmin

  // 1. Populate Goals & OKRs
  const goalSheet = getSS_().getSheetByName(SHEET_OKR);
  if (goalSheet && goalSheet.getLastRow() < 2) {
    goalSheet.appendRows([
      [
        "OKR-001",
        userNo,
        "OBJ-001",
        "Architectural Scalability",
        "Upgrade core backend to Diamond Standard architecture",
        100,
        95,
        "%",
        "Active",
        "2026-06-30",
        new Date(),
      ],
      [
        "OKR-002",
        userNo,
        "OBJ-001",
        "UI/UX Fluidity",
        "Eliminate interaction latency across all SPA modules",
        100,
        45,
        "%",
        "Active",
        "2026-06-30",
        new Date(),
      ],
      [
        "OKR-003",
        userNo,
        "OBJ-002",
        "Mobile Response Engine",
        "Implement cross-device drawer and adaptive canvas",
        100,
        75,
        "%",
        "Active",
        "2026-07-15",
        new Date(),
      ],
    ]);
  }

  // 2. Populate Mock Attendance
  const attSheet = getSS_().getSheetByName(SHEET_ATTENDANCE);
  if (attSheet && attSheet.getLastRow() < 2) {
    const today = new Date();
    attSheet.appendRow([
      "ATT-001",
      userNo,
      "System Administrator",
      "Infrastructure",
      today,
      "09:00",
      "18:00",
      "9.0",
      "Present",
      "Diamond Sync Active",
    ]);
  }

  Logger.log("Diamond Data bootstrap complete.");
}

function getSS_() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

/* ============================================================
   AUTHENTICATION
============================================================ */

function hashPassword_(password) {
  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    password,
  );
  return digest
    .map((b) => {
      const v = (b < 0 ? b + 256 : b).toString(16);
      return v.length === 1 ? "0" + v : v;
    })
    .join("");
}

function loginUser(email, password) {
  try {
    const sheet = getSS_().getSheetByName(SHEET_ACCESS);
    const data = sheet.getDataRange().getValues();
    const gHdrs = data[0].map(h => h.toString().trim().toLowerCase());
    const iEmail = gHdrs.indexOf("email");
    const iPw = gHdrs.indexOf("password hash") > -1 ? gHdrs.indexOf("password hash") : 2;
    const iRole = gHdrs.indexOf("role") > -1 ? gHdrs.indexOf("role") : 3;
    const iStatus = gHdrs.indexOf("status") > -1 ? gHdrs.indexOf("status") : 4;
    const iNeedsPw = gHdrs.indexOf("needs pw change") > -1 ? gHdrs.indexOf("needs pw change") : 6;
    const iEmpNo = gHdrs.indexOf("employee no.") > -1 ? gHdrs.indexOf("employee no.") : 0;
    const iLogin = gHdrs.indexOf("last login") > -1 ? gHdrs.indexOf("last login") : 5;

    const inputEmail = (email || "").toString().trim().toLowerCase();
    const hashed = hashPassword_(password);
    
    const row = data.find((r) => {
      const dbEmail = (r[iEmail] || "").toString().trim().toLowerCase();
      return dbEmail === inputEmail;
    });

    if (!row)
      return { success: false, message: "No account found for this email." };
    if (row[iPw] !== hashed)
      return { success: false, message: "Incorrect password." };
    if (row[iStatus] === "Inactive")
      return { success: false, message: "Account is deactivated. Contact IT." };

    // Fetch their profile name from EMPLOYEE DATABASE
    const empSheet = getSS_().getSheetByName(SHEET_EMPLOYEES);
    const empData = empSheet.getDataRange().getValues();
    const empHdrs = empData[0];
    const empRow = empData.find(
      (r) => r[0].toString().trim() === row[iEmpNo].toString().trim(),
    );

    let name = "";
    if (empRow) {
      const iFirst = empHdrs.findIndex((h) =>
        h.toString().toLowerCase().includes("first"),
      );
      const iLast = empHdrs.findIndex((h) =>
        h.toString().toLowerCase().includes("last"),
      );
      const iDept = empHdrs.findIndex((h) =>
        h.toString().toLowerCase().includes("department"),
      );
      const iPos = empHdrs.findIndex((h) =>
        h.toString().toLowerCase().includes("position"),
      );
      name = [
        iFirst > -1 ? empRow[iFirst] : "",
        iLast > -1 ? empRow[iLast] : "",
      ]
        .filter(Boolean)
        .join(" ");
    }

    const user = {
      employeeNo: row[iEmpNo],
      email: row[iEmail],
      role: row[iRole],
      completeName: name || email.split("@")[0],
      needsPasswordChange:
        row[iNeedsPw] === true ||
        row[iNeedsPw] === "TRUE" ||
        row[iNeedsPw] === "true",
    };

    // Attach full profile info if found
    if (empRow) {
      empHdrs.forEach((h, i) => {
        const key = h.toString();
        // Skip already handled or sensitive raw fields that we explicitly redefine
        if (["Employee No.", "Email"].includes(key)) return;
        user[key] = empRow[i];
      });
      // Ensure specific mapped fields for UI
      const iDept = empHdrs.findIndex(h => h.toString().toLowerCase().includes("department"));
      const iPos = empHdrs.findIndex(h => h.toString().toLowerCase().includes("position"));
      const iPhoto = empHdrs.indexOf("Profile Photo");
      user.department = iDept > -1 ? empRow[iDept] : "General";
      user.position = iPos > -1 ? empRow[iPos] : "Employee";
      user.profilePhoto = iPhoto > -1 ? empRow[iPhoto] : "";
    }

    // Stamp last login (Safe-Guard against missing headers)
    if (sheet && iLogin > -1) {
      const rowIdx = data.findIndex((r) => r[iEmpNo] && r[iEmpNo].toString().trim() === user.employeeNo.toString().trim());
      if (rowIdx > 0) {
        try { sheet.getRange(rowIdx + 1, iLogin + 1).setValue(new Date()); } catch(e) {}
      }
    }

    // Pin session to Cache
    try {
      CacheService.getUserCache().put("summit_emp_no", user.employeeNo.toString(), 3600 * 4);
    } catch(e) {}

    // Clean user object for serialization safety
    const cleanUser = {};
    Object.keys(user).forEach(k => {
      const val = user[k];
      if (val instanceof Date) cleanUser[k] = val.toISOString();
      else if (typeof val !== 'function' && typeof val !== 'object') cleanUser[k] = val;
      else if (val === null) cleanUser[k] = "";
      else cleanUser[k] = val.toString();
    });

    return { success: true, user: cleanUser };
  } catch (e) {
    return { success: false, message: "Authentication Logic Failure: " + e.message };
  }
}

function changeUserPassword(employeeNo, currentPassword, newPassword) {
  try {
    const sheet = getSS_().getSheetByName(SHEET_ACCESS);
    const data = sheet.getDataRange().getValues();
    const idx = data.findIndex(
      (r) => r[0].toString() === employeeNo.toString(),
    );

    if (idx < 1) return { success: false, message: "Account not found." };
    if (data[idx][2] !== hashPassword_(currentPassword))
      return { success: false, message: "Current password is incorrect." };

    sheet.getRange(idx + 1, 3).setValue(hashPassword_(newPassword));
    sheet.getRange(idx + 1, 7).setValue(false);
    return { success: true };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/* ============================================================
   UI ROUTING
============================================================ */

function getRoleView(user) {
  if (!user || !user.role) return render_("view-login");
  if (user.needsPasswordChange) return render_("view-password-reset", { user });

  const map = {
    SUPERADMIN: "view-admin",
    ADMIN: "view-admin",
    HR: "view-hr",
    MANAGER: "view-manager",
    EMPLOYEE: "view-employee",
  };

  return render_(map[user.role.toUpperCase()] || "view-login", { user });
}

function render_(viewName, params = {}) {
  const tpl = HtmlService.createTemplateFromFile("Views");
  tpl.currentView = viewName;

  // Ensure 'user' is always defined to prevent template crashes
  tpl.user = params.user || { employeeNo: "", completeName: "", role: "", email: "" };

  Object.keys(params).forEach((k) => {
    if (k !== "user") tpl[k] = params[k];
  });
  return tpl.evaluate().getContent();
}

/* ============================================================
   DASHBOARD STATS  (real data)
============================================================ */

function getDashboardStats(user) {
  try {
    const empSheet = getSS_().getSheetByName(SHEET_EMPLOYEES);
    const empData = empSheet.getDataRange().getValues();
    const empHdrs = empData[0];

    const iDept = empHdrs.findIndex((h) =>
      h.toString().toLowerCase().includes("department"),
    );
    const iPos = empHdrs.findIndex((h) =>
      h.toString().toLowerCase().includes("position"),
    );
    const iStatus = empHdrs.findIndex(
      (h) => h.toString().toLowerCase() === "status",
    );

    const rows = empData.slice(1).filter((r) => r[0]); // skip empty rows
    const active =
      iStatus > -1
        ? rows.filter((r) => r[iStatus].toString().toLowerCase() === "active")
        : rows;

    // Distribution maps
    const deptMap = {};
    const posMap = {};

    rows.forEach((r) => {
      if (iDept > -1) {
        const d = r[iDept].toString().trim();
        if (d) deptMap[d] = (deptMap[d] || 0) + 1;
      }
      if (iPos > -1) {
        const p = r[iPos].toString().trim();
        if (p) posMap[p] = (posMap[p] || 0) + 1;
      }
    });

    // Sort and map to response
    const departments = Object.entries(deptMap)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));

    const positions = Object.entries(posMap)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));

    // Leave stats
    const leaveSheet = getSS_().getSheetByName(SHEET_LEAVE);
    let pendingLeave = 0,
      approvedLeave = 0;
    if (leaveSheet) {
      const leaveData = leaveSheet.getDataRange().getValues();
      const lHdrs = leaveData[0];
      const iLStatus = lHdrs.indexOf("Status");
      const iLEmpNo = lHdrs.indexOf("Employee No.");
      leaveData.slice(1).forEach((r) => {
        const st = (r[iLStatus] || "").toString().toLowerCase();
        if (st === "pending") pendingLeave++;
        if (st === "approved") approvedLeave++;
      });
    }

    // Talent Stats (Self-Service)
    const goalSheet = getSS_().getSheetByName(SHEET_OKR);
    let okrSummary = { avgProgress: 0, activeCount: 0 };
    if (goalSheet) {
      const gData = goalSheet.getDataRange().getValues();
      const gHdrs = gData[0];
      const iGEmp = gHdrs.indexOf("Employee No.");
      const iCur = gHdrs.indexOf("Current");
      const iTar = gHdrs.indexOf("Target");
      const iPar = gHdrs.indexOf("Parent ID");

      const myKRs = gData.slice(1).filter(
        (r) => r[iGEmp].toString() === user.employeeNo.toString() && r[iPar], // and has parent = Key Result
      );

      if (myKRs.length > 0) {
        let totalPct = 0;
        myKRs.forEach((kr) => {
          const tar = parseFloat(kr[iTar]) || 1;
          const cur = parseFloat(kr[iCur]) || 0;
          totalPct += Math.min(100, Math.max(0, (cur / tar) * 100));
        });
        okrSummary.avgProgress = Math.round(totalPct / myKRs.length);
        okrSummary.activeCount = myKRs.length;
      }
    }

    return {
      success: true,
      totalEmployees: rows.length,
      activeEmployees: active.length,
      pendingLeave,
      approvedLeave,
      departments,
      positions,
      talent: {
        okrSummary,
        summitLevel:
          okrSummary.avgProgress >= 90
            ? "Elite"
            : okrSummary.avgProgress >= 70
              ? "Advanced"
              : okrSummary.avgProgress >= 40
                ? "Proficient"
                : "Developing",
      },
      announcements: getAnnouncements(),
      personalLeaveBalance: getLeaveBalanceSummary(user.employeeNo, user).summary,
      isClockedIn: checkCurrentClockStatus(user.employeeNo),
      geofence: getEmployeeGeofence(user.employeeNo)
    };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/**
 * Unified fetch for onboarding data to prevent parallel call locks.
 */
function getOnboardingData() {
  try {
    const sheet = getSS_().getSheetByName(SHEET_EMPLOYEES);
    if (!sheet)
      return {
        success: true,
        nextId: "ZK-0001",
        departments: [],
        positions: [],
      };

    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    if (lastRow < 1 || lastCol < 1)
      return {
        success: true,
        nextId: "ZK-0001",
        departments: [],
        positions: [],
      };

    const data = sheet.getRange(1, 1, lastRow, lastCol).getValues();
    const headers = data[0].map((h) => h.toString().toLowerCase().trim());

    const iId = headers.findIndex(
      (h) =>
        h.includes("employee no") ||
        h.includes("id no") ||
        h.includes("emp no") ||
        h === "employee id" ||
        h === "id",
    );
    const iDept = headers.findIndex(
      (h) =>
        h.includes("department") ||
        h.includes("dept") ||
        h.includes("unit") ||
        h.includes("division") ||
        h.includes("team"),
    );
    const iPos = headers.findIndex(
      (h) =>
        h.includes("position") ||
        h.includes("pos") ||
        h.includes("role") ||
        h.includes("title") ||
        h.includes("job"),
    );

    let maxIdNum = 0;
    const depts = new Set();
    const positions = new Set();

    for (let i = 1; i < data.length; i++) {
      // 1. Calculate Next ID
      if (iId > -1 && data[i][iId]) {
        const parts = data[i][iId].toString().split("-");
        if (parts.length > 1) {
          const num = parseInt(parts[1], 10);
          if (!isNaN(num) && num > maxIdNum) maxIdNum = num;
        }
      }
      // 2. Collect Metadata
      if (iDept > -1 && data[i][iDept])
        depts.add(data[i][iDept].toString().trim());
      if (iPos > -1 && data[i][iPos])
        positions.add(data[i][iPos].toString().trim());
    }

    const nextId = "ZK-" + (maxIdNum + 1).toString().padStart(4, "0");

    return {
      success: true,
      nextId,
      departments: Array.from(depts).filter(Boolean).sort(),
      positions: Array.from(positions).filter(Boolean).sort(),
    };
  } catch (e) {
    console.error("Onboarding data error:", e);
    return { success: true, nextId: "ZK-NEW", departments: [], positions: [] };
  }
}

/**
 * High-Fidelity Folder Resolver: summitHRIS > [subfolder]
 */
function getOrCreateFolder_(folderName, parentFolder = null) {
  const parent = parentFolder || DriveApp.getRootFolder();
  const folders = parent.getFoldersByName(folderName);
  if (folders.hasNext()) return folders.next();
  return parent.createFolder(folderName);
}

function getSummitAssetFolder_(subName) {
  const root = getOrCreateFolder_("summitHRIS");
  return getOrCreateFolder_(subName, root);
}

/**
 * Updates the employee's profile photo link with Direct-Stream UI support
 */
function updateProfilePhoto(base64) {
  try {
    const user = getSessionUser();
    if (!user) throw new Error("Session expired.");

    const folder = getSummitAssetFolder_("Profile_Photos");
    
    // Cleanup old photos for this user
    const oldFiles = folder.getFilesByName(`Profile_${user.employeeNo}.jpg`);
    while (oldFiles.hasNext()) oldFiles.next().setTrashed(true);

    const contentType = base64.substring(5, base64.indexOf(';'));
    const bytes = Utilities.base64Decode(base64.split(',')[1]);
    const blob = Utilities.newBlob(bytes, contentType, `Profile_${user.employeeNo}.jpg`);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // Raw Stream URL
    const photoUrl = `https://drive.google.com/uc?export=view&id=${file.getId()}`;

    const ss = getSS_();
    const sheet = ss.getSheetByName(SHEET_EMPLOYEES);
    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(h => h.toString().trim());
    const iEmpNo = headers.indexOf("Employee No.");
    const iPhoto = headers.indexOf("Profile Photo");

    const rowIdx = data.findIndex((r, i) => i > 0 && r[iEmpNo].toString() === user.employeeNo.toString());
    
    if (rowIdx > -1) {
      const targetCol = iPhoto > -1 ? iPhoto : headers.length;
      if (iPhoto === -1) {
         sheet.getRange(1, headers.length + 1).setValue("Profile Photo");
      }
      sheet.getRange(rowIdx + 1, targetCol + 1).setValue(photoUrl);
      return { success: true, photoUrl };
    }
    throw new Error("Employee record mismatch.");
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/**
 * Self-service profile update (Strictly Gated)
 */
function updateProfileSelf(payload) {
  try {
    const user = getSessionUser();
    if (!user) throw new Error("Session expired.");

    const ss = getSS_();
    const sheet = ss.getSheetByName(SHEET_EMPLOYEES);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const iEmpNo = headers.indexOf("Employee No.");

    const rowIdx = data.findIndex((r, i) => i > 0 && r[iEmpNo].toString() === user.employeeNo.toString());
    if (rowIdx === -1) throw new Error("Employee record not found.");

    // Strict Whitelist of editable fields
    const allowed = [
      "Mobile No.",
      "Civil Status",
      "Complete Address",
      "Emergency Contact Person",
      "Emergency Contact No."
    ];

    const range = sheet.getRange(rowIdx + 1, 1, 1, headers.length);
    const rowData = range.getValues()[0];

    allowed.forEach(key => {
      const colIdx = headers.indexOf(key);
      if (colIdx > -1 && payload[key] !== undefined) {
        rowData[colIdx] = payload[key];
      }
    });

    range.setValues([rowData]);

    return { success: true };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/* ============================================================
   EMPLOYEE DIRECTORY
============================================================ */

function getDirectory(user, search, page, filters = {}, sort = "name_asc") {
  try {
    const role = user.role.toUpperCase();
    const sheet = getSS_().getSheetByName(SHEET_EMPLOYEES);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    // Key column indices
    const iEmpNo = 0;
    const iLast = headers.findIndex((h) =>
      h.toString().toLowerCase().includes("last name"),
    );
    const iFirst = headers.findIndex((h) =>
      h.toString().toLowerCase().includes("first name"),
    );
    const iDept = headers.findIndex((h) =>
      h.toString().toLowerCase().includes("department"),
    );
    const iPos = headers.findIndex((h) =>
      h.toString().toLowerCase().includes("position"),
    );
    const iStatus = headers.findIndex(
      (h) => h.toString().toLowerCase() === "status",
    );
    const iStart = headers.findIndex((h) =>
      h.toString().toLowerCase().includes("start date"),
    );
    const iFull = headers.findIndex((h) =>
      h.toString().toLowerCase().includes("complete name"),
    );

    // Data Integrity Check indices
    const auditFields = ["Birthdate", "Mobile No.", "Address", "Emergency Contact", "SSS", "TIN"];
    const auditIndices = auditFields.map(f => headers.findIndex(h => h.toString().toLowerCase().includes(f.toLowerCase())));

    let rows = data.slice(1).filter((r) => r[0]);

    // 1. RBAC Security Filter
    if (role === "MANAGER") {
      const myRow = rows.find(
        (r) =>
          r[iEmpNo].toString().trim() === user.employeeNo.toString().trim(),
      );
      const myDept = myRow && iDept > -1 ? myRow[iDept] : null;
      if (myDept) rows = rows.filter((r) => r[iDept] === myDept);
    } else if (role === "EMPLOYEE") {
      rows = rows.filter(
        (r) =>
          r[iEmpNo].toString().trim() === user.employeeNo.toString().trim(),
      );
    }

    // 2. Search Filter
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter((r) => {
        const text = [r[iEmpNo], r[iFirst], r[iLast], r[iDept], r[iPos]]
          .join(" ")
          .toLowerCase();
        return text.includes(q);
      });
    }

    // 3. Dropdown Filters
    if (filters.department)
      rows = rows.filter((r) => r[iDept] === filters.department);
    if (filters.position)
      rows = rows.filter((r) => r[iPos] === filters.position);
    if (filters.status)
      rows = rows.filter((r) => r[iStatus] === filters.status);

    // 4. Sorting
    rows.sort((a, b) => {
      let valA, valB;
      switch (sort) {
        case "name_asc":
        case "name_desc":
          valA = (a[iFull] || a[iFirst] + " " + a[iLast]).toLowerCase();
          valB = (b[iFull] || b[iFirst] + " " + b[iLast]).toLowerCase();
          break;
        case "dept_asc":
        case "dept_desc":
          valA = (a[iDept] || "").toLowerCase();
          valB = (b[iDept] || "").toLowerCase();
          break;
        case "date_asc":
        case "date_desc":
          valA = a[iStart] ? new Date(a[iStart]).getTime() : 0;
          valB = b[iStart] ? new Date(b[iStart]).getTime() : 0;
          break;
        default:
          return 0;
      }

      if (valA < valB) return sort.includes("_asc") ? -1 : 1;
      if (valA > valB) return sort.includes("_asc") ? 1 : -1;
      return 0;
    });

    const total = rows.length;
    const perPage = 20;
    const offset = ((page || 1) - 1) * perPage;
    const paged = rows.slice(offset, offset + perPage);

    const employees = paged.map((r) => ({
      employeeNo: r[iEmpNo] || "",
      lastName: iLast > -1 ? r[iLast] : "",
      firstName: iFirst > -1 ? r[iFirst] : "",
      fullName:
        iFull > -1 && r[iFull]
          ? r[iFull]
          : [iFirst > -1 ? r[iFirst] : "", iLast > -1 ? r[iLast] : ""]
              .filter(Boolean)
              .join(" "),
      department: iDept > -1 ? r[iDept] : "",
      position: iPos > -1 ? r[iPos] : "",
      status: iStatus > -1 ? r[iStatus] : "",
      startDate:
        iStart > -1 && r[iStart]
          ? Utilities.formatDate(
              new Date(r[iStart]),
              Session.getScriptTimeZone(),
              "MMM yyyy",
            )
          : "",
      isIncomplete: auditIndices.some(
        (idx) => idx > -1 && (!r[idx] || r[idx].toString().trim() === ""),
      ),
    }));

    return { success: true, employees, total, page: page || 1, perPage };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/**
 * Updates an employee's profile data in the spreadsheet surgically.
 */
/**
 * Updates an employee's profile data in the spreadsheet surgically.
 * Now includes Authorization Check and Access Control Sync.
 */
function updateEmployeeProfile(employeeNo, profileData, adminNo) {
  try {
    const ss = getSS_();

    // 1. Authorization Gate
    const adminSheet = ss.getSheetByName(SHEET_ACCESS);
    const adminData = adminSheet.getDataRange().getValues();
    const adminIdx = adminData.findIndex(
      (r) => r[0] && r[0].toString() === adminNo.toString(),
    );
    const adminRole = adminIdx > -1 ? adminData[adminIdx][3].toUpperCase() : "";

    if (!["SUPERADMIN", "ADMIN", "HR"].includes(adminRole)) {
      return {
        success: false,
        message: "Unauthorized: Insufficient privileges to edit personnel records.",
      };
    }

    // 2. Update Employee Database
    const sheet = ss.getSheetByName(SHEET_EMPLOYEES);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const iEmpNo = headers.indexOf("Employee No.");

    const rowIdx = data.findIndex(
      (r) => r[iEmpNo] && r[iEmpNo].toString() === employeeNo.toString(),
    );
    if (rowIdx < 0) throw new Error("Employee not found in directory.");

    const rowNum = rowIdx + 1;
    const row = data[rowIdx];

    // Update row array with new data from form
    Object.keys(profileData).forEach((key) => {
      const colIdx = headers.indexOf(key);
      if (colIdx > -1) {
        if (["No. of Months", "No. of Years", "Age", "Current Date"].includes(key)) return;
        let val = profileData[key];
        if (key.toLowerCase().includes("date") && val) val = new Date(val);
        row[colIdx] = val;
      }
    });

    // Recalculate Full Name
    const iLast = headers.indexOf("Last Name");
    const iFirst = headers.indexOf("First Name");
    const iMid = headers.indexOf("Middle Name");
    const iFull = headers.indexOf("Complete Name");
    if (iFull > -1) {
      row[iFull] = [row[iFirst], row[iMid], row[iLast]].filter(Boolean).join(" ");
    }

    sheet.getRange(rowNum, 1, 1, headers.length).setValues([row]);

    // --- AUTOMATIC SEPARATION TRIGGER ---
    const stoppedStatuses = ["resigned", "terminated", "awol", "finished contract"];
    const currentStatus = (row[headers.indexOf("Status")] || "").toString().toLowerCase().trim();
    if (stoppedStatuses.includes(currentStatus)) {
       Logger.log(`Status changed to ${currentStatus}. Triggering automatic separation for ${employeeNo}.`);
       archiveEmployee(employeeNo);
       return { success: true, message: "Employee successfully updated and moved to ARCHIVES." };
    }

    // 3. Sync Access Control (Role & Password updates)
    if (profileData.role || profileData.password) {
      const accData = adminSheet.getDataRange().getValues();
      const accHeaders = accData[0];
      const targetAccessIdx = accData.findIndex(
        (r) => r[0] && r[0].toString() === employeeNo.toString(),
      );

      if (targetAccessIdx > -1) {
        if (profileData.role) {
          adminSheet.getRange(targetAccessIdx + 1, accHeaders.indexOf("Role") + 1).setValue(profileData.role.toUpperCase());
        }
        if (profileData.password) {
          adminSheet.getRange(targetAccessIdx + 1, accHeaders.indexOf("Password Hash") + 1).setValue(hashPassword_(profileData.password));
          adminSheet.getRange(targetAccessIdx + 1, accHeaders.indexOf("Needs PW Change") + 1).setValue("Yes");
        }
      } else {
        // AUTO-PROVISION: Account missing? Create it now.
        const emailIdx = headers.indexOf("Email Address") > -1 ? headers.indexOf("Email Address") : headers.indexOf("Email");
        const email = profileData["Email Address"] || row[emailIdx] || "";
        const role = profileData.role || "Employee";
        const pw = profileData.password || "SUMMIT-OVERRIDE";
        
        adminSheet.appendRow([
          employeeNo,
          email,
          hashPassword_(pw),
          role.toUpperCase(),
          "Active",
          "",
          "Yes"
        ]);
        
        logSystemNotification_(
          "Account Auto-Provisioned",
          `System account created during profile update for ${employeeNo}.`,
          "SYSTEM"
        );
      }

      logSystemNotification_(
        "Security Update",
        `Admin updated credentials for ${employeeNo}.`,
        "SYSTEM"
      );
    }

    return { success: true, message: "Profile and Access synchronized successfully." };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function addEmployee(profileData, adminNo) {
  try {
    const ss = getSS_();
    // Use existing authorization gate from updateEmployeeProfile context
    const adminSheet = ss.getSheetByName(SHEET_ACCESS);
    const adminData = adminSheet.getDataRange().getValues();
    const adminIdx = adminData.findIndex(r => r[0] && r[0].toString() === adminNo.toString());
    const adminRole = adminIdx > -1 ? adminData[adminIdx][3].toUpperCase() : "";

    if (!["SUPERADMIN", "ADMIN", "HR"].includes(adminRole)) {
      return { success: false, message: "Unauthorized." };
    }

    const sheet = ss.getSheetByName(SHEET_EMPLOYEES);
    const headers = sheet.getDataRange().getValues()[0];
    const employeeNo = (profileData["Employee No."] || getNextEmployeeID()).trim();
    const email = (profileData["Email Address"] || "").toLowerCase().trim();

    // Preparation & Append
    const newRow = new Array(headers.length).fill("");
    headers.forEach((h, i) => {
      if (h === "Employee No.") newRow[i] = employeeNo;
      else if (profileData[h] !== undefined) {
        let val = profileData[h];
        if (h.toLowerCase().includes("date") && val) val = new Date(val);
        newRow[i] = val;
      }
    });
    
    const iFull = headers.indexOf("Complete Name");
    if (iFull > -1) newRow[iFull] = [profileData["First Name"], profileData["Middle Name"], profileData["Last Name"]].filter(Boolean).join(" ");

    sheet.appendRow(newRow);

    // Provision Account
    let generatedPw = "";
    if (profileData.role) {
      let tempPw = profileData.password || "SUMMIT-" + Math.random().toString(36).substring(2, 8).toUpperCase();
      generatedPw = tempPw;
      adminSheet.appendRow([employeeNo, email, hashPassword_(tempPw), profileData.role, "Active", "", "Yes"]);
      logSystemNotification_("Account Provisioned", `Account created for ${employeeNo}.`, "SYSTEM");
    }

    return { success: true, message: "Employee added successfully.", tempPw: generatedPw };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function archiveEmployee(employeeNo) {
  try {
    const ss = getSS_();
    const activeSheet = ss.getSheetByName(SHEET_EMPLOYEES);
    const archiveSheet = ss.getSheetByName(SHEET_ARCHIVE) || ss.insertSheet(SHEET_ARCHIVE);
    const accessSheet = ss.getSheetByName(SHEET_ACCESS);

    const activeData = activeSheet.getDataRange().getValues();
    const idx = activeData.findIndex(r => r[0] && r[0].toString() === employeeNo.toString());
    
    if (idx < 1) {
      Logger.log("Employee not found in Active Database. Might already be archived.");
      return { success: false, message: "Employee record not found in Active database." };
    }

    // 1. Physically move from Active to Archive
    archiveSheet.appendRow(activeData[idx]);
    activeSheet.deleteRow(idx + 1);
    Logger.log(`Moved Employee ${employeeNo} to ARCHIVES.`);

    // 2. Set Access Control status to Inactive
    const acData = accessSheet.getDataRange().getValues();
    const acHdrs = acData[0].map(h => h.toString().toLowerCase().trim());
    const acIdx = acData.findIndex(r => r[0] && r[0].toString() === employeeNo.toString());
    const iAcStatus = acHdrs.indexOf("status");
    
    if (acIdx > 0 && iAcStatus > -1) {
      accessSheet.getRange(acIdx + 1, iAcStatus + 1).setValue("Inactive");
    }

    return { success: true, message: `Employee ${employeeNo} has been moved to ARCHIVES and account deactivated.` };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function getEmployeeProfile(employeeNo) {
  try {
    const ss = getSS_();
    const sheet = ss.getSheetByName(SHEET_EMPLOYEES);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const row = data.find(r => r[0] && r[0].toString() === employeeNo.toString());
    if (!row) return { success: false, message: "Not found." };

    const profile = {};
    headers.forEach((h, i) => profile[h] = row[i] instanceof Date ? row[i].toISOString() : row[i]);

    const acSheet = ss.getSheetByName(SHEET_ACCESS);
    const acRow = acSheet.getDataRange().getValues().find(r => r[0] && r[0].toString() === employeeNo.toString());
    if (acRow) {
      profile.role = acRow[3];
      profile.password = ""; // Do not send hashes to frontend, but we keep the field editable
    }

    return { success: true, data: profile };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/* ============================================================
   LEAVE REQUESTS
============================================================ */

function getLeaveRequests(user) {
  try {
    const role = user.role.toUpperCase();
    const sheet = getSS_().getSheetByName(SHEET_LEAVE);
    if (!sheet) return { success: true, requests: [] };

    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return { success: true, requests: [] };

    const headers = data[0].map(h => h.toString().trim().toLowerCase());
    const iEmpNo = headers.findIndex(h => h.includes("employee no"));
    const iDept = headers.findIndex(h => h.includes("department"));
    const iStatus = headers.findIndex(h => h.includes("status"));

    if (iEmpNo === -1) return { success: true, requests: [], balanceSummary: getLeaveBalanceSummary(user.employeeNo, user).summary };

    const normalize = (id) => (id || "").toString().trim().toLowerCase().replace(/^0+/, "");
    const searchId = normalize(user.employeeNo);
    let rows = data.slice(1).filter((r) => r[0]);

    if (role === "EMPLOYEE") {
      rows = rows.filter((r) => r[iEmpNo] && normalize(r[iEmpNo]) === searchId);
    } else if (role === "MANAGER") {
      // Filter by department later when we know manager's dept
      const empSheet = getSS_().getSheetByName(SHEET_EMPLOYEES);
      const empData = empSheet.getDataRange().getValues();
      const empHdrs = empData[0];
      const iEmpDept = empHdrs.findIndex((h) =>
        h.toString().toLowerCase().includes("department"),
      );
      const myRow = empData.find(
        (r) => r[0].toString().trim() === user.employeeNo.toString().trim(),
      );
      const myDept = myRow && iEmpDept > -1 ? myRow[iEmpDept] : null;
      if (myDept) rows = rows.filter((r) => r[iDept] === myDept);
    }
    // HR/Admin/Superadmin see all

    const requests = rows.map((r) => {
      const obj = {};
      headers.forEach((h, i) => {
        obj[h.toString()] = r[i];
      });
      return obj;
    });

    return { success: true, requests: requests, balanceSummary: getLeaveBalanceSummary(user.employeeNo, user).summary };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function submitLeaveRequest(user, payload) {
  try {
    const activeUser = getCurrentUserInternal_();
    if (activeUser && activeUser.role.toUpperCase() === "SUPERADMIN") {
      throw new Error("Superadmins are not allowed to file leave requests.");
    }

    const sheet = getSS_().getSheetByName(SHEET_LEAVE);
    const empSheet = getSS_().getSheetByName(SHEET_EMPLOYEES);
    const empData = empSheet.getDataRange().getValues();
    const empHdrs = empData[0];

    const empRow = empData.find(
      (r) => r[0].toString().trim() === user.employeeNo.toString().trim(),
    );
    const iFirst = empHdrs.findIndex((h) =>
      h.toString().toLowerCase().includes("first name"),
    );
    const iLast = empHdrs.findIndex((h) =>
      h.toString().toLowerCase().includes("last name"),
    );
    const iDept = empHdrs.findIndex((h) =>
      h.toString().toLowerCase().includes("department"),
    );

    const name = empRow
      ? [empRow[iFirst] || "", empRow[iLast] || ""].join(" ").trim()
      : "";
    const dept = empRow && iDept > -1 ? empRow[iDept] : "";
    const id = "LR-" + new Date().getTime();

    // --- LEAVE LEDGER VALIDATION ---
    const summaryResp = getLeaveBalanceSummary(user.employeeNo, user);
    if (!summaryResp.success) throw new Error("Could not verify leave balance.");
    const summary = summaryResp.summary;
    const requestedDays = parseFloat(payload.days);
    const type = payload.leaveType;

    if (["Annual", "Emergency", "Sick", "Vacation"].includes(type)) {
      if (requestedDays > summary.SIL.remaining) {
         throw new Error(`Insufficient SIL balance. Remaining: ${summary.SIL.remaining} days.`);
      }
    } else if (type === "Additional") {
      if (requestedDays > summary.Additional.remaining) {
         throw new Error(`Insufficient Additional Leave balance. Available: ${summary.Additional.remaining} days.`);
      }
    } else if (type === "Birthday") {
      if (!summary.Birthday.isEligible) {
         throw new Error(`Birthday Leave can only be taken within your birth month (${summaryResp.birthMonth}).`);
      }
      if (requestedDays > summary.Birthday.remaining) {
         throw new Error(`Birthday Leave already consumed for this year.`);
      }
    }

    sheet.appendRow([
      id,
      user.employeeNo,
      name,
      dept,
      payload.leaveType,
      payload.startDate,
      payload.endDate,
      payload.days,
      payload.reason,
      "Pending",
      new Date(),
      "",
      "",
      "",
    ]);

    // TRIGGER: Notify Admins & HR (Tier 1 - Action Required)
    const accessSheet = getSS_().getSheetByName(SHEET_ACCESS);
    const accessData = accessSheet.getDataRange().getValues();
    const adminAccounts = accessData
      .slice(1)
      .filter((r) =>
        ["ADMIN", "SUPERADMIN", "HR"].includes(r[2].toUpperCase()),
      );

    adminAccounts.forEach((acc) => {
      const email = acc[1];
      const empNo = acc[0];

      addNotification_(
        empNo,
        1,
        "Leave",
        "New Leave Request",
        `${name} (${dept}) submitted a ${payload.leaveType} request for ${payload.days} days.`,
      );
      sendEmailNotification_(
        email,
        "New Leave Request: " + name,
        "Action Required: Leave Approval",
        `<strong>${name}</strong> from <strong>${dept}</strong> has submitted a new <strong>${payload.leaveType}</strong> request.<br><br>` +
          `<strong>Dates:</strong> ${payload.startDate} to ${payload.endDate} (${payload.days} days)<br>` +
          `<strong>Reason:</strong> ${payload.reason || "No reason provided."}`,
      );
    });

    return { success: true, id };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function reviewLeaveRequest(leaveId, action, reviewer, remarks) {
  try {
    const activeUser = getCurrentUserInternal_();
    const role = (activeUser ? activeUser.role : "").toUpperCase();
    if (role !== "HR" && role !== "ADMIN") {
      throw new Error(
        "Unauthorized: Only HR or Admin can review leave requests.",
      );
    }

    const sheet = getSS_().getSheetByName(SHEET_LEAVE);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const iId = headers.indexOf("ID");
    const rowIdx = data.findIndex((r) => r[iId] === leaveId);

    if (rowIdx < 1) return { success: false, message: "Request not found." };

    const rn = rowIdx + 1;
    sheet
      .getRange(rn, headers.indexOf("Status") + 1)
      .setValue(action === "approve" ? "Approved" : "Rejected");
    sheet.getRange(rn, headers.indexOf("Reviewed By") + 1).setValue(reviewer);
    sheet.getRange(rn, headers.indexOf("Reviewed At") + 1).setValue(new Date());
    sheet.getRange(rn, headers.indexOf("Remarks") + 1).setValue(remarks || "");

    // TRIGGER: Notify Employee (Tier 2 - Informational)
    const empNo = data[rowIdx][headers.indexOf("Employee No.")];
    const leaveType = data[rowIdx][headers.indexOf("Leave Type")];
    const status = action === "approve" ? "Approved" : "Rejected";

    // Get employee email
    const accessSheet = getSS_().getSheetByName(SHEET_ACCESS);
    const accRow = accessSheet
      .getDataRange()
      .getValues()
      .find((r) => r[0].toString() === empNo.toString());

    addNotification_(
      empNo,
      2,
      "Leave",
      `Leave ${status}`,
      `Your ${leaveType} request (${leaveId}) has been ${status.toLowerCase()}.`,
    );

    if (accRow) {
      sendEmailNotification_(
        accRow[1],
        `Leave Request ${status}`,
        `Your Leave Request was ${status}`,
        `Hello,<br><br>Your leave request <strong>${leaveId}</strong> for <strong>${leaveType}</strong> has been <strong>${status}</strong>.<br>` +
          (remarks ? `<br><strong>Reviewer Remarks:</strong> ${remarks}` : ""),
      );
    }

    return { success: true };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/* ============================================================
   ATTENDANCE
============================================================ */

function clockIn(user, locationData) {
  try {
    const today = Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone(),
      "yyyy-MM-dd",
    );
    const sheet = getSS_().getSheetByName(SHEET_ATTENDANCE);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const iEmpNo = headers.indexOf("Employee No.");
    const iDate = headers.indexOf("Date");
    const iTimeIn = headers.indexOf("Time In");

    // Check if already clocked in today
    const existing = data
      .slice(1)
      .find(
        (r) =>
          r[iEmpNo].toString() === user.employeeNo.toString() &&
          Utilities.formatDate(
            new Date(r[iDate]),
            Session.getScriptTimeZone(),
            "yyyy-MM-dd",
          ) === today,
      );

    if (existing)
      return { success: false, message: "Already clocked in for today." };

    // Get employee name
    const empSheet = getSS_().getSheetByName(SHEET_EMPLOYEES);
    const empData = empSheet.getDataRange().getValues();
    const empHdrs = empData[0];
    const empRow = empData.find(
      (r) => r[0].toString().trim() === user.employeeNo.toString().trim(),
    );
    const iFirst = empHdrs.findIndex((h) =>
      h.toString().toLowerCase().includes("first name"),
    );
    const iLast = empHdrs.findIndex((h) =>
      h.toString().toLowerCase().includes("last name"),
    );
    const iDept = empHdrs.findIndex((h) =>
      h.toString().toLowerCase().includes("department"),
    );
    const name = empRow
      ? [empRow[iFirst] || "", empRow[iLast] || ""].join(" ").trim()
      : "";
    const dept = empRow && iDept > -1 ? empRow[iDept] : "";

    const now = new Date();
    
    // 0. Geofence Validation
    if (locationData && locationData.includes("LAT:")) {
       try {
         const lat = parseFloat(locationData.split("LAT: ")[1].split(",")[0]);
         const lng = parseFloat(locationData.split("LNG: ")[1]);
         const geoCheck = validateGeofence(user.employeeNo, lat, lng);
         if (!geoCheck.success) {
           return { success: false, message: geoCheck.message };
         }
       } catch (e) {
         console.warn("Geofencing bypass due to parse error", e);
       }
    }


    // 1. Dynamic Shift Lookup
    let expectedStartTime = null;
    let status = "Present";
    let extraNotes = "";

    try {
      let photoUrl = "";

      const calSheet = getSS_().getSheetByName(SHEET_CALENDAR);
      if (calSheet) {
        const calData = calSheet.getDataRange().getValues();
        const calHeaders = calData[0];
        const iCType = calHeaders.indexOf("Type");
        const iCDate = calHeaders.indexOf("Date");
        const iCStart = calHeaders.indexOf("Start Time");
        const iCTarget = calHeaders.indexOf("Target");

        const todayShift = calData.find((r, i) => {
          if (i === 0) return false;
          const rDate = Utilities.formatDate(
            new Date(r[iCDate]),
            Session.getScriptTimeZone(),
            "yyyy-MM-dd",
          );
          return (
            r[iCType] === "Shift" &&
            r[iCTarget].toString() === user.employeeNo.toString() &&
            rDate === today
          );
        });

        if (todayShift) {
          const timeStr = todayShift[iCStart];
          if (timeStr) {
            const [hh, mm] = timeStr.split(":");
            expectedStartTime = new Date(now);
            expectedStartTime.setHours(
              parseInt(hh, 10),
              parseInt(mm, 10),
              0,
              0,
            );

            const lateMinutes = Math.floor((now - expectedStartTime) / 60000);
            if (lateMinutes > 5) {
              status = lateMinutes + "m Late";
            } else {
              status = "On Time";
            }
            extraNotes = "Shift: " + todayShift[calHeaders.indexOf("Title")];
          }
        }
      }
    } catch (e) {
      console.error("Shift lookup failed", e);
    }

    const id = "ATT-" + new Date().getTime();
    sheet.appendRow([
      id,
      user.employeeNo,
      name,
      dept,
      new Date(),
      now,
      null,
      "",
      status,
      extraNotes,
      locationData || "",
      photoUrl || ""
    ]);

    return {
      success: true,
      timeIn: now.toTimeString().substring(0, 5),
      status: status,
    };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function clockOut(user, locationData) {
  try {
    const today = Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone(),
      "yyyy-MM-dd",
    );
    const sheet = getSS_().getSheetByName(SHEET_ATTENDANCE);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const iEmpNo = headers.indexOf("Employee No.");
    const iDate = headers.indexOf("Date");
    const iTimeIn = headers.indexOf("Time In");
    const iTimeOut = headers.indexOf("Time Out");
    const iHours = headers.indexOf("Hours");

    const rowIdx = data.findIndex(
      (r, i) =>
        i > 0 &&
        r[iEmpNo].toString() === user.employeeNo.toString() &&
        Utilities.formatDate(
          new Date(r[iDate]),
          Session.getScriptTimeZone(),
          "yyyy-MM-dd",
        ) === today,
    );

    if (rowIdx < 1)
      return { success: false, message: "No clock-in found for today." };

    // 0. Geofence Validation
    if (locationData && locationData.includes("LAT:")) {
       try {
         const lat = parseFloat(locationData.split("LAT: ")[1].split(",")[0]);
         const lng = parseFloat(locationData.split("LNG: ")[1]);
         const geoCheck = validateGeofence(user.employeeNo, lat, lng);
         if (!geoCheck.success) {
           return { success: false, message: geoCheck.message };
         }
       } catch (e) {
         console.warn("Geofencing bypass due to parse error", e);
       }
    }

    const timeIn = new Date(data[rowIdx][iTimeIn]);
    const timeOut = new Date();
    const hours = Math.round(((timeOut - timeIn) / 3600000) * 100) / 100;

    sheet.getRange(rowIdx + 1, iTimeOut + 1).setValue(timeOut);
    sheet.getRange(rowIdx + 1, iHours + 1).setValue(hours);


    if (locationData) {
      const iLoc = headers.indexOf("Location");
      if (iLoc > -1) {
        const existing = data[rowIdx][iLoc] || "";
        sheet.getRange(rowIdx + 1, iLoc + 1).setValue(existing + " | OUT: " + locationData);
      }
    }

    return {
      success: true,
      timeOut: timeOut.toTimeString().substring(0, 5),
      hours,
    };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function getMyAttendance(user) {
  try {
    const sheet = getSS_().getSheetByName(SHEET_ATTENDANCE);
    if (!sheet) return { success: true, records: [] };

    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return { success: true, records: [] };

    const headers = data[0];
    const iEmpNo = headers.indexOf("Employee No.");
    if (iEmpNo === -1) return { success: true, records: [] };

    const normalize = (id) => (id || "").toString().trim().toLowerCase().replace(/^0+/, "");
    const searchId = normalize(user.employeeNo);

    const rows = data.slice(1).filter((r) => r[iEmpNo] && normalize(r[iEmpNo]) === searchId);
    
    const records = rows
      .map((r) => {
        const obj = {};
        headers.forEach((h, i) => {
          let val = r[i];
          if (val instanceof Date) val = val.toISOString();
          obj[h.toString()] = val;
        });
        return obj;
      })
      .reverse();

    return { success: true, records };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/**
 * Checks if the employee is currently clocked in (active shift today)
 */
function checkCurrentClockStatus(empNo) {
  try {
    const sheet = getSS_().getSheetByName(SHEET_ATTENDANCE);
    if (!sheet) return false;
    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return false;

    const todayStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
    const headers = data[0];
    const iEmpNo = headers.indexOf("Employee No.");
    const iDate = headers.indexOf("Date");
    const iTimeOut = headers.indexOf("Time Out");

    const normalize = (id) => (id || "").toString().trim().toLowerCase().replace(/^0+/, "");
    const searchId = normalize(empNo);

    const active = data.slice(1).find(r => {
      const isMe = normalize(r[iEmpNo]) === searchId;
      // Handle potential date object
      let dVal = r[iDate];
      if (!dVal) return false;
      const rDate = Utilities.formatDate(new Date(dVal), Session.getScriptTimeZone(), "yyyy-MM-dd");
      return isMe && rDate === todayStr && (!r[iTimeOut] || r[iTimeOut] === "");
    });

    return !!active;
  } catch (e) {
    return false;
  }
}

/**
 * Retrieves an employee's geofence configuration
 */
function getEmployeeGeofence(empNo) {
  try {
    const sheet = getSS_().getSheetByName(SHEET_EMPLOYEES);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const iEmpNo = headers.indexOf("Employee No.");
    const iLat = headers.indexOf("Work Latitude");
    const iLng = headers.indexOf("Work Longitude");
    const iRad = headers.indexOf("Work Radius");

    const row = data.find(r => r[iEmpNo].toString().trim() === empNo.toString().trim());
    if (row && iLat > -1 && row[iLat]) {
      return {
        lat: parseFloat(row[iLat]),
        lng: parseFloat(row[iLng]),
        radius: parseFloat(row[iRad]) || 100 // Default to 100m
      };
    }
    return null; // No geofence set
  } catch (e) {
    return null;
  }
}

/**
 * Verifies if coordinates are within the employee's allowed radius
 */
function validateGeofence(empNo, userLat, userLng) {
  const fence = getEmployeeGeofence(empNo);
  if (!fence) return { success: true, message: "No geofence restriction." };

  const R = 6371e3; // Earth radius in meters
  const φ1 = fence.lat * Math.PI / 180;
  const φ2 = userLat * Math.PI / 180;
  const Δφ = (userLat - fence.lat) * Math.PI / 180;
  const Δλ = (userLng - fence.lng) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c;
  
  if (distance <= fence.radius) {
    return { success: true, distance };
  } else {
    return { 
      success: false, 
      distance, 
      allowed: fence.radius,
      message: `Outside work zone. Distance: ${Math.round(distance)}m (Limit: ${fence.radius}m)` 
    };
  }
}

/**
 * Saves a base64 snapshot to Google Drive folder "Attendance Photos"
 */

/* ============================================================
   ACCESS CONTROL  (Admin only)
============================================================ */

function getAccessControlList() {
  try {
    const sheet = getSS_().getSheetByName(SHEET_ACCESS);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    const accounts = data
      .slice(1)
      .filter((r) => r[0])
      .map((r) => {
        const obj = {};
        headers.forEach((h, i) => {
          obj[h.toString()] = i === 2 ? "••••••" : r[i];
        }); // mask password
        return obj;
      });

    return { success: true, accounts };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function provisionAccount(employeeNo, email, role) {
  return registerUserAccount(employeeNo, email, role);
}

function updateAccountRole(employeeNo, newRole) {
  try {
    const sheet = getSS_().getSheetByName(SHEET_ACCESS);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rowIdx = data.findIndex(
      (r) => r[0].toString() === employeeNo.toString(),
    );

    if (rowIdx < 1) return { success: false, message: "Account not found." };
    sheet.getRange(rowIdx + 1, headers.indexOf("Role") + 1).setValue(newRole);
    return { success: true };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function toggleAccountStatus(employeeNo) {
  try {
    const sheet = getSS_().getSheetByName(SHEET_ACCESS);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rowIdx = data.findIndex(
      (r) => r[0].toString() === employeeNo.toString(),
    );

    if (rowIdx < 1) return { success: false, message: "Account not found." };

    const current = data[rowIdx][headers.indexOf("Status")];
    const next = current === "Active" ? "Inactive" : "Active";
    sheet.getRange(rowIdx + 1, headers.indexOf("Status") + 1).setValue(next);
    return { success: true, newStatus: next };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/* ============================================================
   BOOTSTRAP & REGISTRATION
============================================================ */

/**
 * Run once from the GAS editor to create the first account.
 */
function bootstrapAdmin() {
  const adminEmail = "admin@zksummit.com";
  const adminEmpNo = "ZK-0000";
  const defaultPw = "admin123";

  // 1. Ensure the employee profile exists
  ensureAdminEmployeeRecord_(adminEmpNo, adminEmail);

  // 2. Provision or Update the login credentials
  try {
    const sheet = getSS_().getSheetByName(SHEET_ACCESS);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const iEmpNo = headers.indexOf("Employee No.");
    const iEmail = headers.indexOf("Email");
    const iPw = headers.indexOf("Password Hash");
    const iReset = headers.indexOf("Needs PW Change");

    const hashed = hashPassword_(defaultPw);
    const rowIdx = data.findIndex((r) => r[iEmpNo].toString() === adminEmpNo);

    if (rowIdx > 0) {
      // Update existing record
      sheet.getRange(rowIdx + 1, iEmail + 1).setValue(adminEmail);
      sheet.getRange(rowIdx + 1, iPw + 1).setValue(hashed);
      sheet.getRange(rowIdx + 1, iReset + 1).setValue(true);
      Logger.log("System Admin account updated to " + adminEmail);
    } else {
      // Create new record
      const newRow = new Array(headers.length).fill("");
      newRow[iEmpNo] = adminEmpNo;
      newRow[iEmail] = adminEmail;
      newRow[iPw] = hashed;
      newRow[headers.indexOf("Role")] = "SUPERADMIN";
      newRow[headers.indexOf("Status")] = "Active";
      newRow[iReset] = true;
      sheet.appendRow(newRow);
      Logger.log("System Admin account created for " + adminEmail);
    }
    return { success: true, message: "Bootstrap complete for " + adminEmail };
  } catch (e) {
    Logger.log("Bootstrap Error: " + e.message);
    return { success: false, message: e.message };
  }
}

/**
 * Creates a generic "System Admin" profile in the employee database if missing.
 */
function ensureAdminEmployeeRecord_(empNo, email) {
  try {
    const sheet = getSS_().getSheetByName(SHEET_EMPLOYEES);
    if (!sheet) return;

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const exists = data.some((r) => r[0].toString().trim() === empNo);

    if (!exists) {
      const newRow = new Array(headers.length).fill("");
      newRow[0] = empNo;

      const iFirst = headers.findIndex((h) =>
        h.toString().toLowerCase().includes("first name"),
      );
      const iLast = headers.findIndex((h) =>
        h.toString().toLowerCase().includes("last name"),
      );
      const iEmail = headers.findIndex((h) =>
        h.toString().toLowerCase().includes("email"),
      );
      const iDept = headers.findIndex((h) =>
        h.toString().toLowerCase().includes("department"),
      );
      const iPos = headers.findIndex((h) =>
        h.toString().toLowerCase().includes("position"),
      );
      const iStatus = headers.findIndex(
        (h) => h.toString().toLowerCase() === "status",
      );

      if (iFirst > -1) newRow[iFirst] = "System";
      if (iLast > -1) newRow[iLast] = "Administrator";
      if (iEmail > -1) newRow[iEmail] = email;
      if (iDept > -1) newRow[iDept] = "Management";
      if (iPos > -1) newRow[iPos] = "System Admin";
      if (iStatus > -1) newRow[iStatus] = "Active";

      sheet.appendRow(newRow);
      Logger.log("System Admin employee profile created.");
    }
  } catch (e) {
    Logger.log("Error creating admin profile: " + e.message);
  }
}

function registerUserAccount(employeeNo, email, role, firstName, lastName) {
  try {
    const ss = getSS_();
    const accessSheet = ss.getSheetByName(SHEET_ACCESS);
    const accessData = accessSheet.getDataRange().getValues();

    const existingAc = accessData.some(
      (r) => r[0] && r[0].toString().trim() === employeeNo.toString().trim(),
    );

    // Double-check the Directory profile
    const empSheet = ss.getSheetByName(SHEET_EMPLOYEES);
    const empData = empSheet.getDataRange().getValues();
    const profileMissing = !empData.some(
      (r) => r[0] && r[0].toString().trim() === employeeNo.toString().trim(),
    );

    // If both exist, then it's a true duplicate error.
    // If account exists but profile is missing, we ALLOW it to proceed (Self-Healing)
    if (existingAc && !profileMissing) {
      return {
        success: false,
        message: "Account already exists for " + employeeNo,
      };
    }

    // 1. Dynamic Temp Password (e.g., SUMMIT-9402)
    const suffix = employeeNo.toString().split("-").pop() || "1234";
    const tempPassword = "SUMMIT-" + suffix;

    // 2. Create Access Account (Only if it doesn't already exist)
    if (!existingAc) {
      accessSheet.appendRow([
        employeeNo,
        email,
        hashPassword_(tempPassword),
        role || "Employee",
        "Active",
        "",
        true,
      ]);
    }

    // 3. Unified Directory Sync
    syncEmployeeProfile_(employeeNo, email, firstName, lastName, role);

    return {
      success: true,
      message: "Account created. Temp password: " + tempPassword,
    };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/**
 * Ensures a directory profile exists for a provisioned account.
 */
function syncEmployeeProfile_(id, email, first, last, role) {
  const ss = getSS_();
  const sheet = ss.getSheetByName(SHEET_EMPLOYEES);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  // Map header indices
  const iEmpNo = headers.indexOf("Employee No.");
  const iLast = headers.findIndex((h) =>
    h.toString().toLowerCase().includes("last name"),
  );
  const iFirst = headers.findIndex((h) =>
    h.toString().toLowerCase().includes("first name"),
  );
  const iEmail = headers.findIndex((h) =>
    h.toString().toLowerCase().includes("email"),
  );
  const iDept = headers.findIndex((h) =>
    h.toString().toLowerCase().includes("department"),
  );
  const iPos = headers.findIndex((h) =>
    h.toString().toLowerCase().includes("position"),
  );
  const iStatus = headers.findIndex(
    (h) => h.toString().toLowerCase() === "status",
  );
  const iStart = headers.findIndex((h) =>
    h.toString().toLowerCase().includes("start date"),
  );

  const rowIdx = data.findIndex(
    (r) => r[iEmpNo] && r[iEmpNo].toString() === id.toString(),
  );

  if (rowIdx < 0) {
    // 1. Create a perfectly-sized empty row
    const newRow = new Array(headers.length).fill("");

    // 2. Surgical population
    newRow[iEmpNo] = id;
    if (iLast > -1) newRow[iLast] = last || "Employee";
    if (iFirst > -1) newRow[iFirst] = first || "New";
    if (iEmail > -1) newRow[iEmail] = email;
    if (iDept > -1) newRow[iDept] = "Unassigned";
    if (iPos > -1) newRow[iPos] = role || "Employee";
    if (iStatus > -1) newRow[iStatus] = "Active";
    if (iStart > -1) newRow[iStart] = new Date();

    sheet.appendRow(newRow);
  } else {
    // Update existing shell
    if (iEmail > -1) sheet.getRange(rowIdx + 1, iEmail + 1).setValue(email);
    if (iStatus > -1)
      sheet.getRange(rowIdx + 1, iStatus + 1).setValue("Active");
    if (iStart > -1) {
      const existingStart = sheet.getRange(rowIdx + 1, iStart + 1).getValue();
      if (!existingStart)
        sheet.getRange(rowIdx + 1, iStart + 1).setValue(new Date());
    }
  }
}

/**
 * Calculates the next sequential Employee ID (e.g., ZK-0005)
 */
function getNextEmployeeID() {
  try {
    const sheet = getSS_().getSheetByName(SHEET_EMPLOYEES);
    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return "ZK-0001";

    let maxId = 0;
    data.slice(1).forEach((r) => {
      if (!r[0]) return; // Skip empty rows
      const parts = r[0].toString().split("-");
      if (parts.length > 1) {
        const num = parseInt(parts[1], 10);
        if (!isNaN(num) && num > maxId) maxId = num;
      }
    });

    const nextNum = maxId + 1;
    return "ZK-" + nextNum.toString().padStart(4, "0");
  } catch (e) {
    return "ZK-0001";
  }
}

/* ============================================================
   REPORTING & ANALYTICS
   ============================================================ */

/**
 * Aggregates data from Employees, Leave, and Attendance sheets
 * specifically for Admin/HR reporting dashboard.
 */
function getReportingData(user) {
  try {
    if (
      !user ||
      !["ADMIN", "SUPERADMIN", "HR"].includes(user.role.toUpperCase())
    ) {
      return {
        success: false,
        message: "Unauthorized access to reporting data.",
      };
    }

    // 1. Headcount by Department
    const empSheet = getSS_().getSheetByName(SHEET_EMPLOYEES);
    const empData = empSheet.getDataRange().getValues();
    const empHdrs = empData[0];
    const iDept = empHdrs.findIndex((h) =>
      h.toString().toLowerCase().includes("department"),
    );
    const iStatus = empHdrs.findIndex(
      (h) => h.toString().toLowerCase() === "status",
    );

    const deptDistribution = {};
    const statusDistribution = { Active: 0, Inactive: 0 };

    empData.slice(1).forEach((r) => {
      if (!r[0]) return;
      const dept = r[iDept] || "Unassigned";
      const status = r[iStatus] || "Active";

      deptDistribution[dept] = (deptDistribution[dept] || 0) + 1;
      if (statusDistribution.hasOwnProperty(status)) {
        statusDistribution[status]++;
      } else {
        statusDistribution[status] = (statusDistribution[status] || 0) + 1;
      }
    });

    // 2. Leave Distribution (Types & Approval Status)
    const leaveSheet = getSS_().getSheetByName(SHEET_LEAVE);
    const leaveData = leaveSheet ? leaveSheet.getDataRange().getValues() : [];
    const leaveTypeDist = {};
    const leaveStatusDist = { Approved: 0, Pending: 0, Rejected: 0 };

    if (leaveData.length > 1) {
      const lHdrs = leaveData[0];
      const iLType = lHdrs.indexOf("Leave Type");
      const iLStatus = lHdrs.indexOf("Status");

      leaveData.slice(1).forEach((r) => {
        if (!r[0]) return;
        const type = r[iLType] || "Other";
        const st = r[iLStatus] || "Pending";

        leaveTypeDist[type] = (leaveTypeDist[type] || 0) + 1;
        if (leaveStatusDist.hasOwnProperty(st)) {
          leaveStatusDist[st]++;
        }
      });
    }

    // 3. Attendance Distribution (Last 30 days)
    const attSheet = getSS_().getSheetByName(SHEET_ATTENDANCE);
    const attData = attSheet ? attSheet.getDataRange().getValues() : [];
    const attendanceDist = { Present: 0, Absent: 0, "On Leave": 0 };

    if (attData.length > 1) {
      const aHdrs = attData[0];
      const iAStatus = aHdrs.indexOf("Status");
      attData.slice(1).forEach((r) => {
        if (!r[0]) return;
        const st = r[iAStatus] || "Present";
        if (attendanceDist.hasOwnProperty(st)) {
          attendanceDist[st]++;
        }
      });
    }

    return {
      success: true,
      data: {
        departments: deptDistribution,
        employeeStatus: statusDistribution,
        leaveTypes: leaveTypeDist,
        leaveStatus: leaveStatusDist,
        attendance: attendanceDist,
      },
    };
  } catch (e) {
    return { success: false, message: "Reporting Error: " + e.message };
  }
}

/* ============================================================
   NOTIFICATION ENGINE (PHASE 2)
   ============================================================ */

/**
 * Internal helper to add a notification
 */
function addNotification_(userId, tier, type, title, message) {
  try {
    const sheet = getSS_().getSheetByName(SHEET_NOTIFICATIONS);
    const id = "NOT-" + new Date().getTime();
    sheet.appendRow([
      id,
      userId,
      tier,
      type,
      title,
      message,
      "Unread",
      new Date(),
    ]);
    Logger.log(`Notification Created: ${id} for ${userId}`);
    return id;
  } catch (e) {
    Logger.log("Error adding notification: " + e.message);
    return null;
  }
}

/**
 * API for Client to get user notifications
 */
function getNotifications(user) {
  try {
    if (!user || !user.employeeNo)
      return { success: false, message: "Invalid session." };

    const sheet = getSS_().getSheetByName(SHEET_NOTIFICATIONS);
    if (!sheet) return { success: true, count: 0, items: [] };

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const iUserIdx = headers.indexOf("User ID");
    const iStatusIdx = headers.indexOf("Status");
    const iTierIdx = headers.indexOf("Tier");

    const role = (user.role || "").toString().toUpperCase();
    const isAdmin = ["ADMIN", "SUPERADMIN", "HR"].includes(role);

    // Filter for current user and non-archived notifications
    // Admins also see "SYSTEM" and "SUPPORT" tier notifications
    const items = data
      .slice(1)
      .filter((r) => {
        const targetUser = r[iUserIdx].toString();
        const tier = r[iTierIdx].toString().toUpperCase();
        const status = r[iStatusIdx].toString();

        if (status === "Archived") return false;

        // Condition 1: Direct notification to user
        if (targetUser === user.employeeNo.toString()) return true;

        // Condition 2: Admin/HR seeing system/support broadcasts
        if (isAdmin && (tier === "SYSTEM" || tier === "SUPPORT")) return true;

        return false;
      })
      .map((r) => {
        const obj = {};
        headers.forEach((h, i) => {
          obj[h.toString().toLowerCase().replace(" ", "")] = r[i];
        });
        return obj;
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return {
      success: true,
      items: items,
      count: items.filter((i) => i.status === "Unread").length,
    };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/**
 * Internal logger for system-wide events
 */
function logSystemNotification_(title, message, tier = "SYSTEM", target = "ALL") {
  try {
    const sheet = getSS_().getSheetByName(SHEET_NOTIFICATIONS);
    if (!sheet) return;
    const id = "NOTIF-" + Date.now();
    sheet.appendRow([
      id,
      target, // User ID or ALL
      tier,   // SYSTEM / SUPPORT
      "Alert",
      title,
      message,
      "Unread",
      new Date().toISOString()
    ]);
  } catch (e) {
    console.error("Log error", e);
  }
}

function submitSupportRequest(data) {
  try {
    logSystemNotification_(
      "Support Request: " + (data.type || "General"),
      `Request from ${data.email || "Unknown"}: ${data.message}`,
      "SUPPORT",
      "ALL"
    );
    return { success: true, message: "Request sent. Support will contact you shortly." };
  } catch (e) {
    return { success: false, message: e.message };
  }
}
function markNotificationRead(notifId) {
  try {
    const sheet = getSS_().getSheetByName(SHEET_NOTIFICATIONS);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const iId = headers.indexOf("ID");
    const rowIdx = data.findIndex((r) => r[iId] === notifId);

    if (rowIdx < 1)
      return { success: false, message: "Notification not found." };

    sheet.getRange(rowIdx + 1, headers.indexOf("Status") + 1).setValue("Read");
    return { success: true };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function archiveNotification(notifId) {
  try {
    const sheet = getSS_().getSheetByName(SHEET_NOTIFICATIONS);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const iId = headers.indexOf("ID");
    const rowIdx = data.findIndex((r) => r[iId] === notifId);

    if (rowIdx < 1)
      return { success: false, message: "Notification not found." };

    sheet
      .getRange(rowIdx + 1, headers.indexOf("Status") + 1)
      .setValue("Archived");
    return { success: true };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/**
 * Automates Tier 2 cleanup (Daily Trigger)
 */
function autoArchiveNotifications() {
  const sheet = getSS_().getSheetByName(SHEET_NOTIFICATIONS);
  if (!sheet) return;

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const iTier = headers.indexOf("Tier");
  const iStatus = headers.indexOf("Status");
  const iTime = headers.indexOf("Timestamp");

  const now = new Date();
  const threshold = 30; // days

  data.forEach((r, idx) => {
    if (idx === 0) return;
    const tier = parseInt(r[iTier]);
    const status = r[iStatus];
    const timestamp = new Date(r[iTime]);

    if (tier === 2 && status !== "Archived") {
      const diff = (now - timestamp) / (1000 * 60 * 60 * 24);
      if (diff > threshold) {
        sheet.getRange(idx + 1, iStatus + 1).setValue("Archived");
      }
    }
  });
}

/**
 * Sends a premium Summit Gold branded email
 */
function sendEmailNotification_(to, subject, title, message) {
  const htmlBody = `
    <div style="font-family:'Inter', sans-serif; background-color:#faf6eb; padding:40px; color:#1c1707;">
      <div style="max-width:600px; margin:0 auto; background-color:#ffffff; border-radius:12px; overflow:hidden; border:1px solid rgba(28, 23, 7, 0.1); box-shadow:0 4px 18px rgba(0,0,0,0.04);">
        <div style="background-color:#c9a236; padding:32px; text-align:center;">
          <h1 style="color:#ffffff; margin:0; font-family:'DM Serif Display', serif; font-size:24px; letter-spacing:-0.4px;">Summit HRIS</h1>
          <p style="color:rgba(255,255,255,0.8); margin:8px 0 0; font-size:14px; text-transform:uppercase; letter-spacing:1px;">System Alert</p>
        </div>
        <div style="padding:40px;">
          <h2 style="margin-top:0; font-family:'DM Serif Display', serif; font-size:22px; color:#1c1707;">${title}</h2>
          <p style="line-height:1.6; color:#796120; font-size:16px;">${message}</p>
          <div style="margin-top:32px; padding-top:24px; border-top:1px solid rgba(28, 23, 7, 0.05); text-align:center;">
            <a href="${ScriptApp.getService().getUrl()}" style="display:inline-block; background-color:#c9a236; color:#ffffff; padding:12px 28px; border-radius:6px; text-decoration:none; font-weight:600; font-size:14px;">Go to Workspace</a>
          </div>
        </div>
        <div style="background-color:#faf6eb; padding:20px; text-align:center; font-size:12px; color:#a1822b;">
          &copy; ${new Date().getFullYear()} Summit Enterprise HRIS · Automatic System Notification
        </div>
      </div>
    </div>
  `;

  try {
    MailApp.sendEmail({
      to: to,
      subject: `[Summit] ${subject}`,
      htmlBody: htmlBody,
    });
    Logger.log("Email sent to " + to);
  } catch (e) {
    Logger.log("Email send failed: " + e.message);
  }
}

/* ============================================================
   TALENT & GROWTH (PHASE 3)
   ============================================================ */

/**
 * Fetches OKR hierarchy for a specific user
 */
function getOKRData(user) {
  try {
    if (!user || !user.employeeNo)
      return { success: false, message: "Invalid session." };

    const sheet = getSS_().getSheetByName(SHEET_OKR);
    if (!sheet) return { success: true, objectives: [] };

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const iEmpNo = headers.indexOf("Employee No.");
    const iParent = headers.indexOf("Parent ID");

    // Filter records for the user
    const userRecords = data
      .slice(1)
      .filter((r) => r[iEmpNo].toString() === user.employeeNo.toString());

    if (userRecords.length === 0) return { success: true, objectives: [] };

    // Group into hierarchy
    const objectives = [];
    const krMap = {};

    userRecords.forEach((r) => {
      const obj = {};
      headers.forEach((h, i) => {
        obj[h.toLowerCase().replace(" ", "")] = r[i];
      });

      const parentId = r[iParent];
      if (!parentId) {
        obj.keyresults = [];
        objectives.push(obj);
      } else {
        if (!krMap[parentId]) krMap[parentId] = [];
        krMap[parentId].push(obj);
      }
    });

    // Attach KRs to Objectives
    objectives.forEach((obj) => {
      if (krMap[obj.id]) obj.keyresults = krMap[obj.id];
    });

    return { success: true, objectives };
  } catch (e) {
    return { success: false, message: "OKR Error: " + e.message };
  }
}

/**
 * Updates progress for a specific Key Result
 */
function updateKRProgress(krId, newVal) {
  try {
    const sheet = getSS_().getSheetByName(SHEET_OKR);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const iId = headers.indexOf("ID");
    const iCur = headers.indexOf("Current");

    const rowIdx = data.findIndex((r) => r[iId] === krId);
    if (rowIdx < 1) return { success: false, message: "KR not found." };

    sheet.getRange(rowIdx + 1, iCur + 1).setValue(newVal);
    return { success: true };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/**
 * Fetches reviews where user is Employee OR Manager
 */
function getPerformanceReviews(user) {
  try {
    if (!user || !user.employeeNo)
      return { success: false, message: "Invalid session." };

    const sheet = getSS_().getSheetByName(SHEET_PERFORMANCE);
    if (!sheet) return { success: true, reviews: [] };

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const iEmp = headers.indexOf("Employee No.");
    const iMgr = headers.indexOf("Manager No.");

    const reviews = data
      .slice(1)
      .filter(
        (r) =>
          r[iEmp].toString() === user.employeeNo.toString() ||
          r[iMgr].toString() === user.employeeNo.toString(),
      )
      .map((r) => {
        const obj = {};
        headers.forEach((h, i) => {
          obj[h.toLowerCase().replace(" ", "")] = r[i];
        });
        return obj;
      });

    return { success: true, reviews };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/**
 * --- ENTERPRISE LEAVE LEDGER ---
 * Calculates categorized balances: SIL (5), Additional (Tenure), Birthday (1)
 */
function getLeaveBalanceSummary(empNo, user) {
  try {
    const ss = getSS_();
    const balanceSheet = ss.getSheetByName(SHEET_LEAVE_BALANCES);
    const leaveSheet = ss.getSheetByName(SHEET_LEAVE);
    
    if (!balanceSheet) throw new Error("Leave Balances sheet not found.");

    const today = new Date();
    const normalize = (id) => (id || "").toString().trim().toLowerCase();
    const searchId = normalize(empNo);

    // 1. Fetch Entitlements from LEAVE BALANCES sheet
    const balData = balanceSheet.getDataRange().getValues();
    const balHdrs = balData[0].map(h => h.toString().toLowerCase().trim());
    const iEmpId = balHdrs.indexOf("employee no.");
    
    const row = balData.find(r => normalize(r[iEmpId]) === searchId);

    const allowances = { SIL: 0, Tenure: 0, Birthday: 0 };
    if (row) {
      const iSIL = balHdrs.indexOf("sil entitlement");
      const iTenure = balHdrs.indexOf("tenure entitlement");
      const iBday = balHdrs.indexOf("birthday leave");
      
      if (iSIL > -1) allowances.SIL = parseFloat(row[iSIL]) || 0;
      if (iTenure > -1) allowances.Tenure = parseFloat(row[iTenure]) || 0;
      if (iBday > -1) allowances.Birthday = parseFloat(row[iBday]) || 0;
    }

    // 2. Calculate Period Usage (Dec 1 - Nov 30)
    let fiscalStart = new Date(today.getFullYear(), 11, 1);
    if (today < fiscalStart) fiscalStart = new Date(today.getFullYear() - 1, 11, 1);
    
    let consumed = 0;
    if (leaveSheet) {
      const leaveData = leaveSheet.getDataRange().getValues();
      const lHdrs = leaveData[0].map(h => h.toString().toLowerCase().trim());
      const iEmp = lHdrs.indexOf("employee no.");
      const iStart = lHdrs.indexOf("start date");
      const iStatus = lHdrs.indexOf("status");
      const iDays = lHdrs.indexOf("days");

      leaveData.slice(1).forEach(r => {
        const empMatch = normalize(r[iEmp]) === searchId;
        const statusMatch = r[iStatus] === "Approved";
        const startDate = new Date(r[iStart]);
        
        if (empMatch && statusMatch && startDate >= fiscalStart) {
          consumed += parseFloat(r[iDays]) || 0;
        }
      });
    }

    const totalEntitlement = allowances.SIL + allowances.Tenure + allowances.Birthday;
    const remaining = Math.max(0, totalEntitlement - consumed);

    // 3. Optional: Sync the Remaining value back to the Ledger for auditing
    if (row) {
      const iUsed = balHdrs.indexOf("used");
      const iRem = balHdrs.indexOf("remaining");
      const iUpdate = balHdrs.indexOf("last updated");
      const rowIdx = balData.indexOf(row);
      if (iUsed > -1) balanceSheet.getRange(rowIdx + 1, iUsed + 1).setValue(consumed);
      if (iRem > -1) balanceSheet.getRange(rowIdx + 1, iRem + 1).setValue(remaining);
      if (iUpdate > -1) balanceSheet.getRange(rowIdx + 1, iUpdate + 1).setValue(new Date());
    }

    return {
      success: true,
      summary: remaining,
      details: {
        entitlements: allowances,
        consumed: consumed,
        remaining: remaining,
        periodStart: fiscalStart.toISOString()
      }
    };
  } catch (e) {
    console.error("getLeaveBalanceSummary Error:", e);
    return { success: false, message: e.message, summary: 0 };
  }
}

/**
 * Submits feedback for a performance review cycle
 */
function submitReviewFeedback(reviewId, field, feedback, rating) {
  try {
    const sheet = getSS_().getSheetByName(SHEET_PERFORMANCE);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const iId = headers.indexOf("ID");
    const rowIdx = data.findIndex((r) => r[iId] === reviewId);

    if (rowIdx < 1)
      return { success: false, message: "Review cycle not found." };

    const colIdx = headers.indexOf(field);
    if (colIdx < 0)
      return { success: false, message: "Invalid feedback field." };

    sheet.getRange(rowIdx + 1, colIdx + 1).setValue(feedback);

    // If manager submits, update rating and status
    if (field === "Manager Feedback") {
      if (rating)
        sheet
          .getRange(rowIdx + 1, headers.indexOf("Rating") + 1)
          .setValue(rating);
      sheet
        .getRange(rowIdx + 1, headers.indexOf("Status") + 1)
        .setValue("Finalized");
    } else {
      sheet
        .getRange(rowIdx + 1, headers.indexOf("Status") + 1)
        .setValue("Self-Reviewed");
    }

    return { success: true };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/**
 * Fetches calendar entries (Events & Shifts) for a given month/year.
 */
function getCalendarEntries(month, year, user) {
  try {
    // Safety Guard: Handle cases where the client-side App.user is not yet fully initialized
    if (!user || !user.role) {
      const activeUser = getCurrentUserInternal_();
      user = activeUser || { role: "GUEST", employeeNo: "SYSTEM" };
    }

    const ss = getSS_();
    
    const sheet = ss.getSheetByName(SHEET_CALENDAR);
    if (!sheet) return { success: true, entries: [] };

    const data = sheet.getDataRange().getValues();
    const headers = data[0].map((h) => h.toString().trim());
    const rows = data.slice(1);

    const iId = headers.indexOf("ID");
    const iType = headers.indexOf("Type");
    const iCat = headers.indexOf("Category");
    const iStartD = headers.indexOf("StartDate");
    const iEndD = headers.indexOf("EndDate");
    const iStartT = headers.indexOf("StartTime");
    const iEndT = headers.indexOf("EndTime");
    const iTitle = headers.indexOf("Title");
    const iLoc = headers.indexOf("Location");
    const iNote = headers.indexOf("Notification");
    const iMand = headers.indexOf("Mandatory");
    const iRem = headers.indexOf("Remarks");
    const iColl = headers.indexOf("Collaborators");

    // Safe Date Parser (Prevents timezone-shift data loss)
    const parseDateSafe = (val) => {
      if (!val) return null;
      if (val instanceof Date) {
        return new Date(val.getFullYear(), val.getMonth(), val.getDate());
      }
      
      // Isolate the date segment (strip "8:00:00" etc)
      const datePart = val.toString().split(/[ T]/)[0];
      const parts = datePart.split(/[-/]/).map(Number);
      
      if (parts.length === 3) {
        // Handle YYYY-MM-DD
        if (parts[0] > 1900) return new Date(parts[0], parts[1] - 1, parts[2]);
        // Handle MM/DD/YYYY
        return new Date(parts[2], parts[0] - 1, parts[1]);
      }
      const fallback = new Date(val);
      return isNaN(fallback.getTime()) ? null : fallback;
    };

    const firstOfMonth = new Date(year, month, 1);
    const lastOfMonth = new Date(year, month + 1, 0);

    const fmtDate = (val) => {
      if (!val) return "";
      const d = (val instanceof Date) ? val : parseDateSafe(val);
      if (!d || isNaN(d.getTime())) return "";
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };

    const entries = rows
      .filter((r) => {
        if (iStartD === -1) return false;
        const start = parseDateSafe(r[iStartD]);
        const end = iEndD > -1 && r[iEndD] ? parseDateSafe(r[iEndD]) : start;
        return start && start <= lastOfMonth && (end || start) >= firstOfMonth;
      })
      .filter((r) => {
        const role = (user.role || "").toString().toUpperCase().trim();
        if (["ADMIN", "SUPERADMIN", "HR"].includes(role)) return true;

        const collaborators = r[iColl] ? r[iColl].toString() : "";
        if (!collaborators || collaborators === "ALL") return true;

        const collList = collaborators.split(",").map((c) => c.trim().toLowerCase());
        const myId = (user.employeeNo || "").toString().toLowerCase();
        const myDept = (user.department || "").toString().toLowerCase();
        return collList.includes(myId) || collList.includes(myDept);
      })
      .map((r) => ({
        id: String(r[iId] || ""),
        type: r[iType] || "",
        category: iCat > -1 ? r[iCat] : "",
        startDate: fmtDate(r[iStartD]),
        endDate: iEndD > -1 && r[iEndD] ? fmtDate(r[iEndD]) : fmtDate(r[iStartD]),
        startTime: iStartT > -1 ? r[iStartT] : "",
        endTime: iEndT > -1 ? r[iEndT] : "",
        title: r[iTitle] || "",
        location: iLoc > -1 ? r[iLoc] : "",
        notification: iNote > -1 ? r[iNote] : "",
        isMandatory: iMand > -1 ? r[iMand] === "Yes" : false,
        remarks: iRem > -1 ? r[iRem] : "",
        collaborators: iColl > -1 ? r[iColl] : "",
      }));

    return { success: true, entries };
  } catch (e) {
    console.error("Fetch Calendar Error:", e);
    return { success: false, message: e.message };
  }
}

/**
 * Saves a new Calendar entry (Shift or Event).
 */
function saveCalendarEntry(entryData) {
  try {
    // Standard Authorization Gate
    let activeUser = getCurrentUserInternal_();
    
    // Fallback: If session email is missing (common in some GAS states), 
    // verify via the provided adminNo from the authenticated client session
    if (!activeUser && entryData.adminNo) {
      const ssAcc = getSS_();
      const accSheet = ssAcc.getSheetByName(SHEET_ACCESS);
      const accData = accSheet.getDataRange().getValues();
      const row = accData.find(r => r[0].toString() === entryData.adminNo.toString());
      if (row) {
        activeUser = { employeeNo: row[0], role: row[3] };
      }
    }

    if (
      !activeUser ||
      !["ADMIN", "SUPERADMIN", "HR"].includes(activeUser.role.toString().toUpperCase().trim())
    ) {
      throw new Error("Unauthorized: Professional access required.");
    }

    const ss = getSS_();
    let sheet = ss.getSheetByName(SHEET_CALENDAR);
    const HEADERS = [
      "ID",
      "Type",
      "Category",
      "StartDate",
      "EndDate",
      "StartTime",
      "EndTime",
      "Title",
      "Location",
      "Notification",
      "Mandatory",
      "Remarks",
      "Collaborators",
      "CreatedBy",
      "Timestamp",
    ];

    if (!sheet) {
      sheet = ss.insertSheet(SHEET_CALENDAR);
      sheet.appendRow(HEADERS);
    } else if (sheet.getLastColumn() < HEADERS.length) {
      // Automatic migration to new schema if old one exists
      sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    }

    const cleanDate = (val) => {
      if (!val) return "";
      const dt = new Date(val);
      if (isNaN(dt.getTime())) return val;
      return Utilities.formatDate(dt, Session.getScriptTimeZone(), "yyyy-MM-dd");
    };

    const id = "CAL-" + Date.now();
    const row = [
      id,
      entryData.type || "Single",
      entryData.category || "General Sync",
      cleanDate(entryData.startDate),
      cleanDate(entryData.endDate || entryData.startDate),
      entryData.startTime || "",
      entryData.endTime || "",
      entryData.title || "Untitled Event",
      entryData.location || "",
      entryData.notification || "None",
      entryData.isMandatory ? "Yes" : "No",
      entryData.remarks || "",
      entryData.collaborators || "",
      activeUser.employeeNo,
      new Date(),
    ];

    sheet.appendRow(row);

    // TRIGGER Notifications (Simplistic implementation for MVP)
    if (entryData.collaborators) {
      try {
        sendCalendarInboundAlert_(id, entryData, activeUser);
      } catch (err) {
        console.error("Notification trigger failed:", err);
      }
    }

    return { success: true, message: "Entry saved successfully." };
  } catch (e) {
    console.error("Save Calendar Error:", e);
    return { success: false, message: e.message };
  }
}

/**
 * Searches for collaborators (Employees or Departments).
 */
function searchCollaborators(query) {
  try {
    const ss = getSS_();
    const empSheet = ss.getSheetByName(SHEET_EMPLOYEES);
    const data = empSheet.getDataRange().getValues();
    const headers = data[0].map((h) => h.toString().toLowerCase());
    const rows = data.slice(1);

    const iId = headers.findIndex(
      (h) => h.includes("employee no") || h === "id",
    );
    const iFirst = headers.findIndex((h) => h.includes("first name"));
    const iLast = headers.findIndex((h) => h.includes("last name"));
    const iDept = headers.findIndex(
      (h) => h.includes("dept") || h.includes("unit"),
    );

    const q = query.toLowerCase();
    const results = [];
    const depts = new Set();

    rows.forEach((r) => {
      const id = r[iId];
      const name = `${r[iFirst]} ${r[iLast]}`.trim();
      const dept = r[iDept];

      if (name.toLowerCase().includes(q) || id.toString().includes(q)) {
        results.push({ type: "employee", id, name, dept });
      }
      if (dept) depts.add(dept);
    });

    // Add matching departments
    depts.forEach((d) => {
      if (d.toLowerCase().includes(q)) {
        results.push({ type: "department", id: d, name: d });
      }
    });

    return { success: true, results: results.slice(0, 10) };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/**
 * Internal notification sender for new calendar entries.
 */
function sendCalendarInboundAlert_(id, entry, sender) {
  // Mock notification / System log
  console.log(
    `[ALERT] New Calendar Entry ${id} created by ${sender.name}. Notifying: ${entry.collaborators}`,
  );

  // If tagging "ALL", send to general announcement if exists
  // For individual tags, one could loop and send MailApp.sendEmail...
}

/**
 * Deletes a calendar entry.
 */
function deleteCalendarEntry(id) {
  try {
    // SECURITY: Get current user from server-state for verification
    const activeUser = getCurrentUserInternal_();
    if (
      !activeUser ||
      !["ADMIN", "SUPERADMIN", "HR"].includes(activeUser.role.toUpperCase())
    ) {
      throw new Error("Unauthorized: Admin or HR access required.");
    }

    const ss = getSS_();
    const sheet = ss.getSheetByName(SHEET_CALENDAR);
    const data = sheet.getDataRange().getValues();
    const idx = data.findIndex((r) => r[0] === id);
    if (idx > -1) {
      sheet.deleteRow(idx + 1);
      return { success: true, message: "Entry deleted." };
    }
    throw new Error("Entry not found.");
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/**
 * Internal utility to get current user role/details based on session.
 */
function getCurrentUserInternal_() {
  try {
    const userEmail = Session.getActiveUser().getEmail();
    const sheet = getSS_().getSheetByName(SHEET_ACCESS);
    if (!sheet) return null;
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const iEmpNo = headers.indexOf("Employee No.");
    const iEmail = headers.indexOf("Email");
    const iRole = headers.indexOf("Role");

    if (!userEmail) {
      // In some environments, getActiveUser is restricted. 
      // We fall back to the last stamped login if we can't get an email.
      // But for maximum security, we'll suggest re-authorization here.
      console.warn("Active user email is empty. Session may be restricted.");
    }

    const row = data.find(r => 
      r[iEmail] && r[iEmail].toString().trim().toLowerCase() === userEmail.toLowerCase()
    );

    if (row) {
      return { 
        employeeNo: row[iEmpNo], 
        email: row[iEmail], 
        role: row[iRole] 
      };
    }

    // FINAL FALLBACK: Check CacheService if Google Session is restricted
    try {
      const cachedNo = CacheService.getUserCache().get("summit_emp_no");
      if (cachedNo) {
        const cachedRow = data.find(r => r[iEmpNo].toString() === cachedNo.toString());
        if (cachedRow) {
          return { 
            employeeNo: cachedRow[iEmpNo], 
            email: cachedRow[iEmail], 
            role: cachedRow[iRole] 
          };
        }
      }
    } catch(e) { console.warn("Cache recovery failed", e); }
    
    return null;
  } catch (e) {
    console.error("Session resolution error", e);
    return null;
  }
}

/**
 * Public session resolver for backend updates
 */
function getSessionUser() {
  return getCurrentUserInternal_();
}

/**
 * Server-side logout (Cache Purge)
 */
function logoutUser() {
  try {
    const cache = CacheService.getUserCache();
    cache.remove("summit_emp_no");
  } catch(e) { console.error("Logout cache clear failed", e); }
}

/**
 * FETCH: Announcements (Bulletproof Dynamic Mapping)
 */
function getAnnouncements() {
  try {
    const sheet = getSS_().getSheetByName(SHEET_ANNOUNCEMENTS);
    if (!sheet) return [];

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];

    const hdrs = data[0].map((h) => h.toString().toLowerCase().trim());

    // Flexible header mapping (synonyms)
    const iId = hdrs.indexOf("id");
    const iTs = hdrs.indexOf("timestamp") > -1 ? hdrs.indexOf("timestamp") : 1;
    const iPrio = hdrs.indexOf("priority") > -1 ? hdrs.indexOf("priority") : 2;
    const iCat = hdrs.indexOf("category") > -1 ? hdrs.indexOf("category") : 3;
    const iTitle = hdrs.indexOf("title") > -1 ? hdrs.indexOf("title") : 4;
    const iMsg =
      hdrs.indexOf("message") > -1
        ? hdrs.indexOf("message")
        : hdrs.indexOf("content") > -1
          ? hdrs.indexOf("content")
          : 5;
    const iAuthor = hdrs.indexOf("author") > -1 ? hdrs.indexOf("author") : 6;

    return data
      .slice(1)
      .filter((r) => r[iId] || r[iTitle]) // Ensure it has at least an ID or Title
      .map((r) => ({
        id: r[iId] || "ANN-LEGACY",
        timestamp:
          r[iTs] instanceof Date
            ? r[iTs].toISOString()
            : r[iTs] || new Date().toISOString(),
        priority: r[iPrio] || "Normal",
        category: r[iCat] || "Update",
        title: r[iTitle] || "Important Update",
        message: r[iMsg] || "", // If this is empty, it means the column was likely not found or empty
        author: r[iAuthor] || "System",
      }))
      .sort((a, b) => {
        const pA = a.priority === "High" ? 1 : 0;
        const pB = b.priority === "High" ? 1 : 0;
        if (pA !== pB) return pB - pA;
        return new Date(b.timestamp) - new Date(a.timestamp);
      })
      .slice(0, 10);
  } catch (e) {
    console.error("getAnnouncements Error:", e);
    return [];
  }
}

/**
 * SAVE: Announcement (Self-Healing & Identity-Aware)
 */
function saveAnnouncement(payload) {
  try {
    // 1. Resolve active user (Session -> Fallback verified ID)
    let activeUser = getCurrentUserInternal_();
    if (!activeUser && payload.userNo) {
      const accessSheet = getSS_().getSheetByName(SHEET_ACCESS);
      const accessData = accessSheet.getDataRange().getValues();
      const row = accessData.find(
        (r) => r[0].toString() === payload.userNo.toString(),
      );
      if (row) {
        activeUser = { employeeNo: row[0], email: row[1], role: row[3] };
      }
    }

    if (
      !activeUser ||
      !["ADMIN", "SUPERADMIN", "HR"].includes(activeUser.role.toUpperCase())
    ) {
      throw new Error(
        `Unauthorized. identification: ${activeUser ? activeUser.role : "Guest"}`,
      );
    }

    const sheet = getSS_().getSheetByName(SHEET_ANNOUNCEMENTS);
    let data = sheet.getDataRange().getValues();
    const hdrs = data[0].map((h) => h.toString().toLowerCase().trim());

    // ... same header indices as before ...
    const iId = hdrs.indexOf("id");
    const iTs = hdrs.indexOf("timestamp") > -1 ? hdrs.indexOf("timestamp") : 1;
    const iPrio = hdrs.indexOf("priority") > -1 ? hdrs.indexOf("priority") : 2;
    const iCat = hdrs.indexOf("category") > -1 ? hdrs.indexOf("category") : 3;
    const iTitle = hdrs.indexOf("title") > -1 ? hdrs.indexOf("title") : 4;
    const iMsg =
      hdrs.indexOf("message") > -1
        ? hdrs.indexOf("message")
        : hdrs.indexOf("content") > -1
          ? hdrs.indexOf("content")
          : 5;
    const iAuthor = hdrs.indexOf("author") > -1 ? hdrs.indexOf("author") : 6;

    const id = payload.id || "ANN-" + Date.now();
    const isUpdate = !!payload.id;

    let rowIndex = isUpdate ? data.findIndex((r) => r[iId] === id) : -1;
    let newRow;

    if (isUpdate && rowIndex > -1) {
      newRow = data[rowIndex];
    } else {
      newRow = new Array(Math.max(hdrs.length, 7)).fill("");
      if (iId > -1) newRow[iId] = id;
      if (iTs > -1) newRow[iTs] = new Date();
      if (iAuthor > -1) newRow[iAuthor] = activeUser.employeeNo;
    }

    // Update fields
    if (iPrio > -1) newRow[iPrio] = payload.priority || "Normal";
    if (iCat > -1) newRow[iCat] = payload.category || "Update";
    if (iTitle > -1) newRow[iTitle] = payload.title || "";
    if (iMsg > -1) newRow[iMsg] = payload.message || "";

    if (isUpdate && rowIndex > -1) {
      sheet.getRange(rowIndex + 1, 1, 1, newRow.length).setValues([newRow]);
    } else {
      sheet.appendRow(newRow);
    }

    SpreadsheetApp.flush();
    return { success: true };
  } catch (e) {
    console.error("saveAnnouncement Error:", e);
    return { success: false, message: e.message };
  }
}

/**
 * DELETE: Announcement
 */
function deleteAnnouncement(annId, userNo) {
  try {
    let activeUser = getCurrentUserInternal_();

    // Identity fallback
    if (!activeUser && userNo) {
      const accessSheet = getSS_().getSheetByName(SHEET_ACCESS);
      const accessData = accessSheet.getDataRange().getValues();
      const row = accessData.find((r) => r[0].toString() === userNo.toString());
      if (row) {
        activeUser = { employeeNo: row[0], email: row[1], role: row[3] };
      }
    }

    if (
      !activeUser ||
      !["ADMIN", "SUPERADMIN", "HR"].includes(activeUser.role.toUpperCase())
    ) {
      throw new Error(
        `Unauthorized delete attempt: ${activeUser ? activeUser.role : "Guest"}`,
      );
    }

    const sheet = getSS_().getSheetByName(SHEET_ANNOUNCEMENTS);
    const data = sheet.getDataRange().getValues();
    const hdrs = data[0].map((h) => h.toString().toLowerCase().trim());
    const iId = hdrs.indexOf("id");

    if (iId === -1) throw new Error("ID column not found");

    const rowIndex = data.findIndex((r) => r[iId] === annId);
    if (rowIndex === -1) throw new Error("Announcement not found");

    sheet.deleteRow(rowIndex + 1); // 1-indexed
    return { success: true };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/* ============================================================
   MAINTENANCE & DATABASE STABILIZATION
   Run MAINTENANCE_RUN_ALL_SYNCS() to stabilize the database.
 ============================================================ */

/**
 * MASTER MAINTENANCE FUNCTION
 * Run this to consolidate data and sync the database with the HRIS system.
 */
function MAINTENANCE_RUN_ALL_SYNCS() {
  Logger.log("Starting Database Stabilization...");
  
  // 1. Initialize Missing Sheets & Structure
  setupDatabase_();
  
  // 2. Sync Employee Data from Response Form
  MAINTENANCE_SYNC_EMPLOYEES_FROM_FORM();
  
  // 3. Consolidate OKRs
  MAINTENANCE_CONSOLIDATE_SHEETS("Goals and OKRs", SHEET_OKR, true);
  
  // 4. Consolidate Attendance
  MAINTENANCE_CONSOLIDATE_SHEETS("Attendance", SHEET_ATTENDANCE, false);
  
  // 5. Aggressive Purge of all Legacy/Redundant Sheets
  MAINTENANCE_PURGE_NON_SYSTEM_SHEETS();
  
  Logger.log("Database Stabilization & Complete Purge Success.");
}

/**
 * Maps "Response Form" data to the 38-column "Employee Database" system schema.
 */
function MAINTENANCE_SYNC_EMPLOYEES_FROM_FORM() {
  const ss = getSS_();
  const formSheet = ss.getSheetByName("Response Form");
  if (!formSheet) {
    Logger.log("Response Form not found. Skipping employee sync.");
    return;
  }
  
  const destSheet = ss.getSheetByName(SHEET_EMPLOYEES);
  const formData = formSheet.getDataRange().getValues();
  const formHdrs = formData[0].map(h => h.toString().toLowerCase().trim());
  const destSheetExists = !!destSheet;
  
  if (!destSheetExists) {
    Logger.log("Destination Employee Database not found. Please run setupDatabase_ first.");
    return;
  }
  
  Logger.log("Syncing " + (formData.length - 1) + " records to Employee Database...");
  
  // Helper to find column index
  const fIdx = (q) => formHdrs.findIndex(h => h.includes(q.toLowerCase()));
  
  const iTs = fIdx("timestamp");
  const iHire = fIdx("hiring date");
  const iLast = fIdx("last name");
  const iFirst = fIdx("first name");
  const iMid = fIdx("middle name");
  const iDept = fIdx("department");
  const iPos = fIdx("position");
  const iAge = fIdx("age");
  const iGender = fIdx("gender");
  const iEmail = fIdx("email");
  const iAddress = fIdx("address");
  const iPhone = fIdx("number");

  const newRows = [];
  for (let i = 1; i < formData.length; i++) {
    const row = formData[i];
    const empNo = "ZK-" + i.toString().padStart(4, "0");
    const firstName = iFirst > -1 ? row[iFirst] : "";
    const lastName = iLast > -1 ? row[iLast] : "";
    const fullName = [firstName, lastName].filter(Boolean).join(" ");
    
    // Construct 38-column row
    const newRow = new Array(38).fill("");
    newRow[0] = empNo; // Employee No.
    newRow[1] = lastName; // Last Name
    newRow[2] = firstName; // First Name
    newRow[3] = iMid > -1 ? row[iMid] : ""; // Middle Name
    newRow[4] = fullName; // Complete Name
    newRow[5] = iHire > -1 ? row[iHire] : (iTs > -1 ? row[iTs] : new Date()); // Start Date
    newRow[9] = "Summit Enterprise"; // Company
    newRow[14] = "REGULAR"; // Status (Updated from 'Active' to match Validation)
    newRow[18] = iDept > -1 ? row[iDept] : "General"; // Department
    newRow[19] = iPos > -1 ? row[iPos] : "Staff"; // Position
    newRow[24] = iAge > -1 ? row[iAge] : ""; // Age
    newRow[26] = iGender > -1 ? row[iGender] : ""; // Gender
    newRow[27] = iPhone > -1 ? row[iPhone] : ""; // Mobile No.
    newRow[28] = iEmail > -1 ? row[iEmail] : ""; // Email Address
    newRow[30] = iAddress > -1 ? row[iAddress] : ""; // Complete Address
    
    newRows.push(newRow);
  }
  
  if (newRows.length > 0) {
    const range = destSheet.getRange(2, 1, newRows.length, 38);
    range.clearDataValidations(); // Safeguard against validation blocks
    range.setValues(newRows);
  }
}

/**
 * Generic Merger: Source -> Destination
 */
function MAINTENANCE_CONSOLIDATE_SHEETS(sourceName, destName, clearDestFirst = false) {
  const ss = getSS_();
  const source = ss.getSheetByName(sourceName);
  const dest = ss.getSheetByName(destName);
  
  if (!source || !dest) {
    Logger.log("Skipping consolidation for " + sourceName + " (missing sheets).");
    return;
  }
  
  const data = source.getDataRange().getValues();
  if (data.length < 2) return;
  
  if (clearDestFirst) {
    if (dest.getLastRow() > 1) {
      dest.getRange(2, 1, dest.getLastRow() - 1, dest.getLastColumn()).clearContent();
    }
  }
  
  const destRow = Math.max(dest.getLastRow() + 1, 2);
  const targetRange = dest.getRange(destRow, 1, data.length - 1, data[0].length);
  targetRange.clearDataValidations(); // Safeguard against validation blocks
  targetRange.setValues(data.slice(1));
  Logger.log("Merged " + (data.length - 1) + " rows from " + sourceName + " to " + destName);
}

/**
 * AGGRESSIVE CLEANUP: Purges all sheets NOT defined in system constants.
 * This will wipe all legacy copies, 201 filing logs, and old databases.
 */
function MAINTENANCE_PURGE_NON_SYSTEM_SHEETS() {
  const ss = getSS_();
  const allSheets = ss.getSheets();
  
  // Whitelist of sheets to KEEP (System constants + Response Form)
  const keepList = [
    SHEET_EMPLOYEES,
    SHEET_ARCHIVE,
    SHEET_LEAVE,
    SHEET_ATTENDANCE,
    SHEET_ACCESS,
    SHEET_NOTIFICATIONS,
    SHEET_OKR,
    SHEET_PERFORMANCE,
    SHEET_DOCUMENTS,
    SHEET_COMPLIANCE,
    SHEET_CALENDAR,
    SHEET_ANNOUNCEMENTS,
    "EMPLOYEE DATABASE" // Fallback for case sensitivity
  ].map(name => name.toString().toLowerCase().trim());
  
  Logger.log("Starting Aggressive Purge... Preserving: " + keepList.join(", "));
  
  let deletedCount = 0;
  allSheets.forEach(sheet => {
    const name = sheet.getName().toLowerCase().trim();
    
    // Check if sheet is in the keep list
    if (!keepList.includes(name)) {
      try {
        // Safety: Don't delete if it's the last sheet in the doc
        if (ss.getSheets().length > 1) {
          ss.deleteSheet(sheet);
          deletedCount++;
        }
      } catch (e) {
        Logger.log("Could not delete " + sheet.getName() + ": " + e.message);
      }
    }
  });
  
  Logger.log("Purge complete. Removed " + deletedCount + " legacy sheets.");
}

/* ============================================================
   LEAVE MONITORING INTEGRATION
 ============================================================ */

/**
 * MASTER LEAVE MIGRATION
 */
function MAINTENANCE_RUN_LEAVE_MIGRATION() {
  Logger.log("Starting Leave Migration...");
  
  // 1. Sync Entitlements (SIL, Tenure, Birthday)
  MAINTENANCE_SYNC_LEAVE_ENTITLEMENTS();
  
  // 2. Migrate Request History
  MAINTENANCE_MIGRATE_LEAVE_HISTORY();
  
  Logger.log("Leave Migration complete.");
}

/**
 * Logic: AUTOMATED CALCULATION -> INTERNAL LEDGER
 * Calculates SIL, Tenure (years), and Birthday leave based on Employee Profile.
 */
function MAINTENANCE_SYNC_LEAVE_ENTITLEMENTS() {
  try {
    const rootSs = getSS_();
    const empSheet = rootSs.getSheetByName(SHEET_EMPLOYEES);
    const balSheet = rootSs.getSheetByName(SHEET_LEAVE_BALANCES);
    
    if (!empSheet || !balSheet) throw new Error("Employee Database or Ledger missing.");
    
    const empData = empSheet.getDataRange().getValues();
    const empHdrs = empData[0].map(h => h.toString().toLowerCase().trim());
    
    const iEmpNo = empHdrs.indexOf("employee no.");
    const iName = empHdrs.indexOf("complete name");
    const iStart = empHdrs.indexOf("start date");
    const iBday = empHdrs.indexOf("birthdate");
    
    if (iEmpNo === -1 || iStart === -1) throw new Error("Employee schema missing critical 'Start Date' for calculation.");
    
    const today = new Date();
    const balanceRows = [];
    let updatedCount = 0;

    Logger.log("Starting Automated Leave Calculation...");

    for (let i = 1; i < empData.length; i++) {
        const row = empData[i];
        if (!row[iEmpNo]) continue;

        const startDate = new Date(row[iStart]);
        const employeeNo = row[iEmpNo].toString();
        const employeeName = iName > -1 ? row[iName] : "N/A";
        
        // 1. Calculate Tenure (Completed Years)
        let years = 0;
        if (startDate instanceof Date && !isNaN(startDate)) {
          years = today.getFullYear() - startDate.getFullYear();
          const m = today.getMonth() - startDate.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < startDate.getDate())) {
            years--;
          }
        }
        years = Math.max(0, years);

        // 2. Map Entitlements:
        // SIL: 5 days if years >= 1
        // Tenure: 1 day per year (as per external ledger logic)
        // Birthday: 1 day if birthday exists
        const sil = years >= 1 ? 5 : 0;
        const tenure = years;
        const bday = (row[iBday] && !isNaN(new Date(row[iBday]).getTime())) ? 1 : 1; // Default to 1 as per request

        balanceRows.push([
          employeeNo,
          employeeName,
          sil,
          tenure,
          bday,
          0, // Used (Placeholder, synced next)
          sil + tenure + bday, // Remaining (Initial)
          new Date()
        ]);
        updatedCount++;
    }

    // Overwrite the LEAVE BALANCES sheet (preserving headers)
    if (balanceRows.length > 0) {
      if (balSheet.getLastRow() > 1) {
        balSheet.getRange(2, 1, balSheet.getLastRow() - 1, 8).clearContent();
      }
      balSheet.getRange(2, 1, balanceRows.length, 8).setValues(balanceRows);
      Logger.log(`Populated Ledger with ${updatedCount} automated leave calculations.`);
    }

    return "Success: Calculated and populated " + updatedCount + " records.";
  } catch (e) {
    Logger.log("MAINTENANCE_SYNC_LEAVE_ENTITLEMENTS Error: " + e.message);
    return "Error: " + e.message;
  }
}

/**
 * Logic: EXTERNAL -> INTERNAL (Leave Requests History for 2025-2026)
 * Overwrites existing internal leave requests for the period.
 */
function MAINTENANCE_MIGRATE_LEAVE_HISTORY() {
  try {
    const rootSs = getSS_();
    const externalSs = SpreadsheetApp.openById(EXTERNAL_LEAVE_SS_ID);
    const formSheet = externalSs.getSheetByName("Form Responses 1");
    const destSheet = rootSs.getSheetByName(SHEET_LEAVE);
    
    if (!formSheet || !destSheet) throw new Error("Source or Destination leave sheets not found.");
    
    // 1. Clear existing matching period requests (Dec 1, 2025 onwards)
    const fiscalResetDate = new Date("2025-12-01");
    if (destSheet.getLastRow() > 1) {
       const destData = destSheet.getDataRange().getValues();
       const iDestTs = 10; // "Submitted At" index (1-based index 11)
       for (let i = destData.length - 1; i >= 1; i--) {
          const submittedAt = new Date(destData[i][iDestTs]);
          if (submittedAt >= fiscalResetDate) {
             destSheet.deleteRow(i + 1);
          }
       }
    }

    // 2. Fetch Source Data
    const data = formSheet.getDataRange().getValues();
    const hdrs = data[0].map(h => h.toString().toLowerCase().trim());
    
    // External Indices
    const iTs = hdrs.indexOf("timestamp");
    const iEmail = hdrs.indexOf("email address");
    const iType = hdrs.indexOf("type of leave");
    const iStart = hdrs.indexOf("start date");
    const iEnd = hdrs.indexOf("end date");
    const iDays = hdrs.indexOf("no. of days");
    const iReason = hdrs.indexOf("reason");
    const iStatus = hdrs.indexOf("remarks"); 
    
    let migratedCount = 0;
    const newRequests = [];

    data.slice(1).forEach(r => {
        const ts = new Date(r[iTs]);
        if (ts < fiscalResetDate) return;

        const email = (r[iEmail] || "").toString().toLowerCase().trim();
        const empInfo = getEmployeeByEmail_(email);
        if (!empInfo) return;

        const rawStatus = (r[iStatus] || "").toString().toLowerCase();
        const status = rawStatus.includes("approved") ? "Approved" : (rawStatus.includes("declined") ? "Declined" : "Pending");

        newRequests.push([
          "MIG-" + ts.getTime() + "-" + Math.floor(Math.random()*100), // ID
          empInfo.employeeNo,
          empInfo.completeName,
          empInfo.department,
          r[iType] || "General",
          r[iStart],
          r[iEnd],
          r[iDays] || 1,
          r[iReason] || "",
          status,
          ts,
          "SYSTEM_MIGRATION",
          new Date(),
          "Imported from legacy Leave Monitoring"
        ]);
        migratedCount++;
    });

    if (newRequests.length > 0) {
      destSheet.getRange(destSheet.getLastRow() + 1, 1, newRequests.length, 14).setValues(newRequests);
    }

    Logger.log(`Migrated ${migratedCount} leave requests.`);
    
    // Final Step: Sync the Ledger balances
    Logger.log("Recalculating Ledger balances...");
    const balanceSheet = rootSs.getSheetByName(SHEET_LEAVE_BALANCES);
    const balanceData = balanceSheet.getDataRange().getValues();
    for (let i = 1; i < balanceData.length; i++) {
       getLeaveBalanceSummary(balanceData[i][0], null); 
    }

    return "Success: Migrated " + migratedCount + " requests and updated Ledger.";
  } catch (e) {
    Logger.log("MAINTENANCE_MIGRATE_LEAVE_HISTORY Error: " + e.message);
    return "Error: " + e.message;
  }
}

function getEmployeeByEmail_(email) {
  const ss = getSS_();
  const sheet = ss.getSheetByName(SHEET_EMPLOYEES);
  const data = sheet.getDataRange().getValues();
  const hdrs = data[0];
  const iEmail = hdrs.indexOf("Email Address");
  const iEmpNo = hdrs.indexOf("Employee No.");
  const iName = hdrs.indexOf("Complete Name");
  const iDept = hdrs.findIndex(h => h.toString().toLowerCase().includes("department"));
  
  if (iEmail === -1) return null;
  
  const row = data.find(r => r[iEmail].toString().toLowerCase().trim() === email.toLowerCase().trim());
  if (!row) return null;
  
  return {
    employeeNo: row[iEmpNo],
    completeName: row[iName],
    department: iDept > -1 ? row[iDept] : ""
  };
}

/**
 * ONE-TIME MIGRATION: Split Employee Database into Active/Archive/Leave Balances
 * Run this from the Apps Script editor to finalize the new architecture.
 */
function MAINTENANCE_MIGRATE_TO_ACTIVE_ARCHITECTURE() {
  const ss = getSS_();
  // Support both capitalized and standard naming for legacy sheet identification
  const oldSheet = ss.getSheetByName("EMPLOYEE DATABASE") || ss.getSheetByName("Employee Database");
  
  if (!oldSheet) {
    Logger.log("Original Employee Database not found. Migration cancelled or already done.");
    return "Error: Source sheet not found.";
  }

  // 1. Rename to Archives (Safety First)
  oldSheet.setName(SHEET_ARCHIVE);
  Logger.log("Renamed original database to: " + SHEET_ARCHIVE);

  // 2. Setup New Sheet Structures (Creates the new Active and Ledger sheets)
  setupDatabase_(); 
  
  const archiveSheet = ss.getSheetByName(SHEET_ARCHIVE);
  const activeSheet = ss.getSheetByName(SHEET_EMPLOYEES);
  const balanceSheet = ss.getSheetByName(SHEET_LEAVE_BALANCES);
  
  const data = archiveSheet.getDataRange().getValues();
  const headers = data[0].map(h => h.toString().toLowerCase().trim());
  
  const iStatus = headers.indexOf("status");
  const iEmpNo = headers.indexOf("employee no.");
  // Find name parts for the ledger
  const iFirst = headers.indexOf("first name");
  const iLast = headers.indexOf("last name");
  const iFull = headers.indexOf("complete name");

  const iSIL = headers.indexOf("sil entitlement");
  const iTenure = headers.indexOf("tenure entitlement");
  const iBday = headers.indexOf("birthday leave");

  const activeStatuses = ["regular", "probationary", "project-based", "trainee", "freelance"];
  const activeRows = [];
  const balanceRows = [];

  Logger.log("Processing " + (data.length - 1) + " records...");

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const status = (row[iStatus] || "").toString().toLowerCase().trim();
    
    if (activeStatuses.includes(status)) {
      // 3. Create record for ACTIVE DATABASE 
      // We strip the last 3 columns if the source actually had 41 columns
      const activeRow = row.length > 38 ? row.slice(0, 38) : row;
      activeRows.push(activeRow);
      
      // 4. Create record for LEAVE BALANCES
      const sil = iSIL > -1 ? parseFloat(row[iSIL]) || 0 : 0;
      const tenure = iTenure > -1 ? parseFloat(row[iTenure]) || 0 : 0;
      const bday = iBday > -1 ? parseFloat(row[iBday]) || 0 : 0;
      
      let displayName = "N/A";
      if (iFull > -1 && row[iFull]) displayName = row[iFull];
      else if (iFirst > -1) displayName = [row[iFirst], row[iLast]].filter(Boolean).join(" ");

      balanceRows.push([
        row[iEmpNo],
        displayName,
        sil,
        tenure,
        bday,
        0, // Used (Placeholder - calculated dynamically)
        sil + tenure + bday, // Remaining (Placeholder)
        new Date() // Last Updated
      ]);
    }
  }

  // 5. Populate Active Database (Sorted by ID)
  if (activeRows.length > 0) {
    const iNo = headers.indexOf("employee no.");
    activeRows.sort((a, b) => a[iNo].toString().localeCompare(b[iNo].toString()));
    activeSheet.getRange(2, 1, activeRows.length, activeRows[0].length).setValues(activeRows);
    Logger.log("Migrated " + activeRows.length + " active employees to " + SHEET_EMPLOYEES);
  }

  // 6. Populate Leave Balances
  if (balanceRows.length > 0) {
    balanceSheet.getRange(2, 1, balanceRows.length, balanceRows[0].length).setValues(balanceRows);
    Logger.log("Created Entitlement Ledger in: " + SHEET_LEAVE_BALANCES);
  }

  // 7. Cleanup Archive Sheet (Delete active rows to leave only separated employees)
  // We go backwards to avoid index shifts
  for (let i = data.length - 1; i >= 1; i--) {
    const status = (data[i][iStatus] || "").toString().toLowerCase().trim();
    if (activeStatuses.includes(status)) {
      archiveSheet.deleteRow(i + 1);
    }
  }

  return "Migration Complete. Validated " + activeRows.length + " active records.";
}

/**
 * UI & FORMAT SYNC: Clones aesthetics from Archive to Active Database
 */
function MAINTENANCE_SYNC_UI_LAYOUT() {
  const ss = getSS_();
  const source = ss.getSheetByName(SHEET_ARCHIVE);
  const target = ss.getSheetByName(SHEET_EMPLOYEES);

  if (!source || !target) return "Missing sheets for sync.";

  // 1. Copy Header Formatting
  source.getRange(1, 1, 1, 38).copyTo(target.getRange(1, 1, 1, 38), SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);
  
  // 2. Set Frozen Headers
  target.setFrozenRows(1);

  // 3. Sync Column Widths & Hidden States
  for (let i = 1; i <= 38; i++) {
    target.setColumnWidth(i, source.getColumnWidth(i));
    if (source.isColumnHiddenByUser(i)) {
      target.hideColumns(i);
    } else {
      target.showColumns(i);
    }
  }

  // 4. Inject "Complete Name" Formula (Column E)
  const lastRow = target.getLastRow();
  if (lastRow > 1) {
    const formulaRange = target.getRange(2, 5, lastRow - 1, 1);
    // Uses C for First, D for Middle, B for Last (based on Archive logic)
    formulaRange.setFormula('=ARRAYFORMULA(IF(LEN(A2:A), C2:C & " " & D2:D & " " & B2:B, ""))');
    Logger.log("Applied ID-safe Complete Name formula to " + (lastRow - 1) + " rows.");
  }

  // 5. Copy Data Validations (Dropdowns)
  source.getRange(2, 1, 1, 38).copyTo(target.getRange(2, 1, lastRow - 1, 38), SpreadsheetApp.CopyPasteType.PASTE_DATA_VALIDATION, false);

  // 6. Global Font Alignment
  target.getRange("A:AL").setFontFamily("Roboto").setVerticalAlignment("middle");

  return "UI Sync Complete. Active Database now matches Archive aesthetics.";
}
