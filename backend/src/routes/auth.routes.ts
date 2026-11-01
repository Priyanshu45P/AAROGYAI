import { Router } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import { UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { createToken } from "../utils/jwt";
import { authenticateUser } from "../middleware/auth.middleware";

const router = Router();

router.post("/register", async (req, res, next) => {
  try {
    const input = z.object({
      firstName: z.string().min(2).max(50),
      lastName: z.string().min(2).max(50),
      email: z.string().email(),
      password: z.string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/)
    }).parse(req.body);

    const email = input.email.toLowerCase();
    if (await prisma.user.findUnique({ where: { email } })) {
      return res.status(409).json({ success: false, message: "Email is already registered." });
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    // Public registration always creates a patient account.
    const user = await prisma.user.create({
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        email,
        passwordHash,
        role: UserRole.PATIENT,
        patientProfile: { create: {} }
      },
      include: { patientProfile: true }
    });

    res.status(201).json({
      success: true,
      token: createToken({ id: user.id, role: user.role }),
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        patientProfileId: user.patientProfile?.id ?? null
      }
    });
  } catch (error) { next(error); }
});

router.post("/login", async (req, res, next) => {
  try {
    const input = z.object({ email: z.string().email(), password: z.string().min(1) }).parse(req.body);
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
      include: { patientProfile: true, clinicianProfile: true }
    });

    if (!user || user.status !== "ACTIVE" || !(await bcrypt.compare(input.password, user.passwordHash))) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    res.json({
      success: true,
      token: createToken({ id: user.id, role: user.role }),
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        patientProfileId: user.patientProfile?.id ?? null,
        clinicianProfileId: user.clinicianProfile?.id ?? null
      }
    });
  } catch (error) { next(error); }
});

router.get("/me", authenticateUser, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.authUser!.id },
      include: { patientProfile: true, clinicianProfile: true }
    });
    res.json({ success: true, user });
  } catch (error) { next(error); }
});

export default router;
