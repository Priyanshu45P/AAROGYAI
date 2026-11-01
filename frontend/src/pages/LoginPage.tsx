import { FormEvent, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuthStore } from "../stores/auth";

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore(s => s.login);
  const [email, setEmail] = useState("patient@aarogyai.test");
  const [password, setPassword] = useState("Patient123!");
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const { data } = await api.post("/auth/login", { email, password });
      login(data.token, data.user);
      navigate(data.user.role === "PATIENT" ? "/patient" : data.user.role === "CLINICIAN" ? "/clinician" : "/admin");
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Unable to log in.");
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-hero">
        <span className="pill">Healthcare + Explainable AI</span>
        <h1>AAROGYAI</h1>
        <p>Intelligent Care. Explainable Decisions.</p>
        <ul>
          <li>Diabetes and hypertension monitoring</li>
          <li>Explainable AI risk insights</li>
          <li>COM-B behaviour support</li>
          <li>Clinician-led decision support</li>
        </ul>
      </section>

      <form className="auth-card" onSubmit={submit}>
        <h2>Welcome back</h2>
        <p>Securely access your AAROGYAI workspace.</p>
        <label>Email<input value={email} onChange={e => setEmail(e.target.value)} type="email" required /></label>
        <label>Password<input value={password} onChange={e => setPassword(e.target.value)} type="password" required /></label>
        {error && <div className="error">{error}</div>}
        <button className="primary" type="submit">Sign in</button>
        <p className="muted">New patient? <Link to="/register">Create an account</Link></p>
      </form>
    </div>
  );
}
