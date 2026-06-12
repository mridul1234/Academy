import { NextRequest, NextResponse } from 'next/server';
import { createCrmSessionCookie, verifyCrmCredentials } from '@/lib/auth';
import type { CrmRole } from '@/lib/types';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const role = body.role as CrmRole;
  const session = await verifyCrmCredentials(role, String(body.email || ''), String(body.password || ''));

  if (!session) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

  await createCrmSessionCookie(session);
  return NextResponse.json({ ok: true, role: session.role });
}
