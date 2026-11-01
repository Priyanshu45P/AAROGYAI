import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import {
  approveRecommendation,
  getBehaviourForUser,
  submitAssessment,
} from "../services/behaviour.service";

const assessmentSchema = z.object({
  patientId: z.string().min(1),
  responses: z
    .array(
      z.object({
        questionId: z.string().min(1),
        answer: z.number().int().min(1).max(5),
      })
    )
    .min(1),
});

export async function listQuestions(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const questions = await prisma.behaviourQuestion.findMany({
      where: { active: true },
      orderBy: { createdAt: "asc" },
    });
    res.json({ success: true, questions });
  } catch (error) {
    next(error);
  }
}

export async function createAssessment(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const input = assessmentSchema.parse(req.body);
    const result = await submitAssessment(
      req.authUser!.id,
      req.authUser!.role,
      input.patientId,
      input.responses
    );
    res.status(201).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function patientBehaviour(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await getBehaviourForUser(
      req.authUser!.id,
      req.authUser!.role,
      req.params.patientId
    );
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function reviewRecommendation(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { approved } = z
      .object({ approved: z.boolean() })
      .parse(req.body);

    const recommendation = await approveRecommendation(
      req.authUser!.id,
      req.authUser!.role,
      req.params.id,
      approved
    );

    res.json({ success: true, recommendation });
  } catch (error) {
    next(error);
  }
}
