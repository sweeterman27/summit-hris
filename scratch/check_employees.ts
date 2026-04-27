import { getDoc, SHEET_NAMES } from '../src/lib/googleSheets';

async function checkEmployees() {
  try {
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle[SHEET_NAMES.EMPLOYEES];
    const rows = await sheet.getRows();
    
    console.log('--- Employee Database ---');
    rows.forEach(row => {
      console.log(`EmpNo: ${row.get('Employee No.')}, Name: ${row.get('First Name')} ${row.get('Last Name')}, Role: ${row.get('Role')}`);
    });
    console.log('-------------------------');
  } catch (error) {
    console.error('Error:', error);
  }
}

checkEmployees();
