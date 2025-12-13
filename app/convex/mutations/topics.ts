import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";

export const upsertSystemTopics = internalMutation({
  args: {
    topics: v.array(v.string()),
    generatedBy: v.optional(v.string()), // defaults to "system"
    generatedByUser: v.optional(v.id("users")),
  },
  returns: v.array(
    v.object({
      topicId: v.id("topics"),
      topic: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    const generatedBy = args.generatedBy ?? "system";

    const uniqueTopics = Array.from(
      new Set(
        args.topics
          .map((t) => (typeof t === "string" ? t.trim() : ""))
          .filter((t) => t.length > 0)
      )
    );

    const results: Array<{ topicId: Id<"topics">; topic: string }> = [];

    for (const topic of uniqueTopics) {
      const existing = await ctx.db
        .query("topics")
        .withIndex("by_generatedBy_and_name", (q) =>
          q.eq("generatedBy", generatedBy).eq("name", topic)
        )
        .first();

      if (existing) {
        results.push({ topicId: existing._id, topic: existing.name });
        continue;
      }

      const topicId = await ctx.db.insert("topics", {
        name: topic,
        generatedBy,
        generatedByUser: args.generatedByUser,
      });
      results.push({ topicId, topic });
    }

    return results;
  },
});
