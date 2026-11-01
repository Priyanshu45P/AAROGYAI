import { NextFunction, Request, Response } from "express";
import { UserRole, UserStatus } from "@prisma/client";
import { z } from "zod";
import {
  adminStats,
  assignPatient,
  assignmentOptions,
  createClinician,
  endAssignment,
  searchUsers,
  updateRole,
} from "../services/admin.service";
import { prisma } from "../lib/prisma";
import { writeAudit } from "../utils/audit";

export async function getStats(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    res.json({ success: true, stats: await adminStats() });
  } catch (error) {
    next(error);
  }
}

export async function getUsers(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const filters = z
      .object({
        q: z.string().max(100).optional(),
        role: z.nativeEnum(UserRole).optional(),
        status: z.nativeEnum(UserStatus).optional(),
      })
      .parse(req.query);

    res.json({ success: true, users: await searchUsers(filters) });
  } catch (error) {
    next(error);
  }
}

export async function postClinician(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const input = z
      .object({
        firstName: z.string().min(2),
        lastName: z.string().min(2),
        email: z.string().email(),
        password: z.string().min(8),
        speciality: z.string().max(150).optional(),
        registrationNumber: z.string().max(100).optional(),
      })
      .parse(req.body);

    const user = await createClinician(input);
    await writeAudit(
      req.authUser!.id,
      "CLINICIAN_CREATED",
      "User",
      user.id
    );

    res.status(201).json({
      success: true,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (error) {
    next(error);
  }
}

export async function patchStatus(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { status } = z
      .object({ status: z.nativeEnum(UserStatus) })
      .parse(req.body);

    if (req.params.id === req.authUser!.id && status !== UserStatus.ACTIVE) {
      return res.status(400).json({
        success: false,
        message: "You cannot disable your own administrator account.",
      });
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { status },
    });

    await writeAudit(
      req.authUser!.id,
      "USER_STATUS_CHANGED",
      "User",
      user.id,
      { status }
    );

    res.json({
      success: true,
      user: { id: user.id, status: user.status },
    });
  } catch (error) {
    next(error);
  }
}

export async function patchRole(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { role } = z
      .object({ role: z.nativeEnum(UserRole) })
      .parse(req.body);

    if (req.params.id === req.authUser!.id && role !== UserRole.ADMIN) {
      return res.status(400).json({
        success: false,
        message: "You cannot remove your own administrator role.",
      });
    }

    const user = await updateRole(req.params.id, role);
    await writeAudit(
      req.authUser!.id,
      "USER_ROLE_CHANGED",
      "User",
      user.id,
      { role }
    );

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
}

export async function getAssignments(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    res.json({ success: true, ...(await assignmentOptions()) });
  } catch (error) {
    next(error);
  }
}

export async function postAssignment(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { clinicianId, patientId } = z
      .object({
        clinicianId: z.string().min(1),
        patientId: z.string().min(1),
      })
      .parse(req.body);

    const assignment = await assignPatient(clinicianId, patientId);
    await writeAudit(
      req.authUser!.id,
      "CLINICIAN_PATIENT_ASSIGNED",
      "ClinicianPatientAssignment",
      assignment.id
    );

    res.status(201).json({ success: true, assignment });
  } catch (error) {
    next(error);
  }
}

export async function deleteAssignment(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const assignment = await endAssignment(req.params.id);
    await writeAudit(
      req.authUser!.id,
      "CLINICIAN_PATIENT_ASSIGNMENT_ENDED",
      "ClinicianPatientAssignment",
      assignment.id
    );
    res.json({ success: true, assignment });
  } catch (error) {
    next(error);
  }
}

export async function getAudit(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });
    res.json({ success: true, logs });
  } catch (error) {
    next(error);
  }
}
