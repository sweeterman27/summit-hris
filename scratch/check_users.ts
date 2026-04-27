import { getDoc, SHEET_NAMES } from '../src/lib/googleSheets';

async function checkUser() {
  try {
    const doc = await getDoc();
    const accessSheet = doc.sheetsByTitle[SHEET_NAMES.ACCESS];
    const rows = await accessSheet.getRows();
    
    console.log('--- Access Control Users ---');
    rows.forEach(row => {
      console.log(`Email: ${row.get('Email')}, Role: ${row.get('Role')}, EmpNo: ${row.get('Employee No.')}`);
    });
    console.log('----------------------------');
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUser();
