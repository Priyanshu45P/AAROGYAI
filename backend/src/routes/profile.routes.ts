import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticateUser } from "../middleware/auth.middleware";

const router = Router();
router.use(authenticateUser);

router.patch("/patient", async (req, res, next) => {
  try {
    const input = z.object({
      dateOfBirth: z.coerce.date().optional(),
      sex: z.string().max(30).optional(),
      phone: z.string().max(40).optional(),
      address: z.string().max(250).optional(),
      heightCm: z.number().positive().max(300).optional()
    }).parse(req.body);

    const profile = await prisma.patientProfile.findUnique({ where: { userId: req.authUser!.id } });
    if (!profile) return res.status(404).json({ success: false, message: "Patient profile not found." });
    const patient = await prisma.patientProfile.update({ where: { id: profile.id }, data: input });
    res.json({ success: true, patient });
  } catch (error) { next(error); }
});

router.patch("/account", async (req, res, next) => {
  try {
    const input = z.object({ firstName: z.string().min(2).max(50), lastName: z.string().min(2).max(50) }).parse(req.body);
    const user = await prisma.user.update({ where: { id: req.authUser!.id }, data: input, select: { id: true, firstName: true, lastName: true, email: true, role: true } });
    res.json({ success: true, user });
  } catch (error) { next(error); }
});

export default router;
