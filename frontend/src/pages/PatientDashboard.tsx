import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { useAuthStore } from "../stores/auth";
import { MetricCard } from "../components/MetricCard";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";
import { readingDelta } from "../lib/patientView";

export function PatientDashboard() {
  const user = useAuthStore((state) => state.user)!;
  const [patient, setPatient] = useState<any>(null);
  const [error, setError] = useState("");

  async function load() {
    if (!user.patientProfileId) return;
    setError("");
    try {
      const response = await api.get(`/patients/${user.patientProfileId}`);
      setPatient(response.data.patient);
    } catch (err: any) {
      setError(
        err.response?.data?.message ?? "Your health overview could not be loaded."
      );
    }
  }

  useEffect(() => {
    load();
  }, [user.patientProfileId]);

  const nextAppointment = useMemo(() => {
    const now = Date.now();
    return patient?.appointments
      ?.filter(
        (appointment: any) =>
          new Date(appointment.appointmentDate).getTime() >= now &&
          ["REQUESTED", "CONFIRMED"].includes(appointment.status)
      )
      .sort(
        (a: any, b: any) =>
          new Date(a.appointmentDate).getTime() -
          new Date(b.appointmentDate).getTime()
      )[0];
  }, [patient]);

  const activeCarePlan = patient?.carePlans?.find(
    (plan: any) => plan.status === "ACTIVE"
  );

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!patient) return <LoadingState message="Loading your health overview..." />;

  const latest = patient.clinicalReadings?.[0];
  const previous = patient.clinicalReadings?.[1];
  const risk = patient.riskPredictions?.[0];
  const comb = patient.behaviourAssessments?.[0];

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Good to see you, {user.firstName}</h1>
          <p>Here is your latest health overview.</p>
        </div>
      </div>

      <div className="metric-grid">
        <MetricCard
          label="Blood glucose"
          value={latest?.glucose != null ? `${latest.glucose} mg/dL` : "No reading"}
          detail={readingDelta(latest?.glucose, previous?.glucose, "mg/dL")}
        />
        <MetricCard
          label="Blood pressure"
          value={
            latest?.systolicBP != null && latest?.diastolicBP != null
              ? `${latest.systolicBP}/${latest.diastolicBP} mmHg`
              : "No reading"
          }
          detail={readingDelta(
            latest?.systolicBP,
            previous?.systolicBP,
            "mmHg systolic"
          )}
        />
        <MetricCard
          label="HbA1c"
          value={latest?.hba1c != null ? `${latest.hba1c}%` : "No reading"}
          detail={readingDelta(latest?.hba1c, previous?.hba1c, "%")}
        />
        <MetricCard
          label="BMI"
          value={latest?.bmi != null ? String(latest.bmi) : "No reading"}
          detail={readingDelta(latest?.bmi, previous?.bmi)}
        />
        <MetricCard
          label="AI risk level"
          value={risk?.riskLevel ?? "Not assessed"}
          detail={
            risk ? `${Math.round(risk.probability * 100)}% model probability` : undefined
          }
        />
        <MetricCard
          label="COM-B behaviour status"
          value={comb ? `${Math.round(comb.overallScore ?? 0)}%` : "Not assessed"}
          detail={comb ? "Latest self-management assessment" : undefined}
        />
        <MetricCard
          label="Next appointment"
          value={
            nextAppointment
              ? new Date(nextAppointment.appointmentDate).toLocaleDateString()
              : "None scheduled"
          }
          detail={
            nextAppointment
              ? `${nextAppointment.status} • ${nextAppointment.clinician?.user?.firstName ?? ""} ${nextAppointment.clinician?.user?.lastName ?? ""}`.trim()
              : undefined
          }
        />
        <MetricCard
          label="Active care plan"
          value={activeCarePlan?.title ?? "No active plan"}
          detail={
            activeCarePlan?.reviewDate
              ? `Review ${new Date(activeCarePlan.reviewDate).toLocaleDateString()}`
              : undefined
          }
        />
      </div>

      <div className="card notice">
        <strong>Decision-support only</strong>
        <p>
          AAROGYAI does not replace your healthcare professional. Discuss clinical
          concerns and treatment decisions with qualified staff.
        </p>
      </div>
    </>
  );
}
