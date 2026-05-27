import { DashboardShell } from '@/components/layout/DashboardShell';
import { RevenueCenter } from '@/components/revenue/RevenueCenter';
import { getDashboardData } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function RevenuePage() {
  const data = await getDashboardData();
  return (
    <DashboardShell title="Revenue" subtitle="Manual revenue, Razorpay imports, and plan performance">
      <RevenueCenter initialRevenue={data.revenue_entries} />
    </DashboardShell>
  );
}
