import { z } from "zod";

export const patientListQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  risk: z.enum(["LOW", "MODERATE", "HIGH"]).optional(),
  condition: z.enum(["diabetes", "hypertension"]).optional(),
  comb: z.enum(["CAPABILITY", "OPPORTUNITY", "MOTIVATION"]).optional(),
  abnormal: z.enum(["true", "false"]).optional(),
  sort: z.enum(["name", "risk", "recent"]).default("name"),
});
