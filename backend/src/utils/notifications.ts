import { prisma } from "../lib/prisma";

export async function createNotification(userId: string, title: string, message: string) {
  // Create a simple in-app notification for one user.
  return prisma.notification.create({ data: { userId, title, message } });
}
