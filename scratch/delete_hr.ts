import { getDoc, SHEET_NAMES } from '../src/lib/googleSheets';

async function deleteHR() {
  try {
    const doc = await getDoc();
    const accessSheet = doc.sheetsByTitle[SHEET_NAMES.ACCESS];
    const rows = await accessSheet.getRows();
    
    const hrRow = rows.find(r => r.get('Email')?.toLowerCase() === 'hr@zksummit.com');
    if (hrRow) {
      await hrRow.delete();
      console.log('Temporary HR account deleted.');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

deleteHR();
