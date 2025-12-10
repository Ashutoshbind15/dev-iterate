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
    // Save the remark
    const remarkId = await ctx.db.insert("userRemarks", {
      userId: args.userId,
      remark: args.remark,
      questionIds: args.questionIds,
      createdAt: Date.now(),
    });

    // Mark the corresponding execution as completed
    // Find pending execution with matching questionIds
    const pendingExecutions = await ctx.db
      .query("weaknessAnalysisExecutions")
      .withIndex("by_user_and_status", (q) =>
        q.eq("userId", args.userId).eq("status", "pending")
      )
      .collect();

    // Find execution where questionIds match (order-independent)
    const questionIdSet = new Set(args.questionIds);
    const matchingExecution = pendingExecutions.find((execution) => {
      if (execution.questionIds.length !== args.questionIds.length) {
        return false;
      }
      return execution.questionIds.every((qid) => questionIdSet.has(qid));
    });

    if (matchingExecution) {
      await ctx.db.patch(matchingExecution._id, {
        status: "completed",
        completedAt: Date.now(),
      });
    }

    return remarkId;
  },
});

