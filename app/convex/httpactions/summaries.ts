import { httpAction } from "../_generated/server";
import { api } from "../_generated/api";

export const getRecentSummaries = httpAction(async (ctx, req) => {
  // Parse optional limit from query params or body
  let limit = 15;

  // Try to get limit from URL query params
  const url = new URL(req.url);
  const limitParam = url.searchParams.get("limit");
  if (limitParam) {
    const parsed = parseInt(limitParam, 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 50) {
      limit = parsed;
    }
  }

  // Run the query to get combined summaries
  const summaries = await ctx.runQuery(
    api.queries.summaries.getRecentCombinedSummaries,
    { limit }
  );

  return new Response(JSON.stringify({ summaries }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

