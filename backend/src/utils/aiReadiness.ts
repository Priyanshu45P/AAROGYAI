type LatestReading = {
  glucose?: number | null;
  systolicBP?: number | null;
  diastolicBP?: number | null;
  bmi?: number | null;
  hba1c?: number | null;
} | undefined;

export function predictionReadiness(
  dateOfBirth: Date | null | undefined,
  reading: LatestReading
) {
  const missing: string[] = [];

  // Do not invent clinical input values for the AI model.
  if (!dateOfBirth) missing.push("date of birth");
  if (reading?.glucose == null) missing.push("blood glucose");
  if (reading?.systolicBP == null || reading?.diastolicBP == null) {
    missing.push("blood pressure");
  }
  if (reading?.bmi == null) missing.push("BMI");
  if (reading?.hba1c == null) missing.push("HbA1c");

  return {
    ready: missing.length === 0,
    missing,
  };
}
