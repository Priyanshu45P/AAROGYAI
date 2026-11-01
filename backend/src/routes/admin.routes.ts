import { Router } from "express";
import { UserRole } from "@prisma/client";
import {
  authenticateUser,
  requireRole,
} from "../middleware/auth.middleware";
import {
  deleteAssignment,
  getAssignments,
  getAudit,
  getStats,
  getUsers,
  patchRole,
  patchStatus,
  postAssignment,
  postClinician,
} from "../controllers/admin.controller";

const router = Router();
router.use(authenticateUser, requireRole(UserRole.ADMIN));

router.get("/stats", getStats);
router.get("/users", getUsers);
router.post("/clinicians", postClinician);
router.patch("/users/:id/status", patchStatus);
router.patch("/users/:id/role", patchRole);

router.get("/assignments", getAssignments);
router.post("/assignments", postAssignment);
router.delete("/assignments/:id", deleteAssignment);

router.get("/audit", getAudit);

export default router;
