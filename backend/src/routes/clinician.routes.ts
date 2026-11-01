import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authenticateUser } from "../middleware/auth.middleware";

const router = Router();
router.use(authenticateUser);

router.get("/", async (_req, res, next) => {
  try {
    const clinicians = await prisma.clinicianProfile.findMany({
      where: { user: { status: "ACTIVE" } },
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
      orderBy: { user: { firstName: "asc" } }
    });
    res.json({ success: true, clinicians });
  } catch (error) { next(error); }
});

export default router;
