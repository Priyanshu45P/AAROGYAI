import { UserRole, UserStatus } from "@prisma/client";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma";
import { createOrReactivateAssignment } from "./access.service";

export async function adminStats() {
  const [users, patients, clinicians, predictions, assessments, assignments] =
    await Promise.all([
      prisma.user.count(),
      prisma.patientProfile.count(),
      prisma.clinicianProfile.count(),
      prisma.riskPrediction.count(),
      prisma.behaviourAssessment.count(),
      prisma.clinicianPatientAssignment.count({ where: { active: true } }),
    ]);

  return { users, patients, clinicians, predictions, assessments, assignments };
}

export async function searchUsers(filters: {
  q?: string;
  role?: UserRole;
  status?: UserStatus;
}) {
  const q = filters.q?.trim();

  return prisma.user.findMany({
    where: {
      ...(filters.role ? { role: filters.role } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(q
        ? {
            OR: [
              { firstName: { contains: q, mode: "insensitive" } },
              { lastName: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      patientProfile: { select: { id: true } },
      clinicianProfile: { select: { id: true, speciality: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createClinician(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  speciality?: string;
  registrationNumber?: string;
}) {
  const passwordHash = await bcrypt.hash(input.password, 12);

  return prisma.user.create({
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email.toLowerCase(),
      passwordHash,
      role: UserRole.CLINICIAN,
      clinicianProfile: {
        create: {
          speciality: input.speciality,
          registrationNumber: input.registrationNumber,
        },
      },
    },
    include: { clinicianProfile: true },
  });
}

export async function updateRole(userId: string, role: UserRole) {
  // Keep the matching profile available when an admin changes a role.
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      include: {
        patientProfile: true,
        clinicianProfile: true,
      },
    });

    if (!user) {
      throw Object.assign(new Error("User not found."), { statusCode: 404 });
    }

    if (role === UserRole.PATIENT && !user.patientProfile) {
      await tx.patientProfile.create({ data: { userId } });
    }

    if (role === UserRole.CLINICIAN && !user.clinicianProfile) {
      await tx.clinicianProfile.create({ data: { userId } });
    }

    return tx.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        status: true,
      },
    });
  });
}

export async function assignmentOptions() {
  const [clinicians, patients, assignments] = await Promise.all([
    prisma.clinicianProfile.findMany({
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { user: { lastName: "asc" } },
    }),
    prisma.patientProfile.findMany({
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { user: { lastName: "asc" } },
    }),
    prisma.clinicianPatientAssignment.findMany({
      where: { active: true },
      include: {
        clinician: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
        patient: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
      orderBy: { assignedAt: "desc" },
    }),
  ]);

  return { clinicians, patients, assignments };
}

export async function assignPatient(
  clinicianId: string,
  patientId: string
) {
  return createOrReactivateAssignment(clinicianId, patientId);
}

export async function endAssignment(id: string) {
  return prisma.clinicianPatientAssignment.update({
    where: { id },
    data: {
      active: false,
      endedAt: new Date(),
    },
  });
}
