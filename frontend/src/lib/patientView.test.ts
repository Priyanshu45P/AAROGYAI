import { describe, expect, it } from "vitest";
import { readingDelta } from "./patientView";

describe("reading change text", () => {
  it("shows an increase", () => {
    expect(readingDelta(130, 120, "mg/dL")).toContain("↑ 10");
  });

  it("shows a decrease", () => {
    expect(readingDelta(120, 130, "mg/dL")).toContain("↓ 10");
  });

  it("does not invent a change when history is missing", () => {
    expect(readingDelta(120, undefined, "mg/dL")).toBeUndefined();
  });
});
