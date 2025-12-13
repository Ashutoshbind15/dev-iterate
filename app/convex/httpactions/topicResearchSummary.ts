import { httpAction } from "../_generated/server";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";

export const saveTopicResearchSummary = httpAction(async (ctx, req) => {
  // TODO: add m2m token auth like other endpoints
  const body = await req.json();

  const topicId = body?.topicId;
  const summary = body?.summary;

  if (!topicId || typeof topicId !== "string") {
    return new Response(
      JSON.stringify({ error: "Missing required field: topicId" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  if (!summary || typeof summary !== "string") {
    return new Response(
      JSON.stringify({ error: "Missing required field: summary" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const summaryId = await ctx.runMutation(
    internal.mutations.topicSummaries.upsertTopicSummary,
    {
      topicId: topicId as Id<"topics">,
      kind: "webresearch",
      summaryText: summary,
      generatedBy: "system",
    }
  );

  return new Response(JSON.stringify({ ok: true, summaryId }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
