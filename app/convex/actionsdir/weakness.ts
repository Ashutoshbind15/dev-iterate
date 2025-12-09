import { internalAction } from "../_generated/server";
import { v } from "convex/values";

const triggerWebhook = async (payload: {
  userId: string;
  questions: Array<{
    questionId: string;
    questionText: string;
    title: string;
    tags: string[];
    difficulty: "easy" | "medium" | "hard";
    correctAnswer: string;
    userAnswer: string;
    isCorrect: boolean;
  }>;
  pastRemarks: string;
}) => {
  const WEBHOOK_TRIGGER_KEY = process.env.WEBHOOK_TRIGGER_KEY;
  if (!WEBHOOK_TRIGGER_KEY) {
    throw new Error("WEBHOOK_TRIGGER_KEY is not set");
  }

  const WORKFLOWS_BASE_URL = "http://localhost:8080/api/v1/executions/webhook";
  const WORKFLOWS_NAMESPACE = "main";
  const WEAKNESS_WORKFLOW_ID = "user_weakness_analyzer";

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
      `Failed to trigger weakness analysis webhook: ${response.status} - ${errorText}`
    );
  }
};

export const triggerWeaknessAnalysis = internalAction({
  args: {
    userId: v.id("users"),
    questions: v.array(
      v.object({
        questionId: v.string(),
        questionText: v.string(),
        title: v.string(),
        tags: v.array(v.string()),
        difficulty: v.union(
          v.literal("easy"),
          v.literal("medium"),
          v.literal("hard")
        ),
        correctAnswer: v.string(),
        userAnswer: v.string(),
        isCorrect: v.boolean(),
      })
    ),
    pastRemarks: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await triggerWebhook({
      userId: args.userId,
      questions: args.questions,
      pastRemarks: args.pastRemarks,
    });
    return null;
  },
});
