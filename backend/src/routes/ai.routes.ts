import { Router } from "express";
import axios from "axios";
import { prisma } from "../lib/prisma";
import { authenticateUser } from "../middleware/auth.middleware";
import { env } from "../config/env";
import { canAccessPatient } from "../utils/access";
import { writeAudit } from "../utils/audit";
import { predictionReadiness } from "../utils/aiReadiness";

const router = Router();
router.use(authenticateUser);

router.get("/readiness/:patientId", async (req, res, next) => {
  try {
    const patientId = req.params.patientId;
    if (!(await canAccessPatient(req.authUser!.id, req.authUser!.role, patientId))) {
      return res.status(403).json({ success: false, message: "You cannot view prediction readiness for this patient." });
    }
    const patient = await prisma.patientProfile.findUnique({
      where: { id: patientId },
      include: { clinicalReadings: { orderBy: { recordedAt: "desc" }, take: 1 } }
    });
    if (!patient) return res.status(404).json({ success: false, message: "Patient not found." });
    const reading = patient.clinicalReadings[0];
    const readiness = predictionReadiness(patient.dateOfBirth, reading);
    res.json({ success: true, ...readiness });
  } catch (error) { next(error); }
});

router.post("/predict/:patientId", async (req, res, next) => {
  try {
    const patientId = req.params.patientId;
    if (!(await canAccessPatient(req.authUser!.id, req.authUser!.role, patientId))) return res.status(403).json({ success: false, message: "You cannot run a prediction for this patient." });

    const patient = await prisma.patientProfile.findUnique({ where: { id: patientId }, include: { clinicalReadings: { orderBy: { recordedAt: "desc" }, take: 1 } } });
    if (!patient) return res.status(404).json({ success: false, message: "Patient not found." });
    const reading = patient.clinicalReadings[0];

    const readiness = predictionReadiness(patient.dateOfBirth, reading);
    if (!readiness.ready) return res.status(400).json({ success: false, message: `Risk prediction cannot be generated. Missing: ${readiness.missing.join(", ")}.` });

    const age = Math.floor((Date.now() - patient.dateOfBirth!.getTime()) / 31557600000);
    if (age < 18 || age > 120) {
      return res.status(400).json({ success: false, message: "Risk prediction requires a valid adult date of birth." });
    }
    const input = { age, bmi: reading!.bmi!, glucose: reading!.glucose!, hba1c: reading!.hba1c!, systolic_bp: reading!.systolicBP!, diastolic_bp: reading!.diastolicBP! };
    const response = await axios.post(`${env.AI_SERVICE_URL}/predict`, input, { timeout: 10000 });
    const result = response.data;

    const prediction = await prisma.riskPrediction.create({
      data: {
        patientId,
        riskType: "CHRONIC_DISEASE_RISK",
        riskLevel: result.risk_level,
        probability: result.probability,
        modelName: result.model_name,
        modelVersion: result.model_version,
        inputSnapshot: input,
        featureContributions: { create: (result.feature_contributions ?? []).map((f: any, index: number) => ({ featureName: f.feature, featureValue: String(f.value), shapValue: f.shap_value, importanceRank: index + 1 })) }
      },
      include: { featureContributions: true }
    });
    await writeAudit(req.authUser!.id, "RISK_PREDICTION_GENERATED", "RiskPrediction", prediction.id);
    res.status(201).json({ success: true, prediction, explanation: result.explanation });
  } catch (error) { next(error); }
});

router.get("/patient/:patientId", async (req, res, next) => {
  try {
    if (!(await canAccessPatient(req.authUser!.id, req.authUser!.role, req.params.patientId))) return res.status(403).json({ success: false, message: "You cannot view these predictions." });
    const predictions = await prisma.riskPrediction.findMany({ where: { patientId: req.params.patientId }, include: { featureContributions: true }, orderBy: { createdAt: "desc" } });
    res.json({ success: true, predictions });
  } catch (error) { next(error); }
});

export default router;
