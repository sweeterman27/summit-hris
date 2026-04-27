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
        const accessSheet = doc.sheetsByTitle[SHEET_NAMES.ACCESS];
        const accessRows = await accessSheet.getRows();

        // 1. Find user by email
        const userRow = accessRows.find(
          (r) => r.get('Email')?.toLowerCase() === credentials.email.toLowerCase()
        );

        if (!userRow) {
          throw new Error('No account found for this email.');
        }

        const storedHash = userRow.get('Password Hash');
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

        if (userRow.get('Status') === 'Inactive') {
          throw new Error('Account deactivated.');
        }

        // 4. Fetch Profile Details
        const empSheet = doc.sheetsByTitle[SHEET_NAMES.EMPLOYEES];
        const empRows = await empSheet.getRows();
        const empRow = empRows.find(
          (r) => r.get('Employee No.')?.toString() === userRow.get('Employee No.')?.toString()
        );

        return {
          id: userRow.get('Employee No.'),
          employeeNo: userRow.get('Employee No.'),
          email: userRow.get('Email'),
          name: empRow ? `${empRow.get('First Name')} ${empRow.get('Last Name')}` : userRow.get('Email')?.split('@')[0],
          role: userRow.get('Role'),
          department: empRow?.get('Department') || 'General',
          position: empRow?.get('Position') || 'Employee',
          profilePhoto: empRow?.get('Profile Photo') || '',
          shiftStart: empRow?.get('Shift Start') || '',
          shiftEnd: empRow?.get('Shift End') || '',
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.employeeNo = (user as any).employeeNo;
        token.role = (user as any).role;
        token.department = (user as any).department;
        token.position = (user as any).position;
        token.profilePhoto = (user as any).profilePhoto;
        token.shiftStart = (user as any).shiftStart;
        token.shiftEnd = (user as any).shiftEnd;
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
