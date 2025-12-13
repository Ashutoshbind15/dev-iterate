import { z } from "zod";

const EnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4001),
  JUDGE0_BASE_URL: z.string().url().default("http://localhost:2358"),
  JUDGE0_API_KEY: z.string().optional().default(""),
  REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),
  MAX_TESTCASES: z.coerce.number().int().positive().default(50),
  MAX_SOURCE_BYTES: z.coerce.number().int().positive().default(200_000),
  CONVEX_SITE_URL: z.string(),
});

export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(): Env {
  return EnvSchema.parse(process.env);
}
