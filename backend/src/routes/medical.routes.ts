import { Router } from "express";
import { z } from "zod";
import { UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma";
import {
  authenticateUser,
  requireRole,
} from "../middleware/auth.middleware";
import { canAccessPatient } from "../services/access.service";
import { writeAudit } from "../utils/audit";

const router = Router();
router.use(authenticateUser);

async function ensureClinicianPatientAccess(userId: string, patientId: string) {
  return canAccessPatient(userId, UserRole.CLINICIAN, patientId);
}

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
        message: "You cannot view this medical history.",
      });
    }

    const patientId = req.params.patientId;
    const [records, conditions, medications, allergies, familyHistories] =
      await Promise.all([
        prisma.medicalRecord.findMany({
          where: { patientId },
          orderBy: { recordedAt: "desc" },
        }),
        prisma.condition.findMany({
          where: { patientId },
          orderBy: { createdAt: "desc" },
        }),
        prisma.medication.findMany({
          where: { patientId },
          orderBy: { createdAt: "desc" },
        }),
        prisma.allergy.findMany({
          where: { patientId },
          orderBy: { createdAt: "desc" },
        }),
        prisma.familyHistory.findMany({
          where: { patientId },
          orderBy: { createdAt: "desc" },
        }),
      ]);

    res.json({
      success: true,
      records,
      conditions,
      medications,
      allergies,
      familyHistories,
    });
  } catch (error) {
    next(error);
  }
});

