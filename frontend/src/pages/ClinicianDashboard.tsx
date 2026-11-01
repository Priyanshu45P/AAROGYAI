import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { MetricCard } from "../components/MetricCard";

export function ClinicianDashboard() {
  const [patients, setPatients] = useState<any[]>([]);
  useEffect(() => { api.get("/patients").then(r => setPatients(r.data.patients)); }, []);
  const high = patients.filter(p => p.riskPredictions?.[0]?.riskLevel === "HIGH").length;
  return (
    <>
      <div className="page-heading"><div><h1>Clinical overview</h1><p>Monitor patients who may need your attention.</p></div></div>
      <div className="metric-grid">
        <MetricCard label="Patients" value={String(patients.length)} />
        <MetricCard label="High AI risk" value={String(high)} />
        <MetricCard label="New COM-B assessments" value={String(patients.filter(p=>p.behaviourAssessments?.length).length)} />
      </div>
      <div className="card table-wrap">
        <h3>Priority patient list</h3>
        <table><thead><tr><th>Patient</th><th>Latest glucose</th><th>AI risk</th><th>COM-B</th></tr></thead>
        <tbody>{patients.map(p => <tr key={p.id}><td>{p.user.firstName} {p.user.lastName}</td><td>{p.clinicalReadings?.[0]?.glucose ?? "—"}</td><td>{p.riskPredictions?.[0]?.riskLevel ?? "Not assessed"}</td><td>{p.behaviourAssessments?.[0] ? `${Math.round(p.behaviourAssessments[0].overallScore)}%` : "Not assessed"}</td></tr>)}</tbody></table>
      </div>
    </>
  );
}
