import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

export const insertRssSummary = internalMutation({
  args: {
    summaryText: v.string(),
  },
  returns: v.id("rssSummaries"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("rssSummaries", {
      summaryText: args.summaryText,
    });
  },
});
