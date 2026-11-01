export function RiskBadge({ level }: { level: "LOW" | "MODERATE" | "HIGH" | string }) {
  const normalised = String(level || "UNKNOWN").toLowerCase();
  return (
    <span className={`risk-badge ${normalised}`} aria-label={`AI risk level: ${level}`}>
      {level} RISK
    </span>
  );
}
