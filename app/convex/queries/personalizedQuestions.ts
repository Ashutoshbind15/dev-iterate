import { query } from "../_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";

/**
 * Get all personalized questions for the current user
 */
export const getPersonalizedQuestions = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError("User not authenticated");
    }

    const questions = await ctx.db
      .query("personalizedQuestions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return questions;
  },
});

/**
 * Get all submissions for the current user
 */
export const getPersonalizedQuestionSubmissions = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError("User not authenticated");
    }

    const submissions = await ctx.db
      .query("personalizedQuestionSubmissions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return submissions;
  },
});

/**
 * Get a single submission with its questions
 */
export const getSubmissionWithQuestions = query({
  args: {
    submissionId: v.id("personalizedQuestionSubmissions"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError("User not authenticated");
    }

    const submission = await ctx.db.get(args.submissionId);
    if (!submission) {
      return null;
    }

    if (submission.userId !== userId) {
      throw new ConvexError("Unauthorized: Submission does not belong to user");
    }

    const questions = await ctx.db
      .query("personalizedQuestions")
      .withIndex("by_submission", (q) =>
        q.eq("submissionId", args.submissionId)
      )
      .order("desc")
      .collect();

    return {
      submission,
      questions,
    };
  },
});
