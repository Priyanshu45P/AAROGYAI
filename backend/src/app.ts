import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import authRoutes from "./routes/auth.routes";
import patientRoutes from "./routes/patient.routes";
import clinicianRoutes from "./routes/clinician.routes";
import profileRoutes from "./routes/profile.routes";
import clinicalRoutes from "./routes/clinical.routes";
import medicalRoutes from "./routes/medical.routes";
import behaviourRoutes from "./routes/behaviour.routes";
import appointmentRoutes from "./routes/appointment.routes";
import careRoutes from "./routes/care.routes";
import noteRoutes from "./routes/note.routes";
import notificationRoutes from "./routes/notification.routes";
import adminRoutes from "./routes/admin.routes";
import aiRoutes from "./routes/ai.routes";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import { prisma } from "./lib/prisma";

const app = express();
app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 500, standardHeaders: true, legacyHeaders: false }));
app.use(express.json({ limit: "1mb" }));
if (env.NODE_ENV === "development") app.use(morgan("dev"));

app.get("/", (_req, res) => res.json({ success: true, name: "AAROGYAI API" }));
app.get("/api/health", async (_req, res, next) => { try { await prisma.$queryRaw`SELECT 1`; res.json({ success: true, database: "connected" }); } catch (e) { next(e); } });

app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/clinicians", clinicianRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/clinical-readings", clinicalRoutes);
app.use("/api/medical", medicalRoutes);
app.use("/api/behaviour", behaviourRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/care-plans", careRoutes);
app.use("/api/clinical-notes", noteRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/ai", aiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
export default app;
