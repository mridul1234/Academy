import { DashboardShell } from '@/components/layout/DashboardShell';
import { ScheduleWorkspace } from '@/components/schedule/ScheduleWorkspace';
import { getDashboardData, parseSchedule } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function SchedulePage() {
  const data = await getDashboardData();

  return (
    <DashboardShell
      title="Schedule"
      subtitle="Weekly class timetable and today&apos;s teaching plan"
      action={{ label: 'Add Slot', targetId: '#schedule-add-slot' }}
    >
      <ScheduleWorkspace students={data.students} initialSchedule={parseSchedule(data.site_metrics)} />
    </DashboardShell>
  );
}
