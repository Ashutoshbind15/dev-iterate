import { query, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";

// Validator for public testcase (returned to clients)
const publicTestCaseValidator = v.object({
  _id: v.id("personalizedCodingTestCases"),
  stdin: v.string(),
  expectedStdout: v.string(),
  name: v.optional(v.string()),
  order: v.number(),
});

/**
 * Get all personalized coding questions for the current user
 */
export const getPersonalizedCodingQuestions = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError("User not authenticated");
    }

    const questions = await ctx.db
      .query("personalizedCodingQuestions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    // Enrich with submission info
    const enriched = await Promise.all(
      questions.map(async (question) => {
        // Get best submission for this question
        const submissions = await ctx.db
          .query("personalizedCodingSubmissions")
          .withIndex("by_questionId_and_userId", (q) =>
            q.eq("questionId", question._id).eq("userId", userId)
          )
          .collect();

        const passedSubmission = submissions.find((s) => s.status === "passed");
        const latestSubmission = submissions.sort(
          (a, b) => b._creationTime - a._creationTime
        )[0];

        return {
          ...question,
          hasSubmitted: submissions.length > 0,
          hasPassed: passedSubmission !== undefined,
          submissionCount: submissions.length,
          latestStatus: latestSubmission?.status,
        };
      })
    );

    return enriched;
  },
});

/**
 * Get a single personalized coding question for solving
 */
export const getPersonalizedCodingQuestionForSolve = query({
  args: { questionId: v.id("personalizedCodingQuestions") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("personalizedCodingQuestions"),
      _creationTime: v.number(),
      title: v.string(),
      promptRichText: v.string(),
      difficulty: v.union(
        v.literal("easy"),
        v.literal("medium"),
        v.literal("hard")
      ),
      tags: v.array(v.string()),
      languageIdsAllowed: v.array(v.number()),
      defaultLanguageId: v.number(),
      timeLimitSeconds: v.number(),
      memoryLimitMb: v.number(),
      outputComparison: v.object({
        trimOutputs: v.boolean(),
        normalizeWhitespace: v.boolean(),
        caseSensitive: v.boolean(),
      }),
      starterCode: v.optional(v.record(v.string(), v.string())),
      publicTestCases: v.array(publicTestCaseValidator),
      totalTestCaseCount: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError("User not authenticated");
    }

    const question = await ctx.db.get(args.questionId);
    if (!question) {
      return null;
    }

    if (question.userId !== userId) {
      throw new ConvexError("Unauthorized: Question does not belong to user");
    }

    // Get only public testcases
    const publicTestCases = await ctx.db
      .query("personalizedCodingTestCases")
      .withIndex("by_questionId_and_visibility", (q) =>
        q.eq("questionId", args.questionId).eq("visibility", "public")
      )
      .collect();

    // Sort by order
    publicTestCases.sort((a, b) => a.order - b.order);

    // Get total testcase count (public + hidden)
    const allTestCases = await ctx.db
      .query("personalizedCodingTestCases")
      .withIndex("by_questionId", (q) => q.eq("questionId", args.questionId))
      .collect();

    return {
      _id: question._id,
      _creationTime: question._creationTime,
      title: question.title,
      promptRichText: question.promptRichText,
      difficulty: question.difficulty,
      tags: question.tags,
      languageIdsAllowed: question.languageIdsAllowed,
      defaultLanguageId: question.defaultLanguageId,
      timeLimitSeconds: question.timeLimitSeconds,
      memoryLimitMb: question.memoryLimitMb,
      outputComparison: question.outputComparison,
      starterCode: question.starterCode,
      publicTestCases: publicTestCases.map((tc) => ({
        _id: tc._id,
        stdin: tc.stdin,
        expectedStdout: tc.expectedStdout,
        name: tc.name,
        order: tc.order,
      })),
      totalTestCaseCount: allTestCases.length,
    };
  },
});

/**
 * Get all submissions for the current user for personalized coding questions
 */
export const getPersonalizedCodingQuestionSubmissions = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError("User not authenticated");
    }

    const submissions = await ctx.db
      .query("personalizedCodingQuestionSubmissions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return submissions;
  },
});

/**
 * Get a single submission with its questions
 */
