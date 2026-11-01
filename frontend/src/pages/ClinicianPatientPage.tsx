import { FormEvent, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";
import { MetricCard } from "../components/MetricCard";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";
import { RiskBadge } from "../components/RiskBadge";

const tabs = [
  "Overview",
  "Medical History",
  "Behaviour",
  "AI Insights",
  "Care Plan",
  "Clinical Notes",
] as const;

type Tab = (typeof tabs)[number];

export function ClinicianPatientPage() {
  const { id } = useParams();
  const [patient, setPatient] = useState<any>(null);
  const [tab, setTab] = useState<Tab>("Overview");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [plan, setPlan] = useState<any>({
    title: "",
    startDate: new Date().toISOString().slice(0, 10),
  });
  const [medical, setMedical] = useState<any>({
    kind: "condition",
    name: "",
    detail: "",
    relationship: "",
  });
  const [goal, setGoal] = useState<any>({
    planId: "",
    title: "",
    description: "",
  });

  async function load() {
    setError("");
    try {
      const response = await api.get(`/patients/${id}`);
      setPatient(response.data.patient);
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Patient information could not be loaded.");
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function addNote(event: FormEvent) {
    event.preventDefault();
    await api.post("/clinical-notes", { patientId: id, note });
    setNote("");
    await load();
  }

  async function addPlan(event: FormEvent) {
    event.preventDefault();
    await api.post("/care-plans", {
      patientId: id,
      title: plan.title,
      clinicalGoal: plan.clinicalGoal,
      patientGoal: plan.patientGoal,
      recommendation: plan.recommendation,
      startDate: new Date(plan.startDate).toISOString(),
      reviewDate: plan.reviewDate
        ? new Date(plan.reviewDate).toISOString()
        : undefined,
    });
    setPlan({
      title: "",
      startDate: new Date().toISOString().slice(0, 10),
    });
    await load();
  }

  async function addMedical(event: FormEvent) {
    event.preventDefault();

    if (medical.kind === "record") {
      await api.post("/medical/records", {
        patientId: id,
        title: medical.name,
        description: medical.detail,
      });
    }

    if (medical.kind === "condition") {
      await api.post("/medical/conditions", {
        patientId: id,
        name: medical.name,
        description: medical.detail,
      });
    }

    if (medical.kind === "medication") {
      await api.post("/medical/medications", {
        patientId: id,
        name: medical.name,
        dosage: medical.detail,
      });
    }

    if (medical.kind === "allergy") {
      await api.post("/medical/allergies", {
        patientId: id,
        allergen: medical.name,
        reaction: medical.detail,
      });
    }

    if (medical.kind === "family") {
      await api.post("/medical/family-history", {
        patientId: id,
        relationship: medical.relationship,
        condition: medical.name,
        notes: medical.detail,
      });
    }

    setMedical({
      kind: "condition",
      name: "",
      detail: "",
      relationship: "",
    });
    await load();
  }

  async function reviewRecommendation(recommendationId: string, approved: boolean) {
    await api.patch(`/behaviour/recommendations/${recommendationId}`, {
      approved,
    });
    await load();
  }

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!patient) return <LoadingState message="Loading patient record..." />;

  const latest = patient.clinicalReadings?.[0];
  const ai = patient.riskPredictions?.[0];
  const comb = patient.behaviourAssessments?.[0];

  const mainCombConcern = comb
    ? [
        ["Capability", comb.capabilityScore],
        ["Opportunity", comb.opportunityScore],
        ["Motivation", comb.motivationScore],
      ].sort((a: any, b: any) => a[1] - b[1])[0]
    : null;

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>
            {patient.user.firstName} {patient.user.lastName}
          </h1>
          <p>Patient ID: {patient.id}</p>
        </div>
      </div>

      <div className="tabs" role="tablist" aria-label="Patient record sections">
        {tabs.map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={tab === item}
            className={tab === item ? "active" : ""}
            onClick={() => setTab(item)}
          >
            {item}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <>
          <div className="metric-grid">
            <MetricCard
              label="Glucose"
              value={
                latest?.glucose != null
                  ? `${latest.glucose} mg/dL`
                  : "No reading"
              }
            />
            <MetricCard
              label="Blood pressure"
              value={
                latest?.systolicBP != null
                  ? `${latest.systolicBP}/${latest.diastolicBP} mmHg`
                  : "No reading"
              }
            />
            <MetricCard
              label="HbA1c"
              value={latest?.hba1c != null ? `${latest.hba1c}%` : "No reading"}
            />
            <MetricCard
              label="AI risk"
              value={ai?.riskLevel ?? "Not assessed"}
            />
            <MetricCard
              label="COM-B"
              value={comb ? `${Math.round(comb.overallScore)}%` : "Not assessed"}
            />
          </div>

          <div className="card">
            <h3>Clinical Decision Support Summary</h3>
            <div className="decision-grid">
              <section>
                <span>Clinical observations</span>
                <p>
                  {latest
                    ? `Latest glucose ${latest.glucose ?? "not recorded"}, blood pressure ${
                        latest.systolicBP != null
                          ? `${latest.systolicBP}/${latest.diastolicBP}`
                          : "not recorded"
                      }, HbA1c ${latest.hba1c ?? "not recorded"}, BMI ${
                        latest.bmi ?? "not recorded"
                      }.`
                    : "No clinical readings are available."}
                </p>
              </section>

              <section>
                <span>AI analysis</span>
                {ai ? (
                  <>
                    <RiskBadge level={ai.riskLevel} />
                    <p>
                      Model probability {Math.round(ai.probability * 100)}%.
                    </p>
                    <p>
                      Main factors:{" "}
                      {ai.featureContributions
                        ?.slice(0, 3)
                        .map((feature: any) => feature.featureName)
                        .join(", ") || "Not available"}.
                    </p>
                  </>
                ) : (
                  <p>No prediction available.</p>
                )}
              </section>

              <section>
                <span>Behaviour assessment</span>
                <p>
                  {comb
                    ? `Capability ${Math.round(
                        comb.capabilityScore
                      )}%, Opportunity ${Math.round(
                        comb.opportunityScore
                      )}%, Motivation ${Math.round(comb.motivationScore)}%.`
                    : "No COM-B assessment available."}
                </p>
                {mainCombConcern && (
                  <p>
                    Lowest current dimension: <strong>{mainCombConcern[0]}</strong>.
                  </p>
                )}
              </section>
            </div>

            <div className="notice compact-notice">
              <strong>Suggested items for clinician review</strong>
              <ul>
                <li>Review longitudinal clinical measurements.</li>
                <li>Review the AI explanation rather than the risk label alone.</li>
                <li>Discuss identified COM-B barriers with the patient.</li>
                <li>Update the care plan only after professional review.</li>
              </ul>
            </div>

            <p className="muted">
              This summary supports clinician review and is not an autonomous
              diagnosis or treatment decision.
            </p>
          </div>
        </>
      )}

      {tab === "Medical History" && (
        <>
          <form className="card compact-form" onSubmit={addMedical}>
            <h3>Add medical information</h3>
            <label>
              Type
              <select
                value={medical.kind}
                onChange={(event) =>
                  setMedical({ ...medical, kind: event.target.value })
                }
              >
                <option value="record">General record</option>
                <option value="condition">Condition / diagnosis</option>
                <option value="medication">Medication</option>
                <option value="allergy">Allergy</option>
                <option value="family">Family history</option>
              </select>
            </label>

            {medical.kind === "family" && (
              <label>
                Relationship
                <input
                  value={medical.relationship ?? ""}
                  onChange={(event) =>
                    setMedical({
                      ...medical,
                      relationship: event.target.value,
                    })
                  }
                  placeholder="For example: Parent"
                  required
                />
              </label>
            )}

            <label>
              {medical.kind === "family" ? "Condition" : "Name"}
              <input
                value={medical.name ?? ""}
                onChange={(event) =>
                  setMedical({ ...medical, name: event.target.value })
                }
                required
              />
            </label>

            <label>
              Details
              <input
                value={medical.detail ?? ""}
                onChange={(event) =>
                  setMedical({ ...medical, detail: event.target.value })
                }
              />
            </label>

            <button className="primary" type="submit">
              Add information
            </button>
          </form>

          <div className="history-grid">
            <section className="card">
              <h3>Conditions</h3>
              {patient.conditions.map((item: any) => (
                <div className="history-item" key={item.id}>
                  <strong>{item.name}</strong>
                  <span>{item.active ? "Active" : "Inactive"}</span>
                  <p>{item.description}</p>
                  {item.active && (
                    <button
                      type="button"
                      className="text-button"
                      onClick={async () => {
                        await api.patch(`/medical/conditions/${item.id}`, {
                          active: false,
                        });
                        await load();
                      }}
                    >
                      Mark inactive
                    </button>
                  )}
                </div>
              ))}
            </section>

            <section className="card">
              <h3>Medications</h3>
              {patient.medications.map((item: any) => (
                <div className="history-item" key={item.id}>
                  <strong>{item.name}</strong>
                  <span>
                    {[item.dosage, item.frequency].filter(Boolean).join(" • ")}
                  </span>
                  <p>{item.active ? "Active" : "Inactive"}</p>
                  {item.active && (
                    <button
                      type="button"
                      className="text-button"
                      onClick={async () => {
                        await api.patch(`/medical/medications/${item.id}`, {
                          active: false,
                        });
                        await load();
                      }}
                    >
                      Mark inactive
                    </button>
                  )}
                </div>
              ))}
            </section>

            <section className="card">
              <h3>Allergies</h3>
              {patient.allergies.map((item: any) => (
                <div className="history-item" key={item.id}>
                  <strong>{item.allergen}</strong>
                  <span>{item.severity || "Severity not recorded"}</span>
                  <p>{item.reaction}</p>
                </div>
              ))}
            </section>

            <section className="card">
              <h3>Family history</h3>
              {patient.familyHistories.map((item: any) => (
                <div className="history-item" key={item.id}>
                  <strong>{item.relationship}</strong>
                  <span>{item.condition}</span>
                  <p>{item.notes}</p>
                </div>
              ))}
              {!patient.familyHistories.length && (
                <p className="muted">No family history recorded.</p>
              )}
            </section>

            <section className="card history-wide">
              <h3>General clinical records</h3>
              {patient.medicalRecords.map((item: any) => (
                <div className="history-item" key={item.id}>
                  <strong>{item.title}</strong>
                  <span>{new Date(item.recordedAt).toLocaleDateString()}</span>
                  <p>{item.description}</p>
                </div>
              ))}
            </section>
          </div>
        </>
      )}

      {tab === "Behaviour" && (
        <>
          <div className="card">
            <h3>COM-B history</h3>
            {patient.behaviourAssessments.map((assessment: any) => (
              <div className="support-item" key={assessment.id}>
                <strong>
                  {new Date(assessment.completedAt).toLocaleDateString()}
                </strong>
                <p>
                  Capability {Math.round(assessment.capabilityScore)}% •
                  Opportunity {Math.round(assessment.opportunityScore)}% •
                  Motivation {Math.round(assessment.motivationScore)}%
                </p>
              </div>
            ))}
          </div>

          <div className="card">
            <h3>Behaviour support recommendations</h3>
            {patient.recommendations.map((recommendation: any) => (
              <div className="recommendation-review" key={recommendation.id}>
                <div>
                  <strong>{recommendation.title}</strong>
                  <span className="status">
                    {recommendation.approved ? "APPROVED" : "PENDING REVIEW"}
                  </span>
                  <p>{recommendation.message}</p>
                </div>
                <div className="row-actions">
                  {!recommendation.approved ? (
                    <button
                      type="button"
                      className="primary"
                      onClick={() =>
                        reviewRecommendation(recommendation.id, true)
                      }
                    >
                      Approve for patient
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="secondary"
                      onClick={() =>
                        reviewRecommendation(recommendation.id, false)
                      }
                    >
                      Withdraw approval
                    </button>
                  )}
                </div>
              </div>
            ))}
            {!patient.recommendations.length && (
              <p className="muted">No behaviour recommendations available.</p>
            )}
          </div>
        </>
      )}

      {tab === "AI Insights" && (
        <div className="card">
          <h3>Prediction history</h3>
          {patient.riskPredictions.map((prediction: any) => (
            <div className="support-item" key={prediction.id}>
              <RiskBadge level={prediction.riskLevel} />
              <strong>
                {" "}
                {Math.round(prediction.probability * 100)}% model probability
              </strong>
              <p>
                {new Date(prediction.createdAt).toLocaleString()} •{" "}
                {prediction.modelName} {prediction.modelVersion}
              </p>
              <div className="feature-list">
                {prediction.featureContributions.map((feature: any) => (
                  <div key={feature.id}>
                    <span>
                      {feature.featureName}: {feature.featureValue}
                    </span>
                    <strong>
                      {Number(feature.shapValue) >= 0 ? "↑" : "↓"}{" "}
                      {Math.abs(Number(feature.shapValue)).toFixed(3)}
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {!patient.riskPredictions.length && (
            <p className="muted">No predictions have been generated.</p>
          )}
          <div className="notice compact-notice">
            AI output supports clinical judgement and must not be used as a
            standalone diagnosis.
          </div>
        </div>
      )}

      {tab === "Care Plan" && (
        <>
          <form className="card care-form" onSubmit={addPlan}>
            <h3>Create care plan</h3>
            <label>
              Title
              <input
                value={plan.title}
                onChange={(event) =>
                  setPlan({ ...plan, title: event.target.value })
                }
                required
              />
            </label>
            <label>
              Clinical goal
              <textarea
                value={plan.clinicalGoal ?? ""}
                onChange={(event) =>
                  setPlan({ ...plan, clinicalGoal: event.target.value })
                }
              />
            </label>
            <label>
              Patient goal
              <textarea
                value={plan.patientGoal ?? ""}
                onChange={(event) =>
                  setPlan({ ...plan, patientGoal: event.target.value })
                }
              />
            </label>
            <label>
              Recommendation
              <textarea
                value={plan.recommendation ?? ""}
                onChange={(event) =>
                  setPlan({ ...plan, recommendation: event.target.value })
                }
              />
            </label>
            <label>
              Start date
              <input
                type="date"
                value={plan.startDate}
                onChange={(event) =>
                  setPlan({ ...plan, startDate: event.target.value })
                }
                required
              />
            </label>
            <label>
              Review date
              <input
                type="date"
                value={plan.reviewDate ?? ""}
                onChange={(event) =>
                  setPlan({ ...plan, reviewDate: event.target.value })
                }
              />
            </label>
            <button className="primary" type="submit">
              Create plan
            </button>
          </form>

          {patient.carePlans.map((carePlan: any) => (
            <div className="card" key={carePlan.id}>
              <div className="plan-title">
                <div>
                  <h3>{carePlan.title}</h3>
                  <p>{carePlan.recommendation}</p>
                </div>
                <label>
                  Status
                  <select
                    value={carePlan.status}
                    onChange={async (event) => {
                      await api.patch(`/care-plans/${carePlan.id}`, {
                        status: event.target.value,
                      });
                      await load();
                    }}
                  >
                    <option>ACTIVE</option>
                    <option>PAUSED</option>
                    <option>COMPLETED</option>
                    <option>CANCELLED</option>
                  </select>
                </label>
              </div>

              <h4>Goals</h4>
              {carePlan.goals.map((item: any) => (
                <div className="goal" key={item.id}>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.description}</p>
                  </div>
                  <div className="progress" aria-label={`${item.progress}% complete`}>
                    <span style={{ width: `${item.progress}%` }} />
                  </div>
                  <b>{item.progress}%</b>
                </div>
              ))}

              <form
                className="compact-form"
                onSubmit={async (event) => {
                  event.preventDefault();
                  await api.post(`/care-plans/${carePlan.id}/goals`, {
                    title: goal.title,
                    description: goal.description || undefined,
                  });
                  setGoal({ planId: "", title: "", description: "" });
                  await load();
                }}
              >
                <label>
                  New goal title
                  <input
                    value={goal.planId === carePlan.id ? goal.title : ""}
                    onChange={(event) =>
                      setGoal({
                        planId: carePlan.id,
                        title: event.target.value,
                        description:
                          goal.planId === carePlan.id ? goal.description : "",
                      })
                    }
                    required
                  />
                </label>
                <label>
                  Goal details
                  <input
                    value={
                      goal.planId === carePlan.id ? goal.description : ""
                    }
                    onChange={(event) =>
                      setGoal({
                        planId: carePlan.id,
                        title: goal.planId === carePlan.id ? goal.title : "",
                        description: event.target.value,
                      })
                    }
                  />
                </label>
                <button className="secondary" type="submit">
                  Add goal
                </button>
              </form>
            </div>
          ))}
        </>
      )}

      {tab === "Clinical Notes" && (
        <>
          <form className="card" onSubmit={addNote}>
            <h3>Add clinical note</h3>
            <label htmlFor="clinical-note">Clinical note</label>
            <textarea
              id="clinical-note"
              className="full-textarea"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              required
            />
            <button className="primary" type="submit">
              Save note
            </button>
          </form>

          <div className="card">
            {patient.clinicalNotes.map((item: any) => (
              <div className="support-item" key={item.id}>
                <strong>
                  {item.clinician.user.firstName}{" "}
                  {item.clinician.user.lastName}
                </strong>
                <small>{new Date(item.createdAt).toLocaleString()}</small>
                <p>{item.note}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
