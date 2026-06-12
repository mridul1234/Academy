import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { findStudentByEmail, mridulCoach } from './data';
import type { CrmRole, CrmSession } from './types';

const cookieName = 'chessgum_crm_session';

function encodeSession(session: CrmSession) {
  return Buffer.from(JSON.stringify(session), 'utf8').toString('base64url');
}

function decodeSession(value?: string): CrmSession | null {
  if (!value) return null;
  try {
    return JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as CrmSession;
  } catch {
    return null;
  }
}

export async function verifyCrmCredentials(role: CrmRole, email: string, password: string) {
  if (role === 'coach') {
    const expectedEmail = process.env.CRM_COACH_EMAIL || 'mridul@chessgum.com';
    const expectedPassword = process.env.CRM_COACH_PASSWORD;
    if (!expectedPassword) return null;
    if (email !== expectedEmail || password !== expectedPassword) return null;
    return { role, email: mridulCoach.email, name: mridulCoach.name, subjectId: mridulCoach.id } satisfies CrmSession;
  }

  const expectedPassword = process.env.CRM_STUDENT_PASSWORD;
  if (!expectedPassword || password !== expectedPassword) return null;
  const student = await findStudentByEmail(email);
  if (!student) return null;
  return { role, email: student.email || email, name: student.child_name, subjectId: student.id } satisfies CrmSession;
}

export async function createCrmSessionCookie(session: CrmSession) {
  const store = await cookies();
  store.set(cookieName, encodeSession(session), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
}

export async function clearCrmSessionCookie() {
  const store = await cookies();
  store.delete(cookieName);
}

export async function getCrmSession() {
  const store = await cookies();
  return decodeSession(store.get(cookieName)?.value);
}

export function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
