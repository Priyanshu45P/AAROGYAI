import { Router } from "express";
import { z } from "zod";
import { UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { authenticateUser, requireRole } from "../middleware/auth.middleware";
import { canAccessPatient } from "../utils/access";

const router = Router();
router.use(authenticateUser);

router.get("/patient/:patientId", async (req, res, next) => {
  try {
    if (!(await canAccessPatient(req.authUser!.id, req.authUser!.role, req.params.patientId))) return res.status(403).json({ success: false, message: "You cannot view these notes." });
    const notes = await prisma.clinicalNote.findMany({ where: { patientId: req.params.patientId }, include: { clinician: { include: { user: true } } }, orderBy: { createdAt: "desc" } });
    res.json({ success: true, notes });
  } catch (error) { next(error); }
});

router.post("/", requireRole(UserRole.CLINICIAN), async (req, res, next) => {
  try {
    const clinician = await prisma.clinicianProfile.findUnique({ where: { userId: req.authUser!.id } });
    if (!clinician) return res.status(400).json({ success: false, message: "Clinician profile not found." });
    const input = z.object({ patientId: z.string(), note: z.string().min(2).max(5000) }).parse(req.body);

    if (!(await canAccessPatient(req.authUser!.id, req.authUser!.role, input.patientId))) {
      return res.status(403).json({
        success: false,
        message: "You are not assigned to this patient.",
      });
    }

    const note = await prisma.clinicalNote.create({ data: { ...input, clinicianId: clinician.id } });
    res.status(201).json({ success: true, note });
  } catch (error) { next(error); }
});

export default router;
