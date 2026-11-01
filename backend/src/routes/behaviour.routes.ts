import { Router } from "express";
import { authenticateUser } from "../middleware/auth.middleware";
import {
  createAssessment,
  listQuestions,
  patientBehaviour,
  reviewRecommendation,
} from "../controllers/behaviour.controller";

const router = Router();
router.use(authenticateUser);

router.get("/questions", listQuestions);
router.post("/assessments", createAssessment);
router.get("/patient/:patientId", patientBehaviour);
router.patch("/recommendations/:id", reviewRecommendation);

export default router;
