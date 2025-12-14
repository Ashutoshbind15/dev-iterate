import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

export const createPendingSysContent = internalMutation({
  args: {
    topic: v.string(),
  },
  returns: v.id("sysContents"),
  handler: async (ctx, args) => {
    const topic = args.topic.trim();
    if (!topic) throw new ConvexError("Topic is required");

    return await ctx.db.insert("sysContents", {
      title: `Generating: ${topic}`,
      content: JSON.stringify({ type: "doc", content: [] }),
      status: "pending",
      generationTopic: topic,
    });
  },
});

export const completeGeneratedSysContent = internalMutation({
  args: {
    contentId: v.id("sysContents"),
    title: v.string(),
    content: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.contentId);
    if (!existing) throw new ConvexError("System content not found");

    await ctx.db.patch(args.contentId, {
      title: args.title,
      content: args.content,
      status: "completed",
      errorMessage: undefined,
    });
    return null;
  },
});

export const markGeneratedSysContentFailed = internalMutation({
  args: {
    contentId: v.id("sysContents"),
    errorMessage: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.contentId);
    if (!existing) throw new ConvexError("System content not found");

    await ctx.db.patch(args.contentId, {
      status: "failed",
      errorMessage: args.errorMessage,
    });
    return null;
  },
});


