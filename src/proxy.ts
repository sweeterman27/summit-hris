import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function proxy(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // 1. Authentication Check
  const isAuth = !!token;
  const isAuthPage = pathname.startsWith('/login');

  if (isAuthPage) {
    if (isAuth) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    return NextResponse.next();
  }

  if (!isAuth && pathname !== '/') {
    let from = pathname;
    if (req.nextUrl.search) {
      from += req.nextUrl.search;
    }
    return NextResponse.redirect(
      new URL(`/login?from=${encodeURIComponent(from)}`, req.url)
    );
  }

  // 2. Role-Based Access Control (RBAC)
  const role = (token?.role as string)?.toUpperCase();

  // Admin/HR Only Routes
  const adminRoutes = ['/employees', '/settings', '/access'];
  const hrRoutes = ['/employees'];

  if (adminRoutes.some(path => pathname.startsWith(path))) {
    if (role !== 'ADMIN' && role !== 'SUPERADMIN' && role !== 'HR') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/employees/:path*',
    '/attendance/:path*',
    '/leave/:path*',
    '/performance/:path*',
    '/settings/:path*',
    '/login',
  ],
};
