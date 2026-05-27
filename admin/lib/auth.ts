import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const COOKIE = 'chessgum_admin_session';

export async function verifyCredentials(username: string, password: string) {
  const adminUser = process.env.ADMIN_USERNAME || 'admin';
  if (username !== adminUser) return false;

  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  if (passwordHash) return bcrypt.compare(password, passwordHash);

  return password === (process.env.ADMIN_PASSWORD || 'chess@admin');
}

export async function createSessionCookie() {
  const token = `${Date.now()}.${process.env.SESSION_SECRET || 'dev-session'}`;
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE);
}

export async function isAuthed() {
  const store = await cookies();
  return Boolean(store.get(COOKIE)?.value);
}

export function requireApiKey(req: NextRequest) {
  const expected = process.env.LEADS_API_KEY || 'dev-leads-key';
  return req.headers.get('x-api-key') === expected;
}

export function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
