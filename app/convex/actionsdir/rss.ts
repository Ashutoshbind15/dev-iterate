import { internalAction } from "../_generated/server";
import { v } from "convex/values";

const triggerWebhook = async (rssUrls: string[]) => {
  const WEBHOOK_TRIGGER_KEY = process.env.WEBHOOK_TRIGGER_KEY;
  if (!WEBHOOK_TRIGGER_KEY) {
    throw new Error("WEBHOOK_TRIGGER_KEY is not set");
  }

  const WORKFLOWS_BASE_URL = "http://localhost:8080/api/v1/executions/webhook";
  const WORKFLOWS_NAMESPACE = "main";
  const SUMMARIZER_WORKFLOW_ID = "rss_summarizer";

  const webhookUrl = `${WORKFLOWS_BASE_URL}/${WORKFLOWS_NAMESPACE}/${SUMMARIZER_WORKFLOW_ID}/${WEBHOOK_TRIGGER_KEY}`;

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
    body: JSON.stringify({
      rssuris: rssUrls.join(","),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.log(response);
    throw new Error(
      `Failed to trigger webhook: ${response.status} - ${errorText}`
    );
  }
};

export const triggerSummarization = internalAction({
  args: {
    rssUrls: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await triggerWebhook(args.rssUrls);
    return null;
  },
});