export const getPersonalizedCodingSubmissionWithQuestions = query({
  args: {
    submissionId: v.id("personalizedCodingQuestionSubmissions"),
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
      .query("personalizedCodingQuestions")
      .withIndex("by_submission", (q) =>
        q.eq("submissionId", args.submissionId)
      )
      .order("desc")
      .collect();

    const enrichedQuestions = await Promise.all(
      questions.map(async (question) => {
        // Get best submission for this question
        const codingSubmissions = await ctx.db
          .query("personalizedCodingSubmissions")
          .withIndex("by_questionId_and_userId", (q) =>
            q.eq("questionId", question._id).eq("userId", userId)
          )
          .collect();

        const passedSubmission = codingSubmissions.find(
          (s) => s.status === "passed"
        );
        const latestSubmission = codingSubmissions.sort(
          (a, b) => b._creationTime - a._creationTime
        )[0];

        return {
          ...question,
          hasSubmitted: codingSubmissions.length > 0,
          hasPassed: passedSubmission !== undefined,
          submissionCount: codingSubmissions.length,
          latestStatus: latestSubmission?.status,
        };
      })
    );

    return {
      submission,
      questions: enrichedQuestions,
    };
  },
});

/**
 * Get a user's coding submissions for a specific personalized question
 */
export const getPersonalizedCodingSubmissionsForQuestion = query({
  args: {
    questionId: v.id("personalizedCodingQuestions"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError("User not authenticated");
    }

    // Validate question belongs to user
    const question = await ctx.db.get(args.questionId);
    if (!question) {
      return [];
    }

    if (question.userId !== userId) {
      throw new ConvexError("Unauthorized: Question does not belong to user");
    }

    const submissions = await ctx.db
      .query("personalizedCodingSubmissions")
      .withIndex("by_questionId_and_userId", (q) =>
        q.eq("questionId", args.questionId).eq("userId", userId)
      )
      .order("desc")
      .collect();

    return submissions;
  },
});

/**
 * Get a specific personalized coding submission by ID
 */
export const getPersonalizedCodingSubmission = query({
  args: {
    submissionId: v.id("personalizedCodingSubmissions"),
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

    return submission;
  },
});

// ============================================================
// INTERNAL QUERIES (for judge integration)
// ============================================================

/**
 * Internal query to get all testcases for a personalized question (used by judge).
 * Returns testcases in order for execution.
 */
export const getAllPersonalizedTestCases = internalQuery({
  args: {
    questionId: v.id("personalizedCodingQuestions"),
  },
  returns: v.array(
    v.object({
      _id: v.id("personalizedCodingTestCases"),
      visibility: v.union(v.literal("public"), v.literal("hidden")),
      stdin: v.string(),
      expectedStdout: v.string(),
      name: v.optional(v.string()),
      order: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const testCases = await ctx.db
      .query("personalizedCodingTestCases")
      .withIndex("by_questionId_and_order", (q) =>
        q.eq("questionId", args.questionId)
      )
      .collect();

    // Sort by order just to be safe
    testCases.sort((a, b) => a.order - b.order);

    return testCases.map((tc) => ({
      _id: tc._id,
      visibility: tc.visibility,
      stdin: tc.stdin,
      expectedStdout: tc.expectedStdout,
      name: tc.name,
      order: tc.order,
    }));
  },
});

/**
 * Internal query to get question details for judge processing.
 */
export const getPersonalizedQuestionForJudge = internalQuery({
  args: {
    questionId: v.id("personalizedCodingQuestions"),
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("personalizedCodingQuestions"),
      timeLimitSeconds: v.number(),
      memoryLimitMb: v.number(),
      outputComparison: v.object({
        trimOutputs: v.boolean(),
        normalizeWhitespace: v.boolean(),
        caseSensitive: v.boolean(),
      }),
    })
  ),
  handler: async (ctx, args) => {
    const question = await ctx.db.get(args.questionId);
    if (!question) {
      return null;
    }

    return {
      _id: question._id,
      timeLimitSeconds: question.timeLimitSeconds,
      memoryLimitMb: question.memoryLimitMb,
      outputComparison: question.outputComparison,
    };
  },
});

