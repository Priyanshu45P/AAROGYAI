import { Router } from "express";
import { z } from "zod";
import { CarePlanStatus, GoalStatus, UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma";
import {
  authenticateUser,
  requireRole,
} from "../middleware/auth.middleware";
import { canAccessPatient } from "../services/access.service";
import { createNotification } from "../utils/notifications";
import { writeAudit } from "../utils/audit";

const router = Router();
router.use(authenticateUser);

router.get("/patient/:patientId", async (req, res, next) => {
  try {
    if (
      !(await canAccessPatient(
        req.authUser!.id,
        req.authUser!.role,
        req.params.patientId
      ))
    ) {
      return res.status(403).json({
        success: false,
        message: "You cannot view these care plans.",
      });
    }

    const carePlans = await prisma.carePlan.findMany({
      where: { patientId: req.params.patientId },
      include: {
        goals: true,
        clinician: { include: { user: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, carePlans });
  } catch (error) {
    next(error);
  }
});

router.post(
  "/",
  requireRole(UserRole.CLINICIAN),
  async (req, res, next) => {
    try {
      const clinician = await prisma.clinicianProfile.findUnique({
        where: { userId: req.authUser!.id },
      });

      if (!clinician) {
        return res.status(400).json({
          success: false,
          message: "Clinician profile not found.",
        });
      }

      const data = z
        .object({
          patientId: z.string(),
          title: z.string().min(2),
          clinicalGoal: z.string().max(2000).optional(),
          patientGoal: z.string().max(2000).optional(),
          recommendation: z.string().max(3000).optional(),
          clinicianNotes: z.string().max(5000).optional(),
          startDate: z.coerce.date(),
          reviewDate: z.coerce.date().optional(),
        })
        .parse(req.body);

      if (
        !(await canAccessPatient(
          req.authUser!.id,
          req.authUser!.role,
          data.patientId
        ))
      ) {
        return res.status(403).json({
          success: false,
          message: "You are not assigned to this patient.",
        });
      }

      const carePlan = await prisma.carePlan.create({
        data: {
          ...data,
          clinicianId: clinician.id,
        },
        include: { patient: { include: { user: true } } },
      });

      await createNotification(
        carePlan.patient.userId,
        "Care plan created",
        `A new care plan '${carePlan.title}' is available.`
      );
      await writeAudit(
        req.authUser!.id,
        "CARE_PLAN_CREATED",
        "CarePlan",
        carePlan.id
      );

      res.status(201).json({ success: true, carePlan });
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  "/:id",
  requireRole(UserRole.CLINICIAN),
  async (req, res, next) => {
    try {
      const existing = await prisma.carePlan.findUnique({
        where: { id: req.params.id },
      });

      if (
        !existing ||
        !(await canAccessPatient(
          req.authUser!.id,
          req.authUser!.role,
          existing.patientId
        ))
      ) {
        return res.status(403).json({
          success: false,
          message: "You cannot update this care plan.",
        });
      }

      const data = z
        .object({
          title: z.string().min(2).optional(),
          clinicalGoal: z.string().max(2000).nullable().optional(),
          patientGoal: z.string().max(2000).nullable().optional(),
          recommendation: z.string().max(3000).nullable().optional(),
          clinicianNotes: z.string().max(5000).nullable().optional(),
          reviewDate: z.coerce.date().nullable().optional(),
          status: z.nativeEnum(CarePlanStatus).optional(),
        })
        .parse(req.body);

      const plan = await prisma.carePlan.update({
        where: { id: existing.id },
        data,
        include: { patient: { include: { user: true } } },
      });

      await createNotification(
        plan.patient.userId,
        "Care plan updated",
        `Your care plan '${plan.title}' has been updated.`
      );
      await writeAudit(
        req.authUser!.id,
        "CARE_PLAN_UPDATED",
        "CarePlan",
        plan.id
      );

      res.json({ success: true, carePlan: plan });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/:id/goals",
  requireRole(UserRole.CLINICIAN),
  async (req, res, next) => {
    try {
      const carePlan = await prisma.carePlan.findUnique({
        where: { id: req.params.id },
      });

      if (
        !carePlan ||
        !(await canAccessPatient(
          req.authUser!.id,
          req.authUser!.role,
          carePlan.patientId
        ))
      ) {
        return res.status(403).json({
          success: false,
          message: "You cannot add goals to this care plan.",
        });
      }

      const data = z
        .object({
          title: z.string().min(2),
          description: z.string().max(2000).optional(),
          startDate: z.coerce.date().optional(),
          reviewDate: z.coerce.date().optional(),
        })
        .parse(req.body);

      const goal = await prisma.carePlanGoal.create({
        data: {
          ...data,
          patientId: carePlan.patientId,
          carePlanId: carePlan.id,
        },
      });

      const patient = await prisma.patientProfile.findUnique({
        where: { id: carePlan.patientId },
      });

      if (patient) {
        await createNotification(
          patient.userId,
          "New care-plan goal",
          `A new goal '${goal.title}' has been added.`
        );
      }

      await writeAudit(
        req.authUser!.id,
        "CARE_PLAN_GOAL_CREATED",
        "CarePlanGoal",
        goal.id
      );

      res.status(201).json({ success: true, goal });
    } catch (error) {
      next(error);
    }
  }
);

router.patch("/goals/:goalId", async (req, res, next) => {
  try {
    if (req.authUser!.role === UserRole.ADMIN) {
      return res.status(403).json({
        success: false,
        message: "Administrator accounts cannot update patient goals.",
      });
    }

    const goal = await prisma.carePlanGoal.findUnique({
      where: { id: req.params.goalId },
    });

    if (
      !goal ||
      !(await canAccessPatient(
        req.authUser!.id,
        req.authUser!.role,
        goal.patientId
      ))
    ) {
      return res.status(403).json({
        success: false,
        message: "You cannot update this goal.",
      });
    }

    const data = z
      .object({
        progress: z.number().int().min(0).max(100),
        status: z.nativeEnum(GoalStatus),
      })
      .parse(req.body);

    const updated = await prisma.carePlanGoal.update({
      where: { id: req.params.goalId },
      data,
    });

    res.json({ success: true, goal: updated });
  } catch (error) {
    next(error);
  }
});

export default router;
