import { UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma";

export async function canAccessPatient(
  userId: string,
  role: UserRole,
  patientId: string
): Promise<boolean> {
  // Admins can review records for system administration.
  if (role === UserRole.ADMIN) return true;

  if (role === UserRole.PATIENT) {
    // A patient can only open their own patient profile.
    const profile = await prisma.patientProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    return profile?.id === patientId;
  }

  if (role === UserRole.CLINICIAN) {
    // Clinicians must have an active care relationship with the patient.
    const assignment = await prisma.clinicianPatientAssignment.findFirst({
      where: {
        patientId,
        active: true,
        clinician: { userId },
      },
      select: { id: true },
    });
    return Boolean(assignment);
  }

  return false;
}

export async function clinicianProfileForUser(userId: string) {
  return prisma.clinicianProfile.findUnique({
    where: { userId },
    select: { id: true, userId: true },
  });
}

export async function createOrReactivateAssignment(
  clinicianId: string,
  patientId: string
) {
  // Reuse an existing relationship instead of creating duplicates.
  return prisma.clinicianPatientAssignment.upsert({
    where: {
      clinicianId_patientId: { clinicianId, patientId },
    },
    update: {
      active: true,
      endedAt: null,
      assignedAt: new Date(),
    },
    create: {
      clinicianId,
      patientId,
      active: true,
    },
  });
}
