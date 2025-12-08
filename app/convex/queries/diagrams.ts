import { query } from "../_generated/server";
import { v } from "convex/values";

export const getDiagrams = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("diagrams").collect();
  },
});

export const getDiagram = query({
  args: {
    id: v.id("diagrams"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
