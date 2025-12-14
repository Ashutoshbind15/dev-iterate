import { internalAction } from "../_generated/server";
import { v } from "convex/values";

const triggerWebhook = async (payload: {
  userId: string;
  submissions: Array<{
    submissionId: string;
    questionTitle: string;
    questionTags: string[];
    difficulty: "easy" | "medium" | "hard";
    languageId: number;
    status: "passed" | "failed" | "error";
    passedCount?: number;
    totalCount?: number;
    firstFailure?: {
      stdin?: string;
      actualOutput?: string;
      expectedOutput?: string;
      errorMessage?: string;
    };
  }>;
  pastRemarks: string;
}) => {
  const WEBHOOK_TRIGGER_KEY = process.env.WEBHOOK_TRIGGER_KEY;
  if (!WEBHOOK_TRIGGER_KEY) {
    throw new Error("WEBHOOK_TRIGGER_KEY is not set");
  }

  const WORKFLOWS_BASE_URL = "http://localhost:8080/api/v1/executions/webhook";
  const WORKFLOWS_NAMESPACE = "main";
  const WEAKNESS_WORKFLOW_ID = "coding_user_weakness_analyzer";

  const webhookUrl = `${WORKFLOWS_BASE_URL}/${WORKFLOWS_NAMESPACE}/${WEAKNESS_WORKFLOW_ID}/${WEBHOOK_TRIGGER_KEY}`;

  const encodedCredentials = process.env.KESTRA_BASIC_AUTH_ENCODED;
  if (!encodedCredentials) {
    throw new Error("KESTRA_BASIC_AUTH_ENCODED is not set");
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${encodedCredentials}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.log(response);
    throw new Error(
      `Failed to trigger coding weakness analysis webhook: ${response.status} - ${errorText}`
    );
  }
};

export const triggerCodingWeaknessAnalysis = internalAction({
  args: {
    userId: v.id("users"),
    submissions: v.array(
      v.object({
        submissionId: v.string(),
        questionTitle: v.string(),
        questionTags: v.array(v.string()),
        difficulty: v.union(
          v.literal("easy"),
          v.literal("medium"),
          v.literal("hard")
        ),
        languageId: v.number(),
        status: v.union(
          v.literal("passed"),
          v.literal("failed"),
          v.literal("error")
        ),
        passedCount: v.optional(v.number()),
        totalCount: v.optional(v.number()),
        firstFailure: v.optional(
          v.object({
            stdin: v.optional(v.string()),
            actualOutput: v.optional(v.string()),
            expectedOutput: v.optional(v.string()),
            errorMessage: v.optional(v.string()),
          })
        ),
      })
    ),
    pastRemarks: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await triggerWebhook({
      userId: args.userId,
      submissions: args.submissions,
      pastRemarks: args.pastRemarks,
    });
    return null;
  },
});
