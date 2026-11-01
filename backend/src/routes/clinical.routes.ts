import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticateUser } from "../middleware/auth.middleware";
import { canAccessPatient } from "../utils/access";
import { writeAudit } from "../utils/audit";

const router = Router();
router.use(authenticateUser);

const schema = z.object({
  patientId: z.string().min(1),
  glucose: z.number().positive().max(1000).optional(),
  systolicBP: z.number().positive().max(300).optional(),
  diastolicBP: z.number().positive().max(200).optional(),
  hba1c: z.number().positive().max(30).optional(),
  weightKg: z.number().positive().max(500).optional(),
  heightCm: z.number().positive().max(300).optional(),
  bmi: z.number().positive().max(100).optional(),
  notes: z.string().max(500).optional(),
  recordedAt: z.coerce.date().optional()
});

router.post("/", async (req, res, next) => {
  try {
    if (req.authUser!.role === "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Administrator accounts cannot create clinical readings.",
      });
    }

    const input = schema.parse(req.body);
    if (!(await canAccessPatient(req.authUser!.id, req.authUser!.role, input.patientId))) {
      return res.status(403).json({ success: false, message: "You cannot add readings for this patient." });
    }

    const reading = await prisma.clinicalReading.create({ data: input });
    await writeAudit(req.authUser!.id, "CLINICAL_READING_CREATED", "ClinicalReading", reading.id);
    res.status(201).json({ success: true, reading });
  } catch (error) { next(error); }
});

router.get("/patient/:patientId", async (req, res, next) => {
  try {
    if (!(await canAccessPatient(req.authUser!.id, req.authUser!.role, req.params.patientId))) {
      return res.status(403).json({ success: false, message: "You cannot view these readings." });
    }
    const readings = await prisma.clinicalReading.findMany({
      where: { patientId: req.params.patientId },
      orderBy: { recordedAt: "desc" }
    });
    res.json({ success: true, readings });
  } catch (error) { next(error); }
});

export default router;
