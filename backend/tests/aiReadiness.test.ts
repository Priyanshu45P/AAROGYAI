import { describe, expect, it } from "vitest";
import { predictionReadiness } from "../src/utils/aiReadiness";

describe("AI prediction readiness", () => {
  it("reports all missing required information", () => {
    const result = predictionReadiness(undefined, undefined);
    expect(result.ready).toBe(false);
    expect(result.missing).toContain("date of birth");
    expect(result.missing).toContain("blood glucose");
    expect(result.missing).toContain("blood pressure");
    expect(result.missing).toContain("BMI");
    expect(result.missing).toContain("HbA1c");
  });

  it("is ready when all required clinical information exists", () => {
    const result = predictionReadiness(
      new Date("1985-01-01"),
      {
        glucose: 120,
        systolicBP: 130,
        diastolicBP: 82,
        bmi: 26,
        hba1c: 6.2,
      }
    );
    expect(result).toEqual({ ready: true, missing: [] });
  });
});
