import { z } from "zod";

export const JudgeTestCaseSchema = z.object({
  stdin: z.string(),
  expectedStdout: z.string(),
  name: z.string().optional(),
});

export const JudgeLimitsSchema = z
  .object({
    cpuTimeSeconds: z.number().positive().optional(),
    memoryMb: z.number().positive().optional(),
    wallTimeSeconds: z.number().positive().optional(),
  })
  .strict();

export const JudgeRequestSchema = z
  .object({
    languageId: z.number().int().positive(),
    sourceCode: z.string(),
    testCases: z.array(JudgeTestCaseSchema).min(1),
    limits: JudgeLimitsSchema.optional(),
  })
  .strict();

export type JudgeRequest = z.infer<typeof JudgeRequestSchema>;

export type JudgeResponse =
  | {
      status: "passed" | "failed";
      summary: { passedCount: number; totalCount: number; durationMs: number };
      firstFailure?: {
        index: number;
        testCase: { stdin: string; expectedStdout: string; name?: string };
        actualStdout: string;
        stderr: string | null;
        compileOutput: string | null;
        judge0: Record<string, unknown>;
      };
    }
  | { status: "error"; message: string; details?: Record<string, unknown> };


