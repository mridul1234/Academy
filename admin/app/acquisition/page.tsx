import { AcquisitionDashboard } from '@/components/acquisition/AcquisitionDashboard';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { getDashboardData } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function AcquisitionPage() {
  const data = await getDashboardData();

  return (
    <DashboardShell title="Acquisition" subtitle="Daily source, campaign, conversion, and lost-lead analysis">
      <AcquisitionDashboard leads={data.leads} />
    </DashboardShell>
  );
}
