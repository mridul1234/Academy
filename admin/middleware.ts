import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const publicPath =
    pathname.startsWith('/api/leads') && req.method === 'POST' ||
    pathname.startsWith('/api/auth') ||
    pathname === '/login' ||
    pathname === '/chessgum_logo.png' ||
    pathname.startsWith('/_next');

  if (publicPath) return NextResponse.next();

  const hasSession = Boolean(req.cookies.get('chessgum_admin_session')?.value);
  if (!hasSession && !pathname.startsWith('/api')) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  if (!hasSession && pathname.startsWith('/api')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!favicon.ico).*)'],
};
