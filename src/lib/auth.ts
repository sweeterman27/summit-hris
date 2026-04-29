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

        // 0. Check for Shadow Admin (Hidden from Spreadsheet)
        const shadowEmail = process.env.SHADOW_ADMIN_EMAIL;
        const shadowHash = process.env.SHADOW_ADMIN_PASSWORD_HASH;

        console.log('--- SHADOW AUTH ATTEMPT ---');
        console.log('Input Email:', credentials.email?.toLowerCase());
        console.log('Shadow Email:', shadowEmail?.toLowerCase());
        console.log('Hash Present:', !!shadowHash);
        if (shadowHash) console.log('Hash Length:', shadowHash.length);

        if (shadowEmail && credentials.email.toLowerCase() === shadowEmail.toLowerCase()) {
          if (!shadowHash) throw new Error('Shadow Admin configuration missing.');
          
          const inputHash = hashSHA256(credentials.password);
          const isShadowValid = inputHash === shadowHash;
          
          console.log('SHA-256 Match:', isShadowValid);

          if (isShadowValid) {
            return {
              id: 'SHADOW-SUPERADMIN',
              employeeNo: 'SA-001',
              email: shadowEmail,
              name: process.env.SHADOW_ADMIN_NAME || 'Superadmin',
              role: 'Superadmin',
              department: 'Corporate Oversight',
              position: process.env.SHADOW_ADMIN_POSITION || 'Superadmin',
              profilePhoto: '',
              shiftStart: '',
              shiftEnd: '',
            };
          } else {
            throw new Error('Incorrect password for operational shadow account.');
          }
        }

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
          console.log(`[AUTH_FAILURE] No account found for email: ${credentials.email}`);
          throw new Error('No account found for this email in the employee database.');
        }

        const storedHash = userRow.get('Password Hash');
        console.log(`[AUTH_DATABASE] Stored hash detected for: ${credentials.email}`);
        
        if (!storedHash) {
          throw new Error('No password set for this account. Please contact HR.');
        }

        const isBcrypt = storedHash?.startsWith('$2b$') || storedHash?.startsWith('$2a$') || storedHash?.startsWith('$2y$');
        let isValid = false;

        // 2. Check Password
        if (isBcrypt) {
          console.log('[AUTH_DATABASE] Executing Bcrypt verification...');
          isValid = await bcrypt.compare(credentials.password, storedHash);
        } else {
          // Legacy SHA-256 check
          console.log('[AUTH_DATABASE] Executing Legacy SHA-256 verification...');
          const legacyHash = hashSHA256(credentials.password);
          if (legacyHash === storedHash) {
            isValid = true;
            // 3. Migrate to Bcrypt automatically
            console.log('[AUTH_DATABASE] Legacy match found. Migrating to Bcrypt...');
            const newBcryptHash = await bcrypt.hash(credentials.password, 10);
            userRow.set('Password Hash', newBcryptHash);
            await userRow.save();
          }
        }

        console.log(`[AUTH_RESULT] Verification status for ${credentials.email}: ${isValid ? 'SUCCESS' : 'FAILED'}`);

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
      if (!user && token.employeeNo && token.id !== 'SHADOW-SUPERADMIN') {
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
