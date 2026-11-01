import { NextFunction, Request, Response } from "express";
import { UserRole } from "@prisma/client";
import {
  getPatientForUser,
  listPatientsForUser,
} from "../services/patient.service";
import { patientListQuerySchema } from "../validators/patient.validators";

export async function listPatients(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const filters = patientListQuerySchema.parse(req.query);
    const patients = await listPatientsForUser(
      req.authUser!.id,
      req.authUser!.role,
      filters
    );

    res.json({ success: true, patients });
  } catch (error) {
    next(error);
  }
}

export async function getPatient(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const patient = await getPatientForUser(
      req.authUser!.id,
      req.authUser!.role,
      req.params.id
    );

    if (!patient) {
      const status =
        req.authUser!.role === UserRole.PATIENT ? 403 : 404;
      return res.status(status).json({
        success: false,
        message: "Patient was not found or you are not authorised to view it.",
      });
    }

    res.json({ success: true, patient });
  } catch (error) {
    next(error);
  }
}
