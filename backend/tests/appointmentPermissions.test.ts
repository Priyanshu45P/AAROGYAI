import { describe, expect, it } from "vitest";
import { clinicianOwnsAppointment } from "../src/utils/appointmentPermissions";

describe("appointment permissions", () => {
  it("allows the clinician assigned to the appointment", () => {
    expect(clinicianOwnsAppointment("clinician-1", "clinician-1")).toBe(true);
  });

  it("blocks another clinician", () => {
    expect(clinicianOwnsAppointment("clinician-2", "clinician-1")).toBe(false);
  });

  it("blocks a missing clinician profile", () => {
    expect(clinicianOwnsAppointment(undefined, "clinician-1")).toBe(false);
  });
});
