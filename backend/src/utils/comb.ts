import { CombDimension } from "@prisma/client";

export type CombAnswer = {
  answer: number;
  dimension: CombDimension;
};

export function normaliseLikert(answer: number): number {
  // Convert a 1-5 answer into a 0-100 score.
  if (!Number.isInteger(answer) || answer < 1 || answer > 5) {
    throw new Error("COM-B answers must be whole numbers from 1 to 5.");
  }
  return ((answer - 1) / 4) * 100;
}

export function calculateCombScores(items: CombAnswer[]) {
  const groups: Record<CombDimension, number[]> = {
    CAPABILITY: [],
    OPPORTUNITY: [],
    MOTIVATION: []
  };

  for (const item of items) {
    groups[item.dimension].push(normaliseLikert(item.answer));
  }

  const average = (values: number[]) =>
    values.length ? values.reduce((total, value) => total + value, 0) / values.length : 0;

  const capabilityScore = average(groups.CAPABILITY);
  const opportunityScore = average(groups.OPPORTUNITY);
  const motivationScore = average(groups.MOTIVATION);
  const overallScore = (capabilityScore + opportunityScore + motivationScore) / 3;

  return { capabilityScore, opportunityScore, motivationScore, overallScore };
}

export function supportAreas(scores: ReturnType<typeof calculateCombScores>, threshold = 60) {
  const areas: string[] = [];
  if (scores.capabilityScore < threshold) areas.push("CAPABILITY");
  if (scores.opportunityScore < threshold) areas.push("OPPORTUNITY");
  if (scores.motivationScore < threshold) areas.push("MOTIVATION");
  return areas;
}
