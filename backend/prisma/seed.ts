import bcrypt from "bcrypt";
import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("Admin123!", 12);
  const doctorPassword = await bcrypt.hash("Doctor123!", 12);
  const patientPassword = await bcrypt.hash("Patient123!", 12);

  await prisma.user.upsert({
    where: { email: "admin@aarogyai.test" },
    update: {},
    create: {
      firstName: "Aarav",
      lastName: "Admin",
      email: "admin@aarogyai.test",
      passwordHash: adminPassword,
      role: UserRole.ADMIN
    }
  });

  const doctor = await prisma.user.upsert({
    where: { email: "doctor@aarogyai.test" },
    update: {},
    create: {
      firstName: "Ananya",
      lastName: "Sharma",
      email: "doctor@aarogyai.test",
      passwordHash: doctorPassword,
      role: UserRole.CLINICIAN,
      clinicianProfile: {
        create: { registrationNumber: "DEV-CLIN-001", speciality: "General Medicine" }
      }
    },
    include: { clinicianProfile: true }
  });

  const patient = await prisma.user.upsert({
    where: { email: "patient@aarogyai.test" },
    update: {},
    create: {
      firstName: "Rohan",
      lastName: "Patil",
      email: "patient@aarogyai.test",
      passwordHash: patientPassword,
      role: UserRole.PATIENT,
      patientProfile: { create: { sex: "Male", heightCm: 172 } }
    },
    include: { patientProfile: true }
  });

  const questions = [
    ["I understand how diabetes affects my health.", "CAPABILITY", "PSYCHOLOGICAL"],
    ["I know how to check my blood glucose correctly.", "CAPABILITY", "PSYCHOLOGICAL"],
    ["I can physically carry out my self-monitoring tasks.", "CAPABILITY", "PHYSICAL"],
    ["I can access the medicines and supplies I need.", "OPPORTUNITY", "PHYSICAL"],
    ["I can access healthy food and healthcare support.", "OPPORTUNITY", "PHYSICAL"],
    ["I have support from family, friends or healthcare staff.", "OPPORTUNITY", "SOCIAL"],
    ["I feel confident about managing my diabetes.", "MOTIVATION", "REFLECTIVE"],
    ["I want to keep improving my health habits.", "MOTIVATION", "REFLECTIVE"],
    ["I have a regular routine for medication and self-care.", "MOTIVATION", "AUTOMATIC"]
  ] as const;

  for (const [text, dimension, subDimension] of questions) {
    const found = await prisma.behaviourQuestion.findFirst({ where: { text } });
    if (!found) {
      await prisma.behaviourQuestion.create({ data: { text, dimension, subDimension } });
    }
  }

  if (patient.patientProfile) {

    if (doctor.clinicianProfile) {
      await prisma.clinicianPatientAssignment.upsert({
        where: {
          clinicianId_patientId: {
            clinicianId: doctor.clinicianProfile.id,
            patientId: patient.patientProfile.id
          }
        },
        update: { active: true, endedAt: null },
        create: {
          clinicianId: doctor.clinicianProfile.id,
          patientId: patient.patientProfile.id,
          active: true
        }
      });
    }

    const diabetes = await prisma.condition.findFirst({
      where: { patientId: patient.patientProfile.id, name: "Type 2 Diabetes" }
    });
    if (!diabetes) {
      await prisma.condition.create({
        data: {
          patientId: patient.patientProfile.id,
          name: "Type 2 Diabetes",
          description: "Synthetic demonstration condition.",
          active: true
        }
      });
    }

    const hypertension = await prisma.condition.findFirst({
      where: { patientId: patient.patientProfile.id, name: "Hypertension" }
    });
    if (!hypertension) {
      await prisma.condition.create({
        data: {
          patientId: patient.patientProfile.id,
          name: "Hypertension",
          description: "Synthetic demonstration condition.",
          active: true
        }
      });
    }

    const familyHistory = await prisma.familyHistory.findFirst({
      where: {
        patientId: patient.patientProfile.id,
        relationship: "Parent",
        condition: "Type 2 Diabetes"
      }
    });
    if (!familyHistory) {
      await prisma.familyHistory.create({
        data: {
          patientId: patient.patientProfile.id,
          relationship: "Parent",
          condition: "Type 2 Diabetes",
          notes: "Synthetic demonstration family history."
        }
      });
    }

    const count = await prisma.clinicalReading.count({ where: { patientId: patient.patientProfile.id } });
    if (count === 0) {
      await prisma.clinicalReading.createMany({
        data: [
          { patientId: patient.patientProfile.id, glucose: 132, systolicBP: 138, diastolicBP: 88, hba1c: 6.8, weightKg: 77, heightCm: 172, bmi: 26.0 },
          { patientId: patient.patientProfile.id, glucose: 126, systolicBP: 134, diastolicBP: 84, hba1c: 6.6, weightKg: 76, heightCm: 172, bmi: 25.7, recordedAt: new Date(Date.now() - 7*86400000) }
        ]
      });
    }
  }

  console.log("AAROGYAI demo data created.");
}

main().catch(console.error).finally(async () => prisma.$disconnect());
