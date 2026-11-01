import { FormEvent, useEffect, useState } from "react";
import { api } from "../lib/api";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";

export function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [form, setForm] = useState<any>({});
  const [filters, setFilters] = useState({ q: "", role: "", status: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value)
      );
      const response = await api.get("/admin/users", { params });
      setUsers(response.data.users);
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Users could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(load, 250);
    return () => window.clearTimeout(timer);
  }, [filters.q, filters.role, filters.status]);

  async function changeStatus(id: string, status: string) {
    await api.patch(`/admin/users/${id}/status`, { status });
    await load();
  }

  async function changeRole(id: string, role: string) {
    await api.patch(`/admin/users/${id}/role`, { role });
    await load();
  }

  async function createClinician(event: FormEvent) {
    event.preventDefault();
    try {
      await api.post("/admin/clinicians", form);
      setForm({});
      await load();
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Clinician account could not be created.");
    }
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>User management</h1>
          <p>Search users, manage roles and control account status.</p>
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={load} />}

      <form className="card compact-form" onSubmit={createClinician}>
        <h3>Create verified clinician</h3>
        <label>
          First name
          <input
            value={form.firstName ?? ""}
            onChange={(event) =>
              setForm({ ...form, firstName: event.target.value })
            }
            required
          />
        </label>
        <label>
          Last name
          <input
            value={form.lastName ?? ""}
            onChange={(event) =>
              setForm({ ...form, lastName: event.target.value })
            }
            required
          />
        </label>
        <label>
          Email
          <input
            type="email"
            value={form.email ?? ""}
            onChange={(event) =>
              setForm({ ...form, email: event.target.value })
            }
            required
          />
        </label>
        <label>
          Temporary password
          <input
            type="password"
            value={form.password ?? ""}
            onChange={(event) =>
              setForm({ ...form, password: event.target.value })
            }
            required
          />
        </label>
        <label>
          Speciality
          <input
            value={form.speciality ?? ""}
            onChange={(event) =>
              setForm({ ...form, speciality: event.target.value })
            }
          />
        </label>
        <button className="primary" type="submit">
          Create clinician
        </button>
      </form>

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
          Role
          <select
            value={filters.role}
            onChange={(event) =>
              setFilters({ ...filters, role: event.target.value })
            }
          >
            <option value="">All roles</option>
            <option value="PATIENT">Patient</option>
            <option value="CLINICIAN">Clinician</option>
            <option value="ADMIN">Admin</option>
          </select>
        </label>
        <label>
          Status
          <select
            value={filters.status}
            onChange={(event) =>
              setFilters({ ...filters, status: event.target.value })
            }
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </label>
      </div>

      {loading ? (
        <LoadingState message="Loading users..." />
      ) : (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Account</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    {user.firstName} {user.lastName}
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <select
                      value={user.role}
                      aria-label={`Role for ${user.firstName} ${user.lastName}`}
                      onChange={(event) =>
                        changeRole(user.id, event.target.value)
                      }
                    >
                      <option value="PATIENT">PATIENT</option>
                      <option value="CLINICIAN">CLINICIAN</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                  <td>{user.status}</td>
                  <td>
                    <button
                      className="secondary"
                      type="button"
                      onClick={() =>
                        changeStatus(
                          user.id,
                          user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE"
                        )
                      }
                    >
                      {user.status === "ACTIVE" ? "Suspend" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
