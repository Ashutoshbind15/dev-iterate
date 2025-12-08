import { query } from "../_generated/server";

export const getLessons = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("lessons").collect();
  },
});
