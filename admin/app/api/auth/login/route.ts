import { NextResponse } from 'next/server';
import { createSessionCookie, verifyCredentials } from '@/lib/auth';

export async function POST(req: Request) {
  const body = await req.json();
  const ok = await verifyCredentials(String(body.username || ''), String(body.password || ''));
  if (!ok) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  await createSessionCookie();
  return NextResponse.json({ ok: true });
}
