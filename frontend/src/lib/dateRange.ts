export type RangeKey = "7" | "30" | "90" | "180" | "custom" | "all";

export function filterByDateRange<T extends { recordedAt: string }>(
  items: T[],
  range: RangeKey,
  customStart?: string,
  customEnd?: string
): T[] {
  if (range === "all") return items;

  const now = new Date();
  let start: Date | null = null;
  let end: Date | null = now;

  if (range === "custom") {
    start = customStart ? new Date(`${customStart}T00:00:00`) : null;
    end = customEnd ? new Date(`${customEnd}T23:59:59`) : now;
  } else {
    const days = Number(range);
    start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  }

  return items.filter((item) => {
    const date = new Date(item.recordedAt);
    return (!start || date >= start) && (!end || date <= end);
  });
}
