import { internalMutation, mutation } from "../_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";

export const createContent = mutation({
  args: {
    title: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError("User not authenticated");
    }
    return await ctx.db.insert("contents", {
      title: args.title,
      content: args.content,
      status: "completed",
      userId,
    });
  },
});

export const createPendingGeneratedContent = mutation({
  args: {
    topic: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError("User not authenticated");
    }

    const topic = args.topic.trim();
    if (!topic) {
      throw new ConvexError("Topic is required");
    }

    return await ctx.db.insert("contents", {
      title: `Generating: ${topic}`,
      content: JSON.stringify({ type: "doc", content: [] }),
      status: "pending",
      generationTopic: topic,
      userId,
    });
  },
});

export const updateContent = mutation({
  args: {
    id: v.id("contents"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError("User not authenticated");
    }

    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new ConvexError("Content not found");
    }
    if (existing.userId !== userId) {
      throw new ConvexError("Not authorized");
    }

    const { id, ...updates } = args;
    const filteredUpdates: { title?: string; content?: string } = {};
    if (updates.title !== undefined) filteredUpdates.title = updates.title;
    if (updates.content !== undefined)
      filteredUpdates.content = updates.content;
    await ctx.db.patch(id, filteredUpdates);
    return null;
  },
});

export const deleteContent = mutation({
  args: {
    id: v.id("contents"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError("User not authenticated");
    }

    const existing = await ctx.db.get(args.id);
    if (!existing) {
      // Idempotent delete
      return null;
    }
    if (existing.userId !== userId) {
      throw new ConvexError("Not authorized");
    }

    await ctx.db.delete(args.id);
    return null;
  },
});

export const completeGeneratedContent = internalMutation({
  args: {
    contentId: v.id("contents"),
    title: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.contentId);
    if (!existing) {
      throw new ConvexError("Content not found");
    }

    await ctx.db.patch(args.contentId, {
      title: args.title,
      content: args.content,
      status: "completed",
      errorMessage: undefined,
    });
    return null;
  },
});

export const markGeneratedContentFailed = internalMutation({
  args: {
    contentId: v.id("contents"),
    errorMessage: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.contentId);
    if (!existing) {
      throw new ConvexError("Content not found");
    }

    await ctx.db.patch(args.contentId, {
      status: "failed",
      errorMessage: args.errorMessage,
    });
    return null;
  },
});
