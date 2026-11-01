import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authenticateUser } from "../middleware/auth.middleware";

const router = Router();
router.use(authenticateUser);

router.get("/", async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({ where: { userId: req.authUser!.id }, orderBy: { createdAt: "desc" }, take: 50 });
    res.json({ success: true, notifications });
  } catch (error) { next(error); }
});

router.patch("/:id/read", async (req, res, next) => {
  try {
    const item = await prisma.notification.findFirst({ where: { id: req.params.id, userId: req.authUser!.id } });
    if (!item) return res.status(404).json({ success: false, message: "Notification not found." });
    const notification = await prisma.notification.update({ where: { id: item.id }, data: { read: true } });
    res.json({ success: true, notification });
  } catch (error) { next(error); }
});

export default router;
