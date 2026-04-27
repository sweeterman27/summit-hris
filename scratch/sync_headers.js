const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
require('dotenv').config({ path: '.env.local' });

const SPREADSHEET_ID = process.env.NEXT_PUBLIC_SPREADSHEET_ID;
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

const serviceAccountAuth = new JWT({
  email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: GOOGLE_PRIVATE_KEY,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

async function syncHeaders() {
  console.log('🚀 Starting System Registry Header Sync...');
  
  try {
    const doc = new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccountAuth);
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle["ACTIVE EMPLOYEE DATABASE"];
    
    if (!sheet) {
      console.error(`❌ Sheet "ACTIVE EMPLOYEE DATABASE" not found.`);
      return;
    }

    await sheet.loadHeaderRow();
    const currentHeaders = sheet.headerValues;
    const requiredHeaders = [
      'Work Latitude',
      'Work Longitude',
      'Work Radius',
      'Shift Start',
      'Shift End',
      'Profile Photo'
    ];

    const missingHeaders = requiredHeaders.filter(h => !currentHeaders.includes(h));

    if (missingHeaders.length > 0) {
      console.log(`📝 Appending missing operational headers: ${missingHeaders.join(', ')}`);
      const newHeaders = [...currentHeaders, ...missingHeaders];
      
      // Resize if necessary
      if (newHeaders.length > sheet.columnCount) {
        console.log(`📏 Resizing sheet columns from ${sheet.columnCount} to ${newHeaders.length + 5}...`);
        await sheet.resize({ rowCount: sheet.rowCount, columnCount: newHeaders.length + 5 });
      }

      await sheet.setHeaderRow(newHeaders);
      console.log('✅ Headers synchronized successfully.');
    } else {
      console.log('✨ Operational headers already present in the registry.');
    }

  } catch (error) {
    console.error('❌ Header Sync Failed:', error);
  }
}

syncHeaders();
