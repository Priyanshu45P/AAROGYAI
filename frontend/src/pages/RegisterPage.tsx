import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuthStore } from "../stores/auth";

export function RegisterPage() {
  const navigate = useNavigate();
  const login = useAuthStore(s => s.login);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "" });
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    try {
      const { data } = await api.post("/auth/register", form);
      login(data.token, data.user);
      navigate("/patient");
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Unable to register.");
    }
  }

  return (
    <div className="auth-page single">
      <form className="auth-card" onSubmit={submit}>
        <h2>Create patient account</h2>
        <div className="two-col">
          <label>First name<input onChange={e => setForm({ ...form, firstName: e.target.value })} required /></label>
          <label>Last name<input onChange={e => setForm({ ...form, lastName: e.target.value })} required /></label>
        </div>
        <label>Email<input type="email" onChange={e => setForm({ ...form, email: e.target.value })} required /></label>
        <label>Password<input type="password" onChange={e => setForm({ ...form, password: e.target.value })} required /></label>
        {error && <div className="error">{error}</div>}
        <button className="primary">Create account</button>
        <p className="muted"><Link to="/login">Back to login</Link></p>
      </form>
    </div>
  );
}
