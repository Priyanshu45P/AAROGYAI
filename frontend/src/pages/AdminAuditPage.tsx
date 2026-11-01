import { useEffect, useState } from "react";
import { api } from "../lib/api";

export function AdminAuditPage() {
  const [logs,setLogs]=useState<any[]>([]);
  useEffect(()=>{api.get("/admin/audit").then(r=>setLogs(r.data.logs));},[]);
  return (
    <>
      <div className="page-heading"><div><h1>Audit log</h1><p>Recent sensitive actions.</p></div></div>
      <div className="card table-wrap"><table><thead><tr><th>Time</th><th>Action</th><th>Entity</th><th>User</th></tr></thead>
      <tbody>{logs.map(l=><tr key={l.id}><td>{new Date(l.createdAt).toLocaleString()}</td><td>{l.action}</td><td>{l.entity}</td><td>{l.user ? `${l.user.firstName} ${l.user.lastName}`:"System"}</td></tr>)}</tbody></table></div>
    </>
  );
}
