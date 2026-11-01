import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { UserRole } from "@prisma/client";
import { env } from "../config/env";
import { prisma } from "../lib/prisma";

export async function authenticateUser(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Login is required." });
  }

  try {
    const payload = jwt.verify(header.slice(7), env.JWT_SECRET) as { sub: string; role: UserRole };
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true, status: true }
    });

    if (!user || user.status !== "ACTIVE") {
      return res.status(401).json({ success: false, message: "Account is not active." });
    }

    req.authUser = { id: user.id, role: user.role };
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired token." });
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.authUser || !roles.includes(req.authUser.role)) {
      return res.status(403).json({ success: false, message: "You do not have permission." });
    }
    next();
  };
}
