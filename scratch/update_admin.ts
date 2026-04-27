import { getDoc, SHEET_NAMES } from '../src/lib/googleSheets';
import bcrypt from 'bcrypt';

async function updateAdmin() {
  try {
    const doc = await getDoc();
    const accessSheet = doc.sheetsByTitle[SHEET_NAMES.ACCESS];
    const rows = await accessSheet.getRows();
    
    const adminRow = rows.find(r => r.get('Email')?.toLowerCase() === 'admin@zksummit.com');
    
    if (adminRow) {
      console.log('Found admin@zksummit.com. Updating password and role...');
      const hashedPassword = await bcrypt.hash('admin@91W', 10);
      adminRow.set('Password Hash', hashedPassword);
      adminRow.set('Role', 'SUPERADMIN');
      adminRow.set('Status', 'Active');
      await adminRow.save();
      console.log('Update successful.');
    } else {
      console.log('admin@zksummit.com not found. Creating...');
      const hashedPassword = await bcrypt.hash('admin@91W', 10);
      await accessSheet.addRow({
        'Email': 'admin@zksummit.com',
        'Password Hash': hashedPassword,
        'Role': 'SUPERADMIN',
        'Employee No.': 'ZK-0000',
        'Status': 'Active'
      });
      console.log('Creation successful.');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

updateAdmin();
