import { getDoc, SHEET_NAMES } from '../src/lib/googleSheets';
import bcrypt from 'bcrypt';

async function createHR() {
  try {
    const doc = await getDoc();
    const accessSheet = doc.sheetsByTitle[SHEET_NAMES.ACCESS];
    
    const email = 'hr@zksummit.com';
    const password = 'hr@password123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await accessSheet.addRow({
      'Email': email,
      'Password Hash': hashedPassword,
      'Role': 'HR',
      'Employee No.': 'ZK-0314', // Using a test employee number
      'Status': 'Active'
    });
    console.log(`HR account created: ${email} / ${password}`);
  } catch (error) {
    console.error('Error:', error);
  }
}

createHR();
