import { httpAction } from "../_generated/server";
import { internal } from "../_generated/api";

export const getFeed = httpAction(async (ctx, req) => {
  // Todo: [high] add some m2m token auth for calling from kestra workflows
  const formData = await req.formData();
  const summary = formData.get("summary");

  if (!summary || typeof summary !== "string") {
    return new Response(
      JSON.stringify({ error: "Missing or invalid summary field" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const summaryId: string = await ctx.runMutation(
    internal.mutations.rssSummaries.insertRssSummary,
    {
      summaryText: summary,
    }
  );

  return new Response(
    JSON.stringify({
      message: "Summary saved successfully",
      id: summaryId,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
});
