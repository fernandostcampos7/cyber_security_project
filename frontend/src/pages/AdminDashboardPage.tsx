import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

const AdminDashboardPage = () => {
  const { data: analytics } = useQuery({ queryKey: ["admin-analytics"], queryFn: async () => (await api.get("/admin/analytics/summary")).data });
  const { data: logs } = useQuery({ queryKey: ["admin-logs"], queryFn: async () => (await api.get("/admin/logs")).data });

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-3xl font-semibold text-gold">Admin observatory</h1>
        <p className="text-silver/60">Oversee customers, sellers and compliance in one viewport.</p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-black/30 rounded p-4">
          <h2 className="text-sm uppercase tracking-widest text-silver/60">KPIs</h2>
          <p className="text-lg text-gold">Orders: {analytics?.orders ?? 0}</p>
          <p className="text-lg text-gold">Users: {analytics?.users ?? 0}</p>
        </div>
        <div className="bg-black/30 rounded p-4">
          <h2 className="text-sm uppercase tracking-widest text-silver/60">Audit log</h2>
          <ul className="mt-2 space-y-2 max-h-64 overflow-y-auto">
            {logs?.logs?.map((log: any) => (
              <li key={log.id} className="text-xs text-silver/70">
                {log.occurred_at}: {log.action} on {log.entity_type}
              </li>
            ))}
            {logs?.logs?.length === 0 && <li>No audit entries yet.</li>}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default AdminDashboardPage;
