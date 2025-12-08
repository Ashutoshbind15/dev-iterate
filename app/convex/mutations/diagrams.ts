import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const createDiagram = mutation({
  args: {
    title: v.string(),
    elements: v.string(),
    appState: v.string(),
  },
  returns: v.id("diagrams"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("diagrams", {
      title: args.title,
      elements: args.elements,
      appState: args.appState,
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
  returns: v.null(),
  handler: async (ctx, args) => {
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
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return null;
  },
});
