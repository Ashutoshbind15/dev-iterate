import { query } from "../_generated/server";
import { v } from "convex/values";

const diagramValidator = v.object({
  _id: v.id("diagrams"),
  _creationTime: v.number(),
  title: v.string(),
  elements: v.string(),
  appState: v.string(),
});

export const getDiagrams = query({
  args: {},
  returns: v.array(diagramValidator),
  handler: async (ctx) => {
    return await ctx.db.query("diagrams").collect();
  },
});

export const getDiagram = query({
  args: {
    id: v.id("diagrams"),
  },
  returns: v.union(diagramValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
