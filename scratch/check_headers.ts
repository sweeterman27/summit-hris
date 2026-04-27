import { getDoc, SHEET_NAMES } from '../src/lib/googleSheets';

async function checkHeaders() {
  try {
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle[SHEET_NAMES.CALENDAR];
    await sheet.loadHeaderRow();
    console.log('Headers:', sheet.headerValues);
  } catch (error) {
    console.error('Error:', error);
  }
}

checkHeaders();
