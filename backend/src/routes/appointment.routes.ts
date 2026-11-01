import { Router } from "express";
import { z } from "zod";
import { AppointmentStatus, UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { authenticateUser } from "../middleware/auth.middleware";
import { createNotification } from "../utils/notifications";
import { createOrReactivateAssignment } from "../services/access.service";
import { clinicianOwnsAppointment } from "../utils/appointmentPermissions";

const router = Router();
router.use(authenticateUser);

router.get("/", async (req, res, next) => {
  try {
    if (req.authUser!.role === UserRole.PATIENT) {
      const p = await prisma.patientProfile.findUnique({ where: { userId: req.authUser!.id } });
      const appointments = p ? await prisma.appointment.findMany({ where: { patientId: p.id }, include: { clinician: { include: { user: true } } }, orderBy: { appointmentDate: "desc" } }) : [];
      return res.json({ success: true, appointments });
    }
    if (req.authUser!.role === UserRole.CLINICIAN) {
      const c = await prisma.clinicianProfile.findUnique({ where: { userId: req.authUser!.id } });
      const appointments = c ? await prisma.appointment.findMany({ where: { clinicianId: c.id }, include: { patient: { include: { user: true } } }, orderBy: { appointmentDate: "desc" } }) : [];
      return res.json({ success: true, appointments });
    }
    const appointments = await prisma.appointment.findMany({ include: { patient: { include: { user: true } }, clinician: { include: { user: true } } }, orderBy: { appointmentDate: "desc" } });
    res.json({ success: true, appointments });
  } catch (error) { next(error); }
});

router.post("/", async (req, res, next) => {
  try {
    const data = z.object({ patientId: z.string(), clinicianId: z.string(), appointmentDate: z.coerce.date(), reason: z.string().min(2), notes: z.string().max(1000).optional() }).parse(req.body);
    if (data.appointmentDate.getTime() < Date.now()) return res.status(400).json({ success: false, message: "Please choose a future appointment time." });

    if (req.authUser!.role === UserRole.PATIENT) {
      const p = await prisma.patientProfile.findUnique({ where: { userId: req.authUser!.id } });
      if (!p || p.id !== data.patientId) return res.status(403).json({ success: false, message: "You can only request your own appointment." });
    }

    const appointment = await prisma.appointment.create({ data, include: { clinician: { include: { user: true } }, patient: { include: { user: true } } } });
    await createNotification(appointment.clinician.userId, "New appointment request", `${appointment.patient.user.firstName} requested an appointment.`);
    res.status(201).json({ success: true, appointment });
  } catch (error) { next(error); }
});

router.patch("/:id/status", async (req, res, next) => {
  try {
    if (req.authUser!.role === UserRole.PATIENT) {
      return res.status(403).json({
        success: false,
        message: "Only staff can change appointment status.",
      });
    }

    const { status } = z
      .object({ status: z.nativeEnum(AppointmentStatus) })
      .parse(req.body);

    const existing = await prisma.appointment.findUnique({
      where: { id: req.params.id },
      include: {
        patient: { include: { user: true } },
        clinician: true,
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found.",
      });
    }

    if (req.authUser!.role === UserRole.CLINICIAN) {
      const clinician = await prisma.clinicianProfile.findUnique({
        where: { userId: req.authUser!.id },
      });

      // A clinician can only manage appointments assigned to them.
      if (!clinicianOwnsAppointment(clinician?.id, existing.clinicianId)) {
        return res.status(403).json({
          success: false,
          message: "You cannot update this appointment.",
        });
      }
    }

    const appointment = await prisma.appointment.update({
      where: { id: existing.id },
      data: { status },
      include: { patient: { include: { user: true } } },
    });

    if (status === AppointmentStatus.CONFIRMED) {
      // A confirmed appointment establishes an active care relationship.
      await createOrReactivateAssignment(
        existing.clinicianId,
        existing.patientId
      );
    }

    await createNotification(
      appointment.patient.userId,
      "Appointment updated",
      `Your appointment status is now ${status}.`
    );

    res.json({ success: true, appointment });
  } catch (error) {
    next(error);
  }
});

export default router;
