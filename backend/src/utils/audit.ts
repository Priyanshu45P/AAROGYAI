import { prisma } from "../lib/prisma";

export async function writeAudit(
  userId: string | undefined,
  action: string,
  entity: string,
  entityId?: string,
  metadata?: unknown
) {
  // Store important actions for accountability.
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      entity,
      entityId,
      metadata: metadata as any
    }
  });
}
