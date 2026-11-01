import { FormEvent, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { useAuthStore } from "../stores/auth";
import type { ClinicalReading } from "../types";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { filterByDateRange, type RangeKey } from "../lib/dateRange";

export function ReadingsPage() {
  const patientId = useAuthStore((state) => state.user?.patientProfileId)!;
  const [readings, setReadings] = useState<ClinicalReading[]>([]);
  const [form, setForm] = useState<Record<string, string>>({});
  const [range, setRange] = useState<RangeKey>("30");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get(`/clinical-readings/patient/${patientId}`);
      setReadings(data.readings);
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Clinical readings could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [patientId]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");

    const numeric = Object.fromEntries(
      Object.entries(form)
        .filter(([, value]) => value !== "")
        .map(([key, value]) => [key, Number(value)])
    );

    if (!Object.keys(numeric).length) {
      setError("Enter at least one clinical measurement.");
      return;
    }

    try {
      await api.post("/clinical-readings", {
        patientId,
        ...numeric,
        recordedAt: new Date().toISOString(),
      });
      setForm({});
      await load();
    } catch (err: any) {
      setError(err.response?.data?.message ?? "The reading could not be saved.");
    }
  }

  const filteredReadings = useMemo(
    () =>
      filterByDateRange(
        readings,
        range,
        customStart || undefined,
        customEnd || undefined
      ),
    [readings, range, customStart, customEnd]
  );

  const chart = [...filteredReadings].reverse().map((reading) => ({
    date: new Date(reading.recordedAt).toLocaleDateString(),
    glucose: reading.glucose,
    systolic: reading.systolicBP,
    diastolic: reading.diastolicBP,
    hba1c: reading.hba1c,
    bmi: reading.bmi,
    weight: reading.weightKg,
  }));

  function chartBox(
    title: string,
    unit: string,
    lines: { key: string; label: string; stroke: string }[]
  ) {
    return (
      <section className="card chart-card" aria-label={`${title} trend chart`}>
        <div className="chart-heading">
          <h3>{title}</h3>
          <span className="muted">{unit}</span>
        </div>
        {chart.length ? (
          <ResponsiveContainer width="100%" height={270}>
            <LineChart data={chart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              {lines.map((line) => (
                <Line
                  key={line.key}
                  name={line.label}
                  dataKey={line.key}
                  type="monotone"
                  stroke={line.stroke}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState
            title="No readings in this period"
            message="Choose a wider date range or add a new reading."
          />
        )}
      </section>
    );
  }

  if (loading) return <LoadingState message="Loading clinical readings..." />;

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Clinical readings</h1>
          <p>Record and review health measurements over time.</p>
        </div>
      </div>

      {error && <ErrorState message={error} />}

      <div className="card">
        <form className="reading-form" onSubmit={submit}>
          {[
            ["glucose", "Blood glucose", "mg/dL"],
            ["systolicBP", "Systolic BP", "mmHg"],
            ["diastolicBP", "Diastolic BP", "mmHg"],
            ["hba1c", "HbA1c", "%"],
            ["weightKg", "Weight", "kg"],
            ["heightCm", "Height", "cm"],
            ["bmi", "BMI", ""],
          ].map(([key, label, unit]) => (
            <label key={key} htmlFor={`reading-${key}`}>
              {label} {unit && <small>({unit})</small>}
              <input
                id={`reading-${key}`}
                type="number"
                step="any"
                value={form[key] ?? ""}
                onChange={(event) =>
                  setForm({ ...form, [key]: event.target.value })
                }
              />
            </label>
          ))}
          <button className="primary" type="submit">
            Save reading
          </button>
        </form>
      </div>

      <div className="card filter-bar">
        <label htmlFor="chart-range">
          Chart period
          <select
            id="chart-range"
            value={range}
            onChange={(event) => setRange(event.target.value as RangeKey)}
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 3 months</option>
            <option value="180">Last 6 months</option>
            <option value="custom">Custom range</option>
            <option value="all">All readings</option>
          </select>
        </label>

        {range === "custom" && (
          <>
            <label htmlFor="custom-start">
              From
              <input
                id="custom-start"
                type="date"
                value={customStart}
                onChange={(event) => setCustomStart(event.target.value)}
              />
            </label>
            <label htmlFor="custom-end">
              To
              <input
                id="custom-end"
                type="date"
                value={customEnd}
                onChange={(event) => setCustomEnd(event.target.value)}
              />
            </label>
          </>
        )}
      </div>

      <div className="charts-grid">
        {chartBox("Blood glucose", "mg/dL", [
          { key: "glucose", label: "Glucose", stroke: "#0f766e" },
        ])}
        {chartBox("Blood pressure", "mmHg", [
          { key: "systolic", label: "Systolic", stroke: "#2563eb" },
          { key: "diastolic", label: "Diastolic", stroke: "#7c3aed" },
        ])}
        {chartBox("HbA1c", "%", [
          { key: "hba1c", label: "HbA1c", stroke: "#d97706" },
        ])}
        {chartBox("Weight and BMI", "kg / BMI", [
          { key: "weight", label: "Weight", stroke: "#0891b2" },
          { key: "bmi", label: "BMI", stroke: "#be185d" },
        ])}
      </div>
    </>
  );
}
