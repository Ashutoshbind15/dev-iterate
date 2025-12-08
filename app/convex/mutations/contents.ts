import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const createContent = mutation({
  args: {
    title: v.string(),
    content: v.string(),
  },
  returns: v.id("contents"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("contents", {
      title: args.title,
      content: args.content,
    });
  },
});

export const updateContent = mutation({
  args: {
    id: v.id("contents"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
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
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return null;
  },
});
