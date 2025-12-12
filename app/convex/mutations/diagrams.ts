import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";

export const createDiagram = mutation({
  args: {
    title: v.string(),
    elements: v.string(),
    appState: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError("User not authenticated");
    }
    return await ctx.db.insert("diagrams", {
      title: args.title,
      elements: args.elements,
      appState: args.appState,
      userId,
    });
  },
});

export const updateDiagram = mutation({
  args: {
    id: v.id("diagrams"),
    title: v.optional(v.string()),
    elements: v.optional(v.string()),
    appState: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError("User not authenticated");
    }

    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new ConvexError("Diagram not found");
    }
    if (existing.userId !== userId) {
      throw new ConvexError("Not authorized");
    }

    const { id, ...updates } = args;
    const filteredUpdates: {
      title?: string;
      elements?: string;
      appState?: string;
    } = {};
    if (updates.title !== undefined) filteredUpdates.title = updates.title;
    if (updates.elements !== undefined)
      filteredUpdates.elements = updates.elements;
    if (updates.appState !== undefined)
      filteredUpdates.appState = updates.appState;
    await ctx.db.patch(id, filteredUpdates);
    return null;
  },
});

export const deleteDiagram = mutation({
  args: {
    id: v.id("diagrams"),
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
