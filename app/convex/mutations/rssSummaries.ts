import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

export const insertRssSummary = internalMutation({
  args: {
    feedUrl: v.string(),
    feedTitle: v.optional(v.string()),
    summaryText: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("rssSummaries", {
      feedUrl: args.feedUrl,
      feedTitle: args.feedTitle,
      summaryText: args.summaryText,
    });
  },
});
