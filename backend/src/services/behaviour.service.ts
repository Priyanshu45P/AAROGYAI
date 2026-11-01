import { UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { calculateCombScores, supportAreas } from "../utils/comb";
import { canAccessPatient } from "./access.service";
import { createNotification } from "../utils/notifications";
import { writeAudit } from "../utils/audit";

type ResponseInput = {
  questionId: string;
  answer: number;
};

export async function submitAssessment(
  userId: string,
  role: UserRole,
  patientId: string,
  responses: ResponseInput[]
) {
  if (!(await canAccessPatient(userId, role, patientId))) {
    throw Object.assign(new Error("You cannot submit this assessment."), {
      statusCode: 403,
    });
  }

  const uniqueIds = new Set(responses.map((response) => response.questionId));
  if (uniqueIds.size !== responses.length) {
    throw Object.assign(new Error("Each COM-B question can only be answered once."), {
      statusCode: 400,
    });
  }

  const questions = await prisma.behaviourQuestion.findMany({
    where: {
      id: { in: [...uniqueIds] },
      active: true,
    },
  });

  if (questions.length !== responses.length) {
    throw Object.assign(
      new Error("One or more COM-B questions are invalid or inactive."),
      { statusCode: 400 }
    );
  }

  const questionById = new Map(
    questions.map((question) => [question.id, question])
  );

  const scoredAnswers = responses.map((response) => ({
    answer: response.answer,
    dimension: questionById.get(response.questionId)!.dimension,
  }));

  const scores = calculateCombScores(scoredAnswers);
  const areas = supportAreas(scores);

  const suggestions: {
    category: string;
    title: string;
    message: string;
  }[] = [];

  // Recommendations are deliberately supportive and do not change treatment.
  if (areas.includes("CAPABILITY")) {
    suggestions.push({
      category: "CAPABILITY",
      title: "Build confidence and knowledge",
      message:
        "Review self-management information and discuss unclear areas with your healthcare professional.",
    });
  }

  if (areas.includes("OPPORTUNITY")) {
    suggestions.push({
      category: "OPPORTUNITY",
      title: "Identify practical support",
      message:
        "Discuss access to medicines, monitoring supplies, healthy food or social support with your healthcare professional.",
    });
  }

  if (areas.includes("MOTIVATION")) {
    suggestions.push({
      category: "MOTIVATION",
      title: "Create a simple routine",
      message:
        "Consider small goals, reminders and progress tracking to support a regular self-management routine.",
    });
  }

  const assessment = await prisma.$transaction(async (tx) => {
    const created = await tx.behaviourAssessment.create({
      data: {
        patientId,
        ...scores,
        responses: { create: responses },
      },
    });

    if (suggestions.length) {
      // New suggestions stay unapproved until an authorised clinician reviews them.
      await tx.recommendation.createMany({
        data: suggestions.map((item) => ({
          ...item,
          patientId,
          approved: false,
        })),
      });
    }

    return created;
  });

  await writeAudit(
    userId,
    "BEHAVIOUR_ASSESSMENT_COMPLETED",
    "BehaviourAssessment",
    assessment.id
  );

  return {
    assessment,
    recommendationsPendingReview: suggestions.length,
  };
}

export async function getBehaviourForUser(
  userId: string,
  role: UserRole,
  patientId: string
) {
  if (!(await canAccessPatient(userId, role, patientId))) {
    throw Object.assign(
      new Error("You cannot view these behaviour assessments."),
      { statusCode: 403 }
    );
  }

  const recommendations = await prisma.recommendation.findMany({
    where: {
      patientId,
      ...(role === UserRole.PATIENT ? { approved: true } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  const assessments = await prisma.behaviourAssessment.findMany({
    where: { patientId },
    orderBy: { completedAt: "desc" },
  });

  return { assessments, recommendations };
}

export async function approveRecommendation(
  userId: string,
  role: UserRole,
  recommendationId: string,
  approved: boolean
) {
  if (role !== UserRole.CLINICIAN && role !== UserRole.ADMIN) {
    throw Object.assign(
      new Error("Only authorised staff can review recommendations."),
      { statusCode: 403 }
    );
  }

  const recommendation = await prisma.recommendation.findUnique({
    where: { id: recommendationId },
    include: {
      patient: { include: { user: true } },
    },
  });

  if (!recommendation) {
    throw Object.assign(new Error("Recommendation not found."), {
      statusCode: 404,
    });
  }

  if (
    role === UserRole.CLINICIAN &&
    !(await canAccessPatient(userId, role, recommendation.patientId))
  ) {
    throw Object.assign(
      new Error("You are not assigned to this patient."),
      { statusCode: 403 }
    );
  }

  const updated = await prisma.recommendation.update({
    where: { id: recommendationId },
    data: {
      approved,
      approvedAt: approved ? new Date() : null,
      approvedByUserId: approved ? userId : null,
    },
  });

  if (approved) {
    await createNotification(
      recommendation.patient.userId,
      "New approved behaviour support",
      recommendation.title
    );
  }

  await writeAudit(
    userId,
    approved ? "RECOMMENDATION_APPROVED" : "RECOMMENDATION_UNAPPROVED",
    "Recommendation",
    recommendationId
  );

  return updated;
}
