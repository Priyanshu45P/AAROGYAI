import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("1d"),
  FRONTEND_URL: z.string().url(),
  AI_SERVICE_URL: z.string().url()
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error("Invalid environment configuration.");
  console.error(result.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = result.data;
