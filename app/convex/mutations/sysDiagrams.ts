import { internalMutation, mutation } from "../_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

export const createPendingSysDiagram = internalMutation({
  args: {
    topic: v.string(),
  },
  returns: v.id("sysDiagrams"),
  handler: async (ctx, args) => {
    const topic = args.topic.trim();
    if (!topic) throw new ConvexError("Topic is required");

    return await ctx.db.insert("sysDiagrams", {
      title: `Generating: ${topic}`,
      mermaid: "",
      status: "pending",
      generationTopic: topic,
    });
  },
});

export const completeGeneratedSysDiagram = internalMutation({
  args: {
    diagramId: v.id("sysDiagrams"),
    title: v.string(),
    mermaid: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.diagramId);
    if (!existing) throw new ConvexError("System diagram not found");

    await ctx.db.patch(args.diagramId, {
      title: args.title,
      mermaid: args.mermaid,
      status: "completed",
      errorMessage: undefined,
    });
    return null;
  },
});

export const markGeneratedSysDiagramFailed = internalMutation({
  args: {
    diagramId: v.id("sysDiagrams"),
    errorMessage: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.diagramId);
    if (!existing) throw new ConvexError("System diagram not found");

    await ctx.db.patch(args.diagramId, {
      status: "failed",
      errorMessage: args.errorMessage,
    });
    return null;
  },
});

export const setSysDiagramExcalidraw = mutation({
  args: {
    diagramId: v.id("sysDiagrams"),
    elements: v.string(),
    appState: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.diagramId);
    if (!existing) throw new ConvexError("System diagram not found");

    // Only set once (first successful render wins).
    if (existing.elements && existing.appState) return null;
    // Only accept caching for completed diagrams.
    if (existing.status !== "completed") return null;

    await ctx.db.patch(args.diagramId, {
      elements: args.elements,
      appState: args.appState,
    });
    return null;
  },
});
