import { PrismaClient } from "@prisma/client";

// Use one Prisma client for the whole API.
export const prisma = new PrismaClient();
