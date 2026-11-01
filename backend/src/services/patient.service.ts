import { RiskLevel, UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { canAccessPatient } from "./access.service";

export type PatientListFilters = {
  q?: string;
  risk?: "LOW" | "MODERATE" | "HIGH";
  condition?: "diabetes" | "hypertension";
  comb?: "CAPABILITY" | "OPPORTUNITY" | "MOTIVATION";
  abnormal?: "true" | "false";
  sort?: "name" | "risk" | "recent";
};

// These review flags are for prototype prioritisation only.
// They are not diagnoses or treatment thresholds.
function hasReviewFlag(reading: any): boolean {
  if (!reading) return false;
  return Boolean(
    (reading.glucose != null && reading.glucose >= 180) ||
    (reading.systolicBP != null && reading.systolicBP >= 140) ||
    (reading.diastolicBP != null && reading.diastolicBP >= 90) ||
    (reading.hba1c != null && reading.hba1c >= 7)
  );
}

function mainCombConcern(assessment: any): string | null {
  if (!assessment) return null;

  const entries = [
    ["CAPABILITY", assessment.capabilityScore],
    ["OPPORTUNITY", assessment.opportunityScore],
    ["MOTIVATION", assessment.motivationScore],
  ] as const;

  const lowest = [...entries].sort((a, b) => Number(a[1]) - Number(b[1]))[0];
  return Number(lowest[1]) < 60 ? lowest[0] : null;
}

export async function listPatientsForUser(
  userId: string,
  role: UserRole,
  filters: PatientListFilters
) {
  // Clinicians only receive patients assigned to them.
  const where =
    role === UserRole.CLINICIAN
      ? {
          clinicianAssignments: {
            some: {
              active: true,
              clinician: { userId },
            },
          },
        }
      : {};

  const patients = await prisma.patientProfile.findMany({
    where,
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          status: true,
        },
      },
      conditions: {
        where: { active: true },
        select: { name: true },
      },
      clinicalReadings: {
        orderBy: { recordedAt: "desc" },
        take: 2,
      },
      behaviourAssessments: {
        orderBy: { completedAt: "desc" },
        take: 1,
      },
      riskPredictions: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  const query = filters.q?.toLowerCase();

  let result = patients.map((patient) => {
    const latest = patient.clinicalReadings[0];
    const latestRisk = patient.riskPredictions[0];
    const latestComb = patient.behaviourAssessments[0];
    const conditions = patient.conditions.map((condition) =>
      condition.name.toLowerCase()
    );

    return {
      ...patient,
      reviewFlag: hasReviewFlag(latest),
      mainCombConcern: mainCombConcern(latestComb),
      hasDiabetes: conditions.some((name) => name.includes("diabet")),
      hasHypertension: conditions.some(
        (name) => name.includes("hypertension") || name.includes("high blood pressure")
      ),
      latestRisk: latestRisk?.riskLevel ?? null,
    };
  });

  if (query) {
    result = result.filter((patient) => {
      const searchable = `${patient.user.firstName} ${patient.user.lastName} ${patient.user.email}`.toLowerCase();
      return searchable.includes(query);
    });
  }

  if (filters.risk) {
    result = result.filter((patient) => patient.latestRisk === filters.risk);
  }

  if (filters.condition === "diabetes") {
    result = result.filter((patient) => patient.hasDiabetes);
  }

  if (filters.condition === "hypertension") {
    result = result.filter((patient) => patient.hasHypertension);
  }

  if (filters.comb) {
    result = result.filter((patient) => patient.mainCombConcern === filters.comb);
  }

  if (filters.abnormal === "true") {
    result = result.filter((patient) => patient.reviewFlag);
  }

  const riskOrder: Record<string, number> = {
    HIGH: 3,
    MODERATE: 2,
    LOW: 1,
  };

  if (filters.sort === "risk") {
    result.sort(
      (a, b) =>
        (riskOrder[b.latestRisk ?? ""] ?? 0) -
        (riskOrder[a.latestRisk ?? ""] ?? 0)
    );
  } else if (filters.sort === "recent") {
    result.sort((a, b) => {
      const aTime = a.clinicalReadings[0]?.recordedAt?.getTime?.() ?? 0;
      const bTime = b.clinicalReadings[0]?.recordedAt?.getTime?.() ?? 0;
      return bTime - aTime;
    });
  } else {
    result.sort((a, b) =>
      `${a.user.firstName} ${a.user.lastName}`.localeCompare(
        `${b.user.firstName} ${b.user.lastName}`
      )
    );
  }

  return result;
}

export async function getPatientForUser(
  userId: string,
  role: UserRole,
  patientId: string
) {
  if (!(await canAccessPatient(userId, role, patientId))) {
    return null;
  }

  const recommendationWhere =
    role === UserRole.PATIENT ? { approved: true } : undefined;

  return prisma.patientProfile.findUnique({
    where: { id: patientId },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      clinicalReadings: {
        orderBy: { recordedAt: "desc" },
        take: 100,
      },
      conditions: true,
      medications: true,
      allergies: true,
      familyHistories: true,
      medicalRecords: true,
      appointments: {
        orderBy: { appointmentDate: "desc" },
        take: 30,
        include: {
          clinician: { include: { user: true } },
        },
      },
      behaviourAssessments: {
        orderBy: { completedAt: "desc" },
        take: 30,
      },
      riskPredictions: {
        orderBy: { createdAt: "desc" },
        take: 30,
        include: { featureContributions: true },
      },
      recommendations: {
        where: recommendationWhere,
        orderBy: { createdAt: "desc" },
        take: 30,
      },
      carePlans: {
        include: { goals: true },
        orderBy: { createdAt: "desc" },
      },
      clinicalNotes: {
        orderBy: { createdAt: "desc" },
        take: 30,
        include: {
          clinician: { include: { user: true } },
        },
      },
    },
  });
}
