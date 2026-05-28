import { NextRequest, NextResponse } from 'next/server';
import { createLead, getDashboardData } from '@/lib/data';
import { isAuthed, requireApiKey, unauthorized } from '@/lib/auth';

const allowedOrigins = new Set([
  'https://chessgum.com',
  'https://www.chessgum.com',
  'https://admin.chessgum.com',
  'http://localhost:3001',
]);

function corsHeaders(req: NextRequest) {
  const origin = req.headers.get('origin') || '';
  return {
    'Access-Control-Allow-Origin': allowedOrigins.has(origin) ? origin : 'https://chessgum.com',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
    'Vary': 'Origin',
  };
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

export async function GET() {
  if (!(await isAuthed())) return unauthorized();
  const data = await getDashboardData();
  return NextResponse.json({ leads: data.leads, notes: data.lead_notes });
}

export async function POST(req: NextRequest) {
  const headers = corsHeaders(req);
  if (!(await isAuthed()) && !requireApiKey(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
  }
  const body = await req.json();
  const lead = await createLead(body);
  return NextResponse.json({ lead }, { status: 201, headers });
}
