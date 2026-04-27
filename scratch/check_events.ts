import { getDoc, SHEET_NAMES } from '../src/lib/googleSheets';

async function checkEvents() {
  try {
    const doc = await getDoc();
    const calendarSheet = doc.sheetsByTitle[SHEET_NAMES.CALENDAR];
    const rows = await calendarSheet.getRows();
    
    console.log(`Found ${rows.length} events:`);
    rows.forEach(r => {
      console.log(`- ${r.get('Title')} (${r.get('Start Date')} to ${r.get('End Date')}) | Collaborators: ${r.get('Collaborators')}`);
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

checkEvents();
