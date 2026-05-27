import { DashboardShell } from '@/components/layout/DashboardShell';
import { getDashboardData } from '@/lib/data';
import { csvEscape } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const data = await getDashboardData();
  const metrics = Object.fromEntries(data.site_metrics.map((metric) => [metric.key, metric.value]));
  const leadsCsv = toCsv(data.leads);
  const revenueCsv = toCsv(data.revenue_entries);
  const studentsCsv = toCsv(data.students);

  return (
    <DashboardShell title="Settings" subtitle="Credentials, WhatsApp templates, exports, and site metrics">
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="card p-5">
          <h2 className="text-lg font-black">Security</h2>
          <p className="mt-2 text-sm font-semibold text-slate-500">Set ADMIN_USERNAME and ADMIN_PASSWORD or ADMIN_PASSWORD_HASH in Vercel environment variables.</p>
        </section>
        <section className="card p-5">
          <h2 className="text-lg font-black">WhatsApp Template</h2>
          <textarea className="textarea mt-3" defaultValue="Hi {parent}, this is from ChessGum. Thanks for booking a free chess demo for {child}. What time works best for a quick call?" />
        </section>
      </div>
      <section className="card mt-6 p-5">
        <h2 className="text-lg font-black">Manual Site Metrics</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input className="input" defaultValue={metrics.kids_taught || '1000+'} aria-label="Kids taught" />
          <input className="input" defaultValue={metrics.tournament_wins || '200+'} aria-label="Tournament wins" />
        </div>
      </section>
      <section className="card mt-6 p-5">
        <h2 className="text-lg font-black">Data Export</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <DownloadLink name="leads" csv={leadsCsv} />
          <DownloadLink name="revenue" csv={revenueCsv} />
          <DownloadLink name="students" csv={studentsCsv} />
        </div>
      </section>
    </DashboardShell>
  );
}

function toCsv<T extends Record<string, unknown>>(rows: T[]) {
  if (!rows.length) return '';
  const keys = Object.keys(rows[0]);
  return [keys.join(','), ...rows.map((row) => keys.map((key) => csvEscape(row[key])).join(','))].join('\n');
}

function DownloadLink({ name, csv }: { name: string; csv: string }) {
  const href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
  return <a className="btn btn-primary" download={`chessgum_${name}.csv`} href={href}>Export {name}</a>;
}
