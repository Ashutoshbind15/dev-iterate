import { z } from "zod";

export const JudgeQuestionRequestSchema = z
  .object({
    questionId: z.string(), // Convex ID
    submissionId: z.string(), // Convex ID
    languageId: z.number().int().positive(),
    sourceCode: z.string(),
  })
  .strict();

export type JudgeQuestionRequest = z.infer<typeof JudgeQuestionRequestSchema>;

export interface JudgeQuestionFirstFailure {
  index: number;
  visibility: "public" | "hidden";
  // Only included for public testcases
  testCase?: { stdin: string; expectedStdout: string; name?: string };
  actualStdout: string;
  stderr: string | null;
  compileOutput: string | null;
  judge0: Record<string, unknown>;
}

export type JudgeQuestionResponse =
  | {
      status: "passed" | "failed";
      submissionId: string;
      summary: { passedCount: number; totalCount: number; durationMs: number };
      firstFailure?: JudgeQuestionFirstFailure;
    }
  | {
      status: "error";
      submissionId: string;
      message: string;
      details?: Record<string, unknown>;
    };

// Response shape from Convex /coding/testcases endpoint
export const ConvexTestCasesResponseSchema = z.object({
  question: z.object({
    _id: z.string(),
    timeLimitSeconds: z.number(),
    memoryLimitMb: z.number(),
    outputComparison: z.object({
      trimOutputs: z.boolean(),
      normalizeWhitespace: z.boolean(),
      caseSensitive: z.boolean(),
    }),
  }),
  testCases: z.array(
    z.object({
      _id: z.string(),
      visibility: z.enum(["public", "hidden"]),
      stdin: z.string(),
      expectedStdout: z.string(),
      name: z.string().optional(),
      order: z.number(),
    })
  ),
});

export type ConvexTestCasesResponse = z.infer<
  typeof ConvexTestCasesResponseSchema
>;

