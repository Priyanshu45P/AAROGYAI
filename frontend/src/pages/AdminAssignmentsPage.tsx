import { FormEvent, useEffect, useState } from "react";
import { api } from "../lib/api";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";

export function AdminAssignmentsPage() {
  const [data, setData] = useState<any>(null);
  const [form, setForm] = useState({ clinicianId: "", patientId: "" });
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      const response = await api.get("/admin/assignments");
      setData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Assignments could not be loaded.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      await api.post("/admin/assignments", form);
      setForm({ clinicianId: "", patientId: "" });
      await load();
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Patient could not be assigned.");
    }
  }

  async function endAssignment(id: string) {
    await api.delete(`/admin/assignments/${id}`);
    await load();
  }

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <LoadingState message="Loading care assignments..." />;

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Clinician–patient assignments</h1>
          <p>
            Control which clinicians are authorised to access each patient record.
          </p>
        </div>
      </div>

      <form className="card compact-form" onSubmit={submit}>
        <label>
          Clinician
          <select
            value={form.clinicianId}
            onChange={(event) =>
              setForm({ ...form, clinicianId: event.target.value })
            }
            required
          >
            <option value="">Select clinician</option>
            {data.clinicians.map((clinician: any) => (
              <option key={clinician.id} value={clinician.id}>
                {clinician.user.firstName} {clinician.user.lastName}
                {clinician.speciality ? ` — ${clinician.speciality}` : ""}
              </option>
            ))}
          </select>
        </label>

        <label>
          Patient
          <select
            value={form.patientId}
            onChange={(event) =>
              setForm({ ...form, patientId: event.target.value })
            }
            required
          >
            <option value="">Select patient</option>
            {data.patients.map((patient: any) => (
              <option key={patient.id} value={patient.id}>
                {patient.user.firstName} {patient.user.lastName}
              </option>
            ))}
          </select>
        </label>

        <button className="primary" type="submit">
          Authorise access
        </button>
      </form>

      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Clinician</th>
              <th>Patient</th>
              <th>Assigned</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {data.assignments.map((assignment: any) => (
              <tr key={assignment.id}>
                <td>
                  {assignment.clinician.user.firstName}{" "}
                  {assignment.clinician.user.lastName}
                </td>
                <td>
                  {assignment.patient.user.firstName}{" "}
                  {assignment.patient.user.lastName}
                </td>
                <td>{new Date(assignment.assignedAt).toLocaleDateString()}</td>
                <td>
                  <button
                    className="secondary"
                    type="button"
                    onClick={() => endAssignment(assignment.id)}
                  >
                    End access
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!data.assignments.length && (
          <p className="muted">No active care assignments.</p>
        )}
      </div>
    </>
  );
}
