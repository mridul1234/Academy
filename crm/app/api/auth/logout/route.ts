import { NextRequest, NextResponse } from 'next/server';
import { clearCrmSessionCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  await clearCrmSessionCookie();
  return NextResponse.redirect(new URL('/login', req.url));
}
