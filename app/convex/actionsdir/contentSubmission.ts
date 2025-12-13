import { internalAction } from "../_generated/server";
import { v } from "convex/values";

const triggerWebhook = async (payload: {
  contentId: string;
  jsonct: string;
}) => {
  const WEBHOOK_TRIGGER_KEY = process.env.WEBHOOK_TRIGGER_KEY;
  if (!WEBHOOK_TRIGGER_KEY) {
    throw new Error("WEBHOOK_TRIGGER_KEY is not set");
  }

  const KESTRA_BASE_URL =
    process.env.KESTRA_BASE_URL ?? "http://localhost:8080";
  const WORKFLOWS_BASE_URL = `${KESTRA_BASE_URL}/api/v1/executions/webhook`;
  const WORKFLOWS_NAMESPACE = "main";
  const WORKFLOW_ID = "content_submission_indexer";

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
    throw new Error(
      `Failed to trigger content submission indexing webhook: ${response.status} - ${errorText}`
    );
  }
};

export const triggerContentSubmissionIndexing = internalAction({
  args: {
    contentId: v.id("contents"),
    jsonct: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await triggerWebhook({
      contentId: args.contentId,
      jsonct: args.jsonct,
    });
    return null;
  },
});
