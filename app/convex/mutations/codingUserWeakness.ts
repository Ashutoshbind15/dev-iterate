import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

export const saveRemark = internalMutation({
  args: {
    userId: v.id("users"),
    remark: v.string(),
    submissionIds: v.array(v.id("codingSubmissions")),
  },
  returns: v.id("codingUserRemarks"),
  handler: async (ctx, args) => {
    // Save the remark
    const remarkId = await ctx.db.insert("codingUserRemarks", {
      userId: args.userId,
      remark: args.remark,
      submissionIds: args.submissionIds,
      createdAt: Date.now(),
    });

    // Mark the corresponding execution as completed
    // Find pending execution with matching submissionIds
    const pendingExecutions = await ctx.db
      .query("codingWeaknessAnalysisExecutions")
      .withIndex("by_user_and_status", (q) =>
        q.eq("userId", args.userId).eq("status", "pending")
      )
      .collect();

    // Find execution where submissionIds match (order-independent)
    const submissionIdSet = new Set(args.submissionIds);
    const matchingExecution = pendingExecutions.find((execution) => {
      if (execution.submissionIds.length !== args.submissionIds.length) {
        return false;
      }
      return execution.submissionIds.every((sid) => submissionIdSet.has(sid));
    });

    if (matchingExecution) {
      await ctx.db.patch(matchingExecution._id, {
        status: "completed" as const,
        completedAt: Date.now(),
      });
    }

    return remarkId;
  },
});

