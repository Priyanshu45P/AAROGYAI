import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserRole } from "@prisma/client";

const mocks = vi.hoisted(() => ({
  findPatient: vi.fn(),
  findAssignment: vi.fn(),
}));

vi.mock("../src/lib/prisma", () => ({
  prisma: {
    patientProfile: {
      findUnique: mocks.findPatient,
    },
    clinicianPatientAssignment: {
      findFirst: mocks.findAssignment,
    },
  },
}));

import { canAccessPatient } from "../src/services/access.service";

describe("clinician-patient access control", () => {
  beforeEach(() => {
    mocks.findPatient.mockReset();
    mocks.findAssignment.mockReset();
  });

  it("allows a patient to view only their own profile", async () => {
    mocks.findPatient.mockResolvedValue({ id: "patient-1" });

    expect(
      await canAccessPatient("user-1", UserRole.PATIENT, "patient-1")
    ).toBe(true);

    expect(
      await canAccessPatient("user-1", UserRole.PATIENT, "patient-2")
    ).toBe(false);
  });

  it("allows a clinician only when an active assignment exists", async () => {
    mocks.findAssignment.mockResolvedValueOnce({ id: "assignment-1" });

    expect(
      await canAccessPatient("doctor-user", UserRole.CLINICIAN, "patient-1")
    ).toBe(true);

    mocks.findAssignment.mockResolvedValueOnce(null);

    expect(
      await canAccessPatient("doctor-user", UserRole.CLINICIAN, "patient-2")
    ).toBe(false);
  });

  it("allows an administrator to review records for administration", async () => {
    expect(
      await canAccessPatient("admin-user", UserRole.ADMIN, "patient-1")
    ).toBe(true);
  });
});
