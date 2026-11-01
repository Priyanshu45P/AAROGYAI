import { Router } from "express";
import { UserRole } from "@prisma/client";
import {
  authenticateUser,
  requireRole,
} from "../middleware/auth.middleware";
import {
  getPatient,
  listPatients,
} from "../controllers/patient.controller";

const router = Router();
router.use(authenticateUser);

// Only clinicians and admins can browse a patient list.
router.get(
  "/",
  requireRole(UserRole.CLINICIAN, UserRole.ADMIN),
  listPatients
);

// Access to one patient is checked inside the service.
router.get("/:id", getPatient);

export default router;
