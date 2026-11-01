import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuthStore } from "../stores/auth";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";
import { EmptyState } from "../components/EmptyState";
import { RiskBadge } from "../components/RiskBadge";

export function AIInsightsPage() {
  const patientId = useAuthStore((state) => state.user?.patientProfileId)!;
  const [predictions, setPredictions] = useState<any[]>([]);
  const [readiness, setReadiness] = useState<{ ready: boolean; missing: string[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [history, ready] = await Promise.all([
        api.get(`/ai/patient/${patientId}`),
        api.get(`/ai/readiness/${patientId}`),
      ]);
      setPredictions(history.data.predictions);
      setReadiness({ ready: ready.data.ready, missing: ready.data.missing });
    } catch (err: any) {
      setError(err.response?.data?.message ?? "AI information could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [patientId]);

  async function runPrediction() {
    setRunning(true);
    setError("");
    try {
      await api.post(`/ai/predict/${patientId}`);
      await load();
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Prediction could not be generated.");
    } finally {
      setRunning(false);
    }
  }

  if (loading) return <LoadingState message="Loading AI insights..." />;

  const latest = predictions[0];

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>AI insights</h1>
          <p>Clinical risk prediction with transparent model explanations.</p>
        </div>
        <button
          className="primary"
          type="button"
          disabled={!readiness?.ready || running}
          onClick={runPrediction}
        >
          {running ? "Generating..." : "Generate prediction"}
        </button>
      </div>

      {error && <ErrorState message={error} onRetry={load} />}

      {readiness && !readiness.ready && (
        <div className="card warning-card">
          <strong>More clinical information is required</strong>
          <p>The AI model will not invent missing clinical values.</p>
          <ul>
            {readiness.missing.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {!latest ? (
        <div className="card">
          <EmptyState
            title="No AI prediction yet"
            message="Record the required clinical information, then generate a prediction."
          />
        </div>
      ) : (
        <div className="card ai-summary">
          <div className="ai-summary-top">
            <div>
              <span className="eyebrow">Current model assessment</span>
              <h2>{Math.round(latest.probability * 100)}% model probability</h2>
            </div>
            <RiskBadge level={latest.riskLevel} />
          </div>

          <p className="muted">
            Model: {latest.modelName} • Version {latest.modelVersion} •{" "}
            {new Date(latest.createdAt).toLocaleString()}
          </p>

          <h3>Why did the model produce this result?</h3>
          <p>
            The values below show the clinical features that most influenced this
            prediction. A larger absolute SHAP value means a stronger influence on
            this model output.
          </p>

          <div className="feature-list">
            {latest.featureContributions.map((feature: any) => (
              <div key={feature.id}>
                <span>
                  {feature.featureName}: {feature.featureValue}
                </span>
                <strong>
                  {Number(feature.shapValue) >= 0 ? "↑ " : "↓ "}
                  {Math.abs(Number(feature.shapValue)).toFixed(3)}
                </strong>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card notice">
        <strong>Clinical decision-support only</strong>
        <p>
          The AI result explains the model's output. It does not diagnose a disease,
          prescribe treatment, or replace a qualified healthcare professional.
        </p>
      </div>
    </>
  );
}
