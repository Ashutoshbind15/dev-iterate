import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

export const upsertTopicSummary = internalMutation({
  args: {
    topicId: v.id("topics"),
    kind: v.string(),
    summaryText: v.string(),
    generatedBy: v.optional(v.string()), // defaults to "system"
    generatedByUser: v.optional(v.id("users")),
  },
  returns: v.id("topicSummaries"),
  handler: async (ctx, args) => {
    const kind = args.kind.trim();
    if (!kind) {
      throw new Error("kind is required");
    }

    const existing = await ctx.db
      .query("topicSummaries")
      .withIndex("by_topicId_and_kind", (q) =>
        q.eq("topicId", args.topicId).eq("kind", kind)
      )
      .first();

    const now = Date.now();
    const generatedBy = args.generatedBy ?? "system";

    if (existing) {
      await ctx.db.patch(existing._id, {
        summaryText: args.summaryText,
        generatedBy,
        generatedByUser: args.generatedByUser,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("topicSummaries", {
      topicId: args.topicId,
      kind,
      summaryText: args.summaryText,
      generatedBy,
      generatedByUser: args.generatedByUser,
      updatedAt: now,
    });
  },
});


