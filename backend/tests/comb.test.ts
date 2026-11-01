import { describe, expect, it } from "vitest";
import { calculateCombScores, normaliseLikert, supportAreas } from "../src/utils/comb";

// These tests verify the transparent COM-B scoring rules used by the application.
describe("COM-B scoring", () => {
  it("normalises Likert answers from 1-5 to 0-100", () => {
    expect(normaliseLikert(1)).toBe(0);
    expect(normaliseLikert(3)).toBe(50);
    expect(normaliseLikert(5)).toBe(100);
  });

  it("calculates dimension and overall scores", () => {
    const scores = calculateCombScores([
      { answer: 5, dimension: "CAPABILITY" },
      { answer: 3, dimension: "OPPORTUNITY" },
      { answer: 1, dimension: "MOTIVATION" }
    ]);
    expect(scores.capabilityScore).toBe(100);
    expect(scores.opportunityScore).toBe(50);
    expect(scores.motivationScore).toBe(0);
    expect(Math.round(scores.overallScore)).toBe(50);
  });

  it("identifies lower-scoring areas that may need support", () => {
    const areas = supportAreas({ capabilityScore: 75, opportunityScore: 55, motivationScore: 40, overallScore: 56.6 });
    expect(areas).toEqual(["OPPORTUNITY", "MOTIVATION"]);
  });
});
