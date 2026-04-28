import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getDoc, SHEET_NAMES } from '@/lib/googleSheets';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

function hashSHA256(password: string) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Summit HRIS',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const doc = await getDoc();
        const empSheet = doc.sheetsByTitle[SHEET_NAMES.EMPLOYEES];
        const empRows = await empSheet.getRows();

        // 1. Find user by email (checking both Updated and original email columns)
        const userRow = empRows.find(
          (r) => 
            r.get('Updated Email Address')?.toLowerCase() === credentials.email.toLowerCase() ||
            r.get('Email Address')?.toLowerCase() === credentials.email.toLowerCase()
        );

        if (!userRow) {
          throw new Error('No account found for this email in the employee database.');
        }

        const storedHash = userRow.get('Password Hash');
        if (!storedHash) {
          throw new Error('No password set for this account. Please contact HR.');
        }

        const isBcrypt = storedHash?.startsWith('$2b$');
        let isValid = false;

        // 2. Check Password
        if (isBcrypt) {
          isValid = await bcrypt.compare(credentials.password, storedHash);
        } else {
          // Legacy SHA-256 check
          const legacyHash = hashSHA256(credentials.password);
          if (legacyHash === storedHash) {
            isValid = true;
            // 3. Migrate to Bcrypt automatically
            const newBcryptHash = await bcrypt.hash(credentials.password, 10);
            userRow.set('Password Hash', newBcryptHash);
            await userRow.save();
          }
        }

        if (!isValid) {
          throw new Error('Incorrect password.');
        }

        // 3. Check Status
        const status = userRow.get('Status');
        if (status === 'Inactive' || status === 'Separated' || status === 'Resigned') {
          throw new Error(`Account status: ${status}. Access denied.`);
        }

        // 4. Return Profile Details
        return {
          id: userRow.get('Employee No.'),
          employeeNo: userRow.get('Employee No.'),
          email: userRow.get('Updated Email Address') || userRow.get('Email Address'),
          name: `${userRow.get('First Name')} ${userRow.get('Last Name')}`,
          role: userRow.get('Role') ? (userRow.get('Role').charAt(0).toUpperCase() + userRow.get('Role').slice(1).toLowerCase()) : 'Employee',
          department: userRow.get('Department') || 'General',
          position: userRow.get('Position') || 'Employee',
          profilePhoto: userRow.get('Profile Photo') || '',
          shiftStart: userRow.get('Shift Start') || '',
          shiftEnd: userRow.get('Shift End') || '',
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session: updateSession }) {
      // 1. Initial sign in - capture all data
      if (user) {
        token.employeeNo = (user as any).employeeNo;
        token.role = (user as any).role;
        token.department = (user as any).department;
        token.position = (user as any).position;
        token.profilePhoto = (user as any).profilePhoto;
        token.shiftStart = (user as any).shiftStart;
        token.shiftEnd = (user as any).shiftEnd;
      }

      // 2. Manual Update Trigger (Instant Client Sync)
      if (trigger === 'update' && updateSession?.role) {
        token.role = updateSession.role;
      }

      // 3. Periodic Background Sync (Re-fetch from Google Sheets)
      // This ensures that even without a manual update, roles are eventually corrected
      if (!user && token.employeeNo) {
        try {
          const doc = await getDoc();
          const empSheet = doc.sheetsByTitle[SHEET_NAMES.EMPLOYEES];
          const empRows = await empSheet.getRows();
          const userRow = empRows.find(r => r.get('Employee No.')?.toString() === token.employeeNo?.toString());
          
          if (userRow) {
            const rawRole = userRow.get('Role');
            const liveRole = rawRole ? (String(rawRole).charAt(0).toUpperCase() + String(rawRole).slice(1).toLowerCase()) : 'Employee';
            token.role = liveRole;
            token.profilePhoto = userRow.get('Profile Photo') || token.profilePhoto;
          }
        } catch (e) {
          console.error('Session Sync Error:', e);
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token) {
        (session.user as any).employeeNo = token.employeeNo;
        (session.user as any).role = token.role;
        (session.user as any).department = token.department;
        (session.user as any).position = token.position;
        (session.user as any).profilePhoto = token.profilePhoto;
        (session.user as any).shiftStart = token.shiftStart;
        (session.user as any).shiftEnd = token.shiftEnd;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
