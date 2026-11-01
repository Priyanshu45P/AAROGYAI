import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";
import { EmptyState } from "../components/EmptyState";
import { RiskBadge } from "../components/RiskBadge";

export function PatientListPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    q: "",
    risk: "",
    condition: "",
    comb: "",
    abnormal: "",
    sort: "name",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== "")
      );
      const response = await api.get("/patients", { params });
      setPatients(response.data.patients);
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Patients could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(load, 250);
    return () => window.clearTimeout(timer);
  }, [
    filters.q,
    filters.risk,
    filters.condition,
    filters.comb,
    filters.abnormal,
    filters.sort,
  ]);

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Patients</h1>
          <p>Search and review only patients assigned to your care.</p>
        </div>
      </div>

      <div className="card patient-filter-grid">
        <label>
          Search
          <input
            type="search"
            placeholder="Name or email"
            value={filters.q}
            onChange={(event) =>
              setFilters({ ...filters, q: event.target.value })
            }
          />
        </label>

        <label>
          AI risk
          <select
            value={filters.risk}
            onChange={(event) =>
              setFilters({ ...filters, risk: event.target.value })
            }
          >
            <option value="">All risk levels</option>
            <option value="HIGH">High</option>
            <option value="MODERATE">Moderate</option>
            <option value="LOW">Low</option>
          </select>
        </label>

        <label>
          Condition
          <select
            value={filters.condition}
            onChange={(event) =>
              setFilters({ ...filters, condition: event.target.value })
            }
          >
            <option value="">All conditions</option>
            <option value="diabetes">Diabetes</option>
            <option value="hypertension">Hypertension</option>
          </select>
        </label>

        <label>
          COM-B concern
          <select
            value={filters.comb}
            onChange={(event) =>
              setFilters({ ...filters, comb: event.target.value })
            }
          >
            <option value="">All behaviour profiles</option>
            <option value="CAPABILITY">Capability</option>
            <option value="OPPORTUNITY">Opportunity</option>
            <option value="MOTIVATION">Motivation</option>
          </select>
        </label>

        <label>
          Review flag
          <select
            value={filters.abnormal}
            onChange={(event) =>
              setFilters({ ...filters, abnormal: event.target.value })
            }
          >
            <option value="">All patients</option>
            <option value="true">Recent reading needs review</option>
          </select>
        </label>

        <label>
          Sort by
          <select
            value={filters.sort}
            onChange={(event) =>
              setFilters({ ...filters, sort: event.target.value })
            }
          >
            <option value="name">Name</option>
            <option value="risk">AI risk</option>
            <option value="recent">Latest reading</option>
          </select>
        </label>
      </div>

      {error && <ErrorState message={error} onRetry={load} />}
      {loading ? (
        <LoadingState message="Loading authorised patients..." />
      ) : (
        <div className="card table-wrap">
          {patients.length ? (
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Latest reading</th>
                  <th>Diabetes</th>
                  <th>Hypertension</th>
                  <th>AI risk</th>
                  <th>COM-B concern</th>
                  <th>Review</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((patient) => (
                  <tr key={patient.id}>
                    <td>
                      <strong>
                        {patient.user.firstName} {patient.user.lastName}
                      </strong>
                      <small className="table-subtext">{patient.user.email}</small>
                    </td>
                    <td>
                      {patient.clinicalReadings?.[0]?.glucose ?? "—"} mg/dL
                    </td>
                    <td>{patient.hasDiabetes ? "Recorded" : "—"}</td>
                    <td>{patient.hasHypertension ? "Recorded" : "—"}</td>
                    <td>
                      {patient.latestRisk ? (
                        <RiskBadge level={patient.latestRisk} />
                      ) : (
                        "Not assessed"
                      )}
                    </td>
                    <td>{patient.mainCombConcern ?? "No current flag"}</td>
                    <td>{patient.reviewFlag ? "Review suggested" : "Routine"}</td>
                    <td>
                      <Link to={`/clinician/patients/${patient.id}`}>
                        Review →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState
              title="No matching patients"
              message="Change the filters or ask an administrator to confirm your patient assignments."
            />
          )}
        </div>
      )}

      <p className="muted small-print">
        Review flags are prototype prioritisation aids and are not diagnoses or
        treatment instructions.
      </p>
    </>
  );
}
