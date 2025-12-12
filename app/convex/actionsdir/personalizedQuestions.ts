import { internalAction } from "../_generated/server";
import { v } from "convex/values";

const triggerWebhook = async (payload: {
  userId: string;
  submissionId: string;
  analysis: string;
}) => {
  const WEBHOOK_TRIGGER_KEY = process.env.WEBHOOK_TRIGGER_KEY;
  if (!WEBHOOK_TRIGGER_KEY) {
    throw new Error("WEBHOOK_TRIGGER_KEY is not set");
  }

  const WORKFLOWS_BASE_URL = "http://localhost:8080/api/v1/executions/webhook";
  const WORKFLOWS_NAMESPACE = "main";
  const WORKFLOW_ID = "personalized_question_generator";

  const webhookUrl = `${WORKFLOWS_BASE_URL}/${WORKFLOWS_NAMESPACE}/${WORKFLOW_ID}/${WEBHOOK_TRIGGER_KEY}`;

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
      `Failed to trigger personalized question generation webhook: ${response.status} - ${errorText}`
    );
  }
};

export const triggerQuestionGeneration = internalAction({
  args: {
    userId: v.id("users"),
    submissionId: v.id("personalizedQuestionSubmissions"),
    analysis: v.string(),
  },
  handler: async (ctx, args) => {
    await triggerWebhook({
      userId: args.userId,
      submissionId: args.submissionId,
      analysis: args.analysis,
    });
    return null;
  },
});
