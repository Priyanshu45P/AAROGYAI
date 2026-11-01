import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuthStore } from "../stores/auth";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";

export function MedicalHistoryPage() {
  const patientId = useAuthStore((state) => state.user?.patientProfileId)!;
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      const response = await api.get(`/medical/patient/${patientId}`);
      setData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Medical history could not be loaded.");
    }
  }

  useEffect(() => {
    load();
  }, [patientId]);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <LoadingState message="Loading medical history..." />;

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Medical history</h1>
          <p>Information recorded by your healthcare team.</p>
        </div>
      </div>

      <div className="history-grid">
        <section className="card">
          <h3>Conditions and diagnoses</h3>
          {data.conditions.map((item: any) => (
            <div className="history-item" key={item.id}>
              <strong>{item.name}</strong>
              <span>{item.active ? "Active" : "Inactive"}</span>
              <p>{item.description || "No additional details."}</p>
            </div>
          ))}
          {!data.conditions.length && <p className="muted">No conditions recorded.</p>}
        </section>

        <section className="card">
          <h3>Medications</h3>
          {data.medications.map((item: any) => (
            <div className="history-item" key={item.id}>
              <strong>{item.name}</strong>
              <span>
                {[item.dosage, item.frequency].filter(Boolean).join(" • ") ||
                  "No dosage details recorded"}
              </span>
            </div>
          ))}
          {!data.medications.length && <p className="muted">No medications recorded.</p>}
        </section>

        <section className="card">
          <h3>Allergies</h3>
          {data.allergies.map((item: any) => (
            <div className="history-item" key={item.id}>
              <strong>{item.allergen}</strong>
              <span>{item.severity || "Severity not recorded"}</span>
              <p>{item.reaction || "Reaction not recorded."}</p>
            </div>
          ))}
          {!data.allergies.length && <p className="muted">No allergies recorded.</p>}
        </section>

        <section className="card">
          <h3>Family history</h3>
          {data.familyHistories.map((item: any) => (
            <div className="history-item" key={item.id}>
              <strong>{item.relationship}</strong>
              <span>{item.condition}</span>
              <p>{item.notes || "No additional notes."}</p>
            </div>
          ))}
          {!data.familyHistories.length && (
            <p className="muted">No family history recorded.</p>
          )}
        </section>

        <section className="card history-wide">
          <h3>Clinical records</h3>
          {data.records.map((item: any) => (
            <div className="history-item" key={item.id}>
              <strong>{item.title}</strong>
              <span>{new Date(item.recordedAt).toLocaleDateString()}</span>
              <p>{item.description || "No additional details."}</p>
            </div>
          ))}
          {!data.records.length && <p className="muted">No additional records.</p>}
        </section>
      </div>
    </>
  );
}
