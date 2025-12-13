import { query } from "../_generated/server";
import { v } from "convex/values";

export const getRecentCombinedSummaries = query({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.array(v.string()),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 15;

    // Fetch RSS summaries
    const rssSummaries = await ctx.db
      .query("rssSummaries")
      .order("desc")
      .take(limit);

    // Fetch topic summaries
    const topicSummaries = await ctx.db
      .query("topicSummaries")
      .order("desc")
      .take(limit);

    // Extract just the summary texts with creation times for sorting
    const allSummaries = [
      ...rssSummaries.map((rs) => ({
        text: rs.summaryText,
        createdAt: rs._creationTime,
      })),
      ...topicSummaries.map((ts) => ({
        text: ts.summaryText,
        createdAt: ts._creationTime,
      })),
    ];

    // Sort by creation time (desc), take top `limit`, return just texts
    return allSummaries
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit)
      .map((s) => s.text);
  },
});

