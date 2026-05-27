import { NextResponse } from 'next/server';
import Papa from 'papaparse';
import { createRevenueEntry, getDashboardData } from '@/lib/data';
import { isAuthed, unauthorized } from '@/lib/auth';

type Row = Record<string, string>;

function findKey(row: Row, options: string[]) {
  const keys = Object.keys(row);
  return keys.find((key) => options.some((option) => key.toLowerCase().includes(option))) || '';
}

export async function POST(req: Request) {
  if (!(await isAuthed())) return unauthorized();
  const { csv } = await req.json();
  const parsed = Papa.parse<Row>(String(csv || ''), { header: true, skipEmptyLines: true });
  const rows = parsed.data;
  const existing = await getDashboardData();
  const knownIds = new Set(existing.revenue_entries.map((entry) => entry.razorpay_payment_id).filter(Boolean));

  let imported = 0;
  let duplicates = 0;
  const preview = rows.slice(0, 5);

  for (const row of rows) {
    const idKey = findKey(row, ['payment id', 'id']);
    const amountKey = findKey(row, ['settlement amount', 'amount']);
    const dateKey = findKey(row, ['created at', 'date']);
    const nameKey = findKey(row, ['name']);
    const methodKey = findKey(row, ['method']);
    const descKey = findKey(row, ['description']);
    const paymentId = row[idKey];
    if (paymentId && knownIds.has(paymentId)) {
      duplicates++;
      continue;
    }
    const rawAmount = Number(String(row[amountKey] || '0').replace(/[^\d.]/g, ''));
    await createRevenueEntry({
      transaction_date: row[dateKey] ? new Date(row[dateKey]).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      amount: rawAmount > 10000 ? rawAmount / 100 : rawAmount,
      student_name: row[nameKey] || 'Razorpay Customer',
      payment_method: 'razorpay',
      razorpay_payment_id: paymentId || null,
      description: row[descKey] || 'Razorpay import',
      plan_type: row[descKey] || 'Imported Payment',
    });
    imported++;
  }

  return NextResponse.json({ imported, duplicates, preview });
}