router.post(
  "/records",
  requireRole(UserRole.CLINICIAN),
  async (req, res, next) => {
    try {
      const data = z
        .object({
          patientId: z.string(),
          title: z.string().min(2),
          description: z.string().max(2000).optional(),
          recordedAt: z.coerce.date().optional(),
        })
        .parse(req.body);

      if (!(await ensureClinicianPatientAccess(req.authUser!.id, data.patientId))) {
        return res.status(403).json({
          success: false,
          message: "You are not assigned to this patient.",
        });
      }

      const record = await prisma.medicalRecord.create({ data });
      await writeAudit(
        req.authUser!.id,
        "MEDICAL_RECORD_CREATED",
        "MedicalRecord",
        record.id
      );
      res.status(201).json({ success: true, record });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/conditions",
  requireRole(UserRole.CLINICIAN),
  async (req, res, next) => {
    try {
      const data = z
        .object({
          patientId: z.string(),
          name: z.string().min(2),
          description: z.string().max(2000).optional(),
          diagnosedAt: z.coerce.date().optional(),
        })
        .parse(req.body);

      if (!(await ensureClinicianPatientAccess(req.authUser!.id, data.patientId))) {
        return res.status(403).json({
          success: false,
          message: "You are not assigned to this patient.",
        });
      }

      const condition = await prisma.condition.create({ data });
      await writeAudit(
        req.authUser!.id,
        "CONDITION_CREATED",
        "Condition",
        condition.id
      );
      res.status(201).json({ success: true, condition });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/medications",
  requireRole(UserRole.CLINICIAN),
  async (req, res, next) => {
    try {
      const data = z
        .object({
          patientId: z.string(),
          name: z.string().min(2),
          dosage: z.string().max(200).optional(),
          frequency: z.string().max(200).optional(),
          startDate: z.coerce.date().optional(),
          endDate: z.coerce.date().optional(),
        })
        .parse(req.body);

      if (!(await ensureClinicianPatientAccess(req.authUser!.id, data.patientId))) {
        return res.status(403).json({
          success: false,
          message: "You are not assigned to this patient.",
        });
      }

      const medication = await prisma.medication.create({ data });
      await writeAudit(
        req.authUser!.id,
        "MEDICATION_CREATED",
        "Medication",
        medication.id
      );
      res.status(201).json({ success: true, medication });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/allergies",
  requireRole(UserRole.CLINICIAN),
  async (req, res, next) => {
    try {
      const data = z
        .object({
          patientId: z.string(),
          allergen: z.string().min(2),
          reaction: z.string().max(1000).optional(),
          severity: z.string().max(100).optional(),
        })
        .parse(req.body);

      if (!(await ensureClinicianPatientAccess(req.authUser!.id, data.patientId))) {
        return res.status(403).json({
          success: false,
          message: "You are not assigned to this patient.",
        });
      }

      const allergy = await prisma.allergy.create({ data });
      await writeAudit(
        req.authUser!.id,
        "ALLERGY_CREATED",
        "Allergy",
        allergy.id
      );
      res.status(201).json({ success: true, allergy });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/family-history",
  requireRole(UserRole.CLINICIAN),
  async (req, res, next) => {
    try {
      const data = z
        .object({
          patientId: z.string(),
          relationship: z.string().min(2).max(100),
          condition: z.string().min(2).max(200),
          notes: z.string().max(1000).optional(),
        })
        .parse(req.body);

      if (!(await ensureClinicianPatientAccess(req.authUser!.id, data.patientId))) {
        return res.status(403).json({
          success: false,
          message: "You are not assigned to this patient.",
        });
      }

      const familyHistory = await prisma.familyHistory.create({ data });
      await writeAudit(
        req.authUser!.id,
        "FAMILY_HISTORY_CREATED",
        "FamilyHistory",
        familyHistory.id
      );
      res.status(201).json({ success: true, familyHistory });
    } catch (error) {
      next(error);
    }
  }
);

// These update routes allow the clinician to maintain a usable longitudinal record.
router.patch(
  "/conditions/:id",
  requireRole(UserRole.CLINICIAN),
  async (req, res, next) => {
    try {
      const current = await prisma.condition.findUnique({
        where: { id: req.params.id },
      });
      if (
        !current ||
        !(await ensureClinicianPatientAccess(req.authUser!.id, current.patientId))
      ) {
        return res.status(403).json({
          success: false,
          message: "You cannot update this condition.",
        });
      }

      const data = z
        .object({
          name: z.string().min(2).optional(),
          description: z.string().max(2000).optional(),
          active: z.boolean().optional(),
        })
        .parse(req.body);

      const condition = await prisma.condition.update({
        where: { id: current.id },
        data,
      });
      res.json({ success: true, condition });
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  "/medications/:id",
  requireRole(UserRole.CLINICIAN),
  async (req, res, next) => {
    try {
      const current = await prisma.medication.findUnique({
        where: { id: req.params.id },
      });
      if (
        !current ||
        !(await ensureClinicianPatientAccess(req.authUser!.id, current.patientId))
      ) {
        return res.status(403).json({
          success: false,
          message: "You cannot update this medication.",
        });
      }

      const data = z
        .object({
          dosage: z.string().max(200).optional(),
          frequency: z.string().max(200).optional(),
          active: z.boolean().optional(),
          endDate: z.coerce.date().nullable().optional(),
        })
        .parse(req.body);

      const medication = await prisma.medication.update({
        where: { id: current.id },
        data,
      });
      res.json({ success: true, medication });
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  "/allergies/:id",
  requireRole(UserRole.CLINICIAN),
  async (req, res, next) => {
    try {
      const current = await prisma.allergy.findUnique({
        where: { id: req.params.id },
      });
      if (
        !current ||
        !(await ensureClinicianPatientAccess(req.authUser!.id, current.patientId))
      ) {
        return res.status(403).json({
          success: false,
          message: "You cannot update this allergy.",
        });
      }

      const data = z
        .object({
          reaction: z.string().max(1000).optional(),
          severity: z.string().max(100).optional(),
        })
        .parse(req.body);

      const allergy = await prisma.allergy.update({
        where: { id: current.id },
        data,
      });
      res.json({ success: true, allergy });
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  "/family-history/:id",
  requireRole(UserRole.CLINICIAN),
  async (req, res, next) => {
    try {
      const current = await prisma.familyHistory.findUnique({
        where: { id: req.params.id },
      });
      if (
        !current ||
        !(await ensureClinicianPatientAccess(req.authUser!.id, current.patientId))
      ) {
        return res.status(403).json({
          success: false,
          message: "You cannot update this family history.",
        });
      }

      const data = z
        .object({
          relationship: z.string().min(2).max(100).optional(),
          condition: z.string().min(2).max(200).optional(),
          notes: z.string().max(1000).optional(),
        })
        .parse(req.body);

      const familyHistory = await prisma.familyHistory.update({
        where: { id: current.id },
        data,
      });
      res.json({ success: true, familyHistory });
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  "/records/:id",
  requireRole(UserRole.CLINICIAN),
  async (req, res, next) => {
    try {
      const current = await prisma.medicalRecord.findUnique({
        where: { id: req.params.id },
      });
      if (
        !current ||
        !(await ensureClinicianPatientAccess(req.authUser!.id, current.patientId))
      ) {
        return res.status(403).json({
          success: false,
          message: "You cannot update this record.",
        });
      }

      const data = z
        .object({
          title: z.string().min(2).optional(),
          description: z.string().max(2000).optional(),
          recordedAt: z.coerce.date().optional(),
        })
        .parse(req.body);

      const record = await prisma.medicalRecord.update({
        where: { id: current.id },
        data,
      });
      res.json({ success: true, record });
    } catch (error) {
      next(error);
    }
  }
);


router.delete(
  "/records/:id",
  requireRole(UserRole.CLINICIAN),
  async (req, res, next) => {
    try {
      const current = await prisma.medicalRecord.findUnique({
        where: { id: req.params.id },
      });

      if (
        !current ||
        !(await ensureClinicianPatientAccess(req.authUser!.id, current.patientId))
      ) {
        return res.status(403).json({
          success: false,
          message: "You cannot delete this record.",
        });
      }

      await prisma.medicalRecord.delete({ where: { id: current.id } });
      await writeAudit(
        req.authUser!.id,
        "MEDICAL_RECORD_DELETED",
        "MedicalRecord",
        current.id
      );
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  "/allergies/:id",
  requireRole(UserRole.CLINICIAN),
  async (req, res, next) => {
    try {
      const current = await prisma.allergy.findUnique({
        where: { id: req.params.id },
      });

      if (
        !current ||
        !(await ensureClinicianPatientAccess(req.authUser!.id, current.patientId))
      ) {
        return res.status(403).json({
          success: false,
          message: "You cannot delete this allergy.",
        });
      }

      await prisma.allergy.delete({ where: { id: current.id } });
      await writeAudit(
        req.authUser!.id,
        "ALLERGY_DELETED",
        "Allergy",
        current.id
      );
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  "/family-history/:id",
  requireRole(UserRole.CLINICIAN),
  async (req, res, next) => {
    try {
      const current = await prisma.familyHistory.findUnique({
        where: { id: req.params.id },
      });

      if (
        !current ||
        !(await ensureClinicianPatientAccess(req.authUser!.id, current.patientId))
      ) {
        return res.status(403).json({
          success: false,
          message: "You cannot delete this family-history entry.",
        });
      }

      await prisma.familyHistory.delete({ where: { id: current.id } });
      await writeAudit(
        req.authUser!.id,
        "FAMILY_HISTORY_DELETED",
        "FamilyHistory",
        current.id
      );
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export default router;
