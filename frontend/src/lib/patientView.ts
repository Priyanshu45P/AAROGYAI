export function readingDelta(
  latest: number | null | undefined,
  previous: number | null | undefined,
  unit = ""
): string | undefined {
  if (latest == null || previous == null) return undefined;
  const delta = latest - previous;
  if (Math.abs(delta) < 0.0001) return `No change from previous reading`;
  const direction = delta > 0 ? "↑" : "↓";
  const value = Math.abs(delta).toFixed(Number.isInteger(delta) ? 0 : 1);
  return `${direction} ${value}${unit ? ` ${unit}` : ""} from previous reading`;
}
