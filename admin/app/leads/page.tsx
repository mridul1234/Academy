import { DashboardShell } from '@/components/layout/DashboardShell';
import { LeadsManager } from '@/components/leads/LeadsManager';
import { getDashboardData } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function LeadsPage() {
  const data = await getDashboardData();
  return (
    <DashboardShell title="Leads" subtitle="Manage the full demo-to-enrollment pipeline">
      <LeadsManager initialLeads={data.leads} initialNotes={data.lead_notes} />
    </DashboardShell>
  );
}
