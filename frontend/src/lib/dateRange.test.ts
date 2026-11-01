import { describe, expect, it } from "vitest";
import { filterByDateRange } from "./dateRange";

describe("date range filtering", () => {
  it("keeps all readings when all is selected", () => {
    const data = [
      { recordedAt: "2026-01-01T12:00:00Z" },
      { recordedAt: "2026-02-01T12:00:00Z" },
    ];
    expect(filterByDateRange(data, "all")).toHaveLength(2);
  });

  it("supports a custom date range", () => {
    const data = [
      { recordedAt: "2026-08-01T12:00:00Z" },
      { recordedAt: "2026-08-15T12:00:00Z" },
      { recordedAt: "2026-08-20T12:00:00Z" },
    ];
    const result = filterByDateRange(
      data,
      "custom",
      "2026-08-10",
      "2026-08-18"
    );
    expect(result).toHaveLength(1);
  });
});
