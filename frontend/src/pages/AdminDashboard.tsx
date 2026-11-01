import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { MetricCard } from "../components/MetricCard";

export function AdminDashboard() {
  const [stats, setStats] = useState<any>({});
  useEffect(() => { api.get("/admin/stats").then(r => setStats(r.data.stats)); }, []);
  return (
    <>
      <div className="page-heading"><div><h1>Administration</h1><p>System-level overview.</p></div></div>
      <div className="metric-grid">
        <MetricCard label="Users" value={String(stats.users ?? 0)} />
        <MetricCard label="Patients" value={String(stats.patients ?? 0)} />
        <MetricCard label="Clinicians" value={String(stats.clinicians ?? 0)} />
        <MetricCard label="Predictions" value={String(stats.predictions ?? 0)} />
      </div>
    </>
  );
}
