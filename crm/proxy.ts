import { NextRequest, NextResponse } from 'next/server';

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isPublic =
    pathname === '/login' ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico';

  if (isPublic) return NextResponse.next();

  const hasSession = Boolean(req.cookies.get('chessgum_crm_session')?.value);
  if (!hasSession) return NextResponse.redirect(new URL('/login', req.url));

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
