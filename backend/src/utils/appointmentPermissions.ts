export function clinicianOwnsAppointment(
  currentClinicianId: string | null | undefined,
  appointmentClinicianId: string
): boolean {
  return Boolean(
    currentClinicianId && currentClinicianId === appointmentClinicianId
  );
}
