import { describe, expect, it } from "vitest";
import { normaliseLikert } from "../src/utils/comb";

describe("important validation rules", () => {
  it("rejects COM-B answers below 1", () => {
    expect(() => normaliseLikert(0)).toThrow();
  });

  it("rejects COM-B answers above 5", () => {
    expect(() => normaliseLikert(6)).toThrow();
  });

  it("converts the Likert endpoints correctly", () => {
    expect(normaliseLikert(1)).toBe(0);
    expect(normaliseLikert(5)).toBe(100);
  });
});
