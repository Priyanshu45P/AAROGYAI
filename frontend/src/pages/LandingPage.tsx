import { Link } from "react-router-dom";
import { BrainCircuit, HeartPulse, ShieldCheck, UsersRound } from "lucide-react";

export function LandingPage() {
  return <div className="landing">
    <header className="landing-nav"><div className="brand"><div className="brand-mark">A</div><div><strong>AAROGYAI</strong><small>Intelligent Care. Explainable Decisions.</small></div></div><nav><Link to="/login">Sign in</Link><Link className="primary-link" to="/register">Patient registration</Link></nav></header>
    <main>
      <section className="landing-hero"><div><span className="pill light">Explainable AI + Behaviour Support</span><h1>Smarter chronic-care support, with explanations clinicians can review.</h1><p>AAROGYAI brings patient management, diabetes and hypertension monitoring, explainable AI and COM-B behavioural assessment into one secure research prototype.</p><div className="hero-actions"><Link className="primary-link large" to="/login">Open AAROGYAI</Link><Link to="/register">Create patient account</Link></div></div><div className="hero-panel"><HeartPulse size={48}/><strong>Clinical monitoring</strong><p>Track glucose, blood pressure, HbA1c, BMI and longitudinal progress.</p></div></section>
      <section className="feature-grid"><article><BrainCircuit/><h3>Explainable AI</h3><p>Risk outputs are accompanied by SHAP feature contributions.</p></article><article><UsersRound/><h3>COM-B support</h3><p>Capability, Opportunity and Motivation are assessed separately from the ML model.</p></article><article><ShieldCheck/><h3>Clinician-led care</h3><p>AI and behaviour information supports, rather than replaces, professional judgement.</p></article></section>
      <section className="safety-banner"><strong>Research and decision-support prototype</strong><p>AAROGYAI is not an emergency service and does not diagnose disease, prescribe treatment or replace qualified healthcare professionals.</p></section>
    </main>
  </div>;
}
