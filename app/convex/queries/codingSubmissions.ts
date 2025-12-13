import { query, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { paginationOptsValidator } from "convex/server";

// First failure details validator
const firstFailureValidator = v.object({
  stdin: v.optional(v.string()),
  actualOutput: v.optional(v.string()),
  expectedOutput: v.optional(v.string()),
  errorMessage: v.optional(v.string()),
});

// Submission status type
const statusValidator = v.union(
  v.literal("queued"),
  v.literal("running"),
  v.literal("passed"),
  v.literal("failed"),
  v.literal("error")
);

/**
 * List the current user's submissions for a specific question (or all questions).
 * Ordered by creation time descending (newest first).
 */
export const listMyCodingSubmissions = query({
  args: {
    questionId: v.optional(v.id("codingQuestions")),
    paginationOpts: v.optional(paginationOptsValidator),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return { page: [], isDone: true, continueCursor: "" };
    }

    let submissions;
    if (args.questionId) {
      // Filter by question
      submissions = await ctx.db
        .query("codingSubmissions")
        .withIndex("by_questionId_and_userId", (q) =>
          q.eq("questionId", args.questionId!).eq("userId", userId)
        )
        .collect();
    } else {
      // All submissions for user
      submissions = await ctx.db
        .query("codingSubmissions")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .collect();
    }

    // Sort by creation time descending
    submissions.sort((a, b) => b._creationTime - a._creationTime);

    // If no pagination, return all
    if (!args.paginationOpts) {
      return {
        page: submissions.map((s) => ({
          _id: s._id,
          _creationTime: s._creationTime,
          questionId: s.questionId,
          languageId: s.languageId,
          status: s.status,
          passedCount: s.passedCount,
          totalCount: s.totalCount,
          durationMs: s.durationMs,
        })),
        isDone: true,
        continueCursor: "",
      };
    }

    // Manual pagination
    const pageSize = args.paginationOpts.numItems;
    const cursor = args.paginationOpts.cursor;

    let startIdx = 0;
    if (cursor) {
      const cursorIdx = submissions.findIndex((s) => s._id === cursor);
      if (cursorIdx !== -1) {
        startIdx = cursorIdx + 1;
      }
    }

    const page = submissions.slice(startIdx, startIdx + pageSize);
    const isDone = startIdx + pageSize >= submissions.length;
    const continueCursor = page.length > 0 ? page[page.length - 1]._id : "";

    return {
      page: page.map((s) => ({
        _id: s._id,
        _creationTime: s._creationTime,
        questionId: s.questionId,
        languageId: s.languageId,
        status: s.status,
        passedCount: s.passedCount,
        totalCount: s.totalCount,
        durationMs: s.durationMs,
      })),
      isDone,
      continueCursor: continueCursor || "",
    };
  },
});

/**
 * Get detailed information about a specific submission.
 * Only accessible by the submission owner.
 */
export const getCodingSubmission = query({
  args: {
    submissionId: v.id("codingSubmissions"),
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("codingSubmissions"),
      _creationTime: v.number(),
      questionId: v.id("codingQuestions"),
      userId: v.id("users"),
      languageId: v.number(),
      sourceCode: v.string(),
      status: statusValidator,
      passedCount: v.optional(v.number()),
      totalCount: v.optional(v.number()),
      firstFailureIndex: v.optional(v.number()),
      firstFailure: v.optional(firstFailureValidator),
      stdout: v.optional(v.string()),
      stderr: v.optional(v.string()),
      compileOutput: v.optional(v.string()),
      durationMs: v.optional(v.number()),
    })
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }

    const submission = await ctx.db.get(args.submissionId);
    if (!submission) {
      return null;
    }

    // Only owner can view submission details
    if (submission.userId !== userId) {
      return null;
    }

    return {
      _id: submission._id,
      _creationTime: submission._creationTime,
      questionId: submission.questionId,
      userId: submission.userId,
      languageId: submission.languageId,
      sourceCode: submission.sourceCode,
      status: submission.status,
      passedCount: submission.passedCount,
      totalCount: submission.totalCount,
      firstFailureIndex: submission.firstFailureIndex,
      firstFailure: submission.firstFailure as typeof submission.firstFailure,
      stdout: submission.stdout,
      stderr: submission.stderr,
      compileOutput: submission.compileOutput,
      durationMs: submission.durationMs,
    };
  },
});

/**
 * Get the latest submission for a question by the current user.
 * Useful for showing the most recent attempt on the solve page.
 */
export const getLatestSubmission = query({
  args: {
    questionId: v.id("codingQuestions"),
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("codingSubmissions"),
      _creationTime: v.number(),
      languageId: v.number(),
      sourceCode: v.string(),
      status: statusValidator,
      passedCount: v.optional(v.number()),
      totalCount: v.optional(v.number()),
    })
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }

    const submissions = await ctx.db
      .query("codingSubmissions")
      .withIndex("by_questionId_and_userId", (q) =>
        q.eq("questionId", args.questionId).eq("userId", userId)
      )
      .collect();

    if (submissions.length === 0) {
      return null;
    }

    // Sort by creation time descending and get the first
    submissions.sort((a, b) => b._creationTime - a._creationTime);
    const latest = submissions[0];

    return {
      _id: latest._id,
      _creationTime: latest._creationTime,
      languageId: latest.languageId,
      sourceCode: latest.sourceCode,
      status: latest.status,
      passedCount: latest.passedCount,
      totalCount: latest.totalCount,
    };
  },
});

/**
 * Internal query to get submission details for judge processing.
 */
export const getSubmissionForJudge = internalQuery({
  args: {
    submissionId: v.id("codingSubmissions"),
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("codingSubmissions"),
      questionId: v.id("codingQuestions"),
      userId: v.id("users"),
      languageId: v.number(),
      sourceCode: v.string(),
      status: statusValidator,
    })
  ),
  handler: async (ctx, args) => {
    const submission = await ctx.db.get(args.submissionId);
    if (!submission) {
      return null;
    }

    return {
      _id: submission._id,
      questionId: submission.questionId,
      userId: submission.userId,
      languageId: submission.languageId,
      sourceCode: submission.sourceCode,
      status: submission.status,
    };
  },
});

/**
 * Check if the current user has passed a coding question.
 */
export const hasPassedQuestion = query({
  args: {
    questionId: v.id("codingQuestions"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return false;
    }

    const submissions = await ctx.db
      .query("codingSubmissions")
      .withIndex("by_questionId_and_userId", (q) =>
        q.eq("questionId", args.questionId).eq("userId", userId)
      )
      .collect();

    return submissions.some((s) => s.status === "passed");
  },
});
