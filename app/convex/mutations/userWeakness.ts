import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

export const saveRemark = internalMutation({
  args: {
    userId: v.id("users"),
    remark: v.string(),
    questionIds: v.array(v.id("questions")),
  },
  returns: v.id("userRemarks"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("userRemarks", {
      userId: args.userId,
      remark: args.remark,
      questionIds: args.questionIds,
      createdAt: Date.now(),
    });
  },
});

