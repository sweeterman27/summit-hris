import { getDoc, SHEET_NAMES } from '../src/lib/googleSheets';

async function cleanupEvents() {
  try {
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle[SHEET_NAMES.CALENDAR];
    const rows = await sheet.getRows();
    
    for (const row of rows) {
      if (!row.get('StartDate') || row.get('StartDate') === 'undefined') {
        console.log(`Deleting invalid row: ${row.get('Title')}`);
        await row.delete();
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

cleanupEvents();
