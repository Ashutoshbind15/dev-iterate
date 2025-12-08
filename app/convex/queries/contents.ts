import { query } from "../_generated/server";
import { v } from "convex/values";

export const getContents = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("contents").collect();
  },
});

export const getContent = query({
  args: {
    id: v.id("contents"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
