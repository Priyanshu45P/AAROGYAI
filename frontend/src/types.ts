export type Role = "ADMIN" | "CLINICIAN" | "PATIENT";

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  patientProfileId?: string | null;
  clinicianProfileId?: string | null;
}

export interface ClinicalReading {
  id: string;
  glucose?: number;
  systolicBP?: number;
  diastolicBP?: number;
  hba1c?: number;
  bmi?: number;
  weightKg?: number;
  recordedAt: string;
}
