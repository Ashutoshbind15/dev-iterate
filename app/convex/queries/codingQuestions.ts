import { query, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { paginationOptsValidator } from "convex/server";

// Validator for public testcase (returned to clients)
const publicTestCaseValidator = v.object({
  _id: v.id("codingTestCases"),
  stdin: v.string(),
  expectedStdout: v.string(),
  name: v.optional(v.string()),
  order: v.number(),
});

// Validator for full testcase (admin view)
const fullTestCaseValidator = v.object({
  _id: v.id("codingTestCases"),
  visibility: v.union(v.literal("public"), v.literal("hidden")),
  stdin: v.string(),
  expectedStdout: v.string(),
  name: v.optional(v.string()),
  order: v.number(),
});

/**
 * Get a coding question for solving.
 * Returns question data + ONLY public testcases.
 * Hidden testcases are never exposed to clients.
 */
export const getCodingQuestionForSolve = query({
  args: {
    questionId: v.id("codingQuestions"),
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("codingQuestions"),
      _creationTime: v.number(),
      title: v.string(),
      promptRichText: v.string(),
      difficulty: v.union(
        v.literal("easy"),
        v.literal("medium"),
        v.literal("hard")
      ),
      tags: v.array(v.string()),
      authorId: v.id("users"),
      upvotes: v.number(),
      downvotes: v.number(),
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
    const question = await ctx.db.get(args.questionId);
    if (!question) {
      return null;
    }

    // Get only public testcases
    const publicTestCases = await ctx.db
      .query("codingTestCases")
      .withIndex("by_questionId_and_visibility", (q) =>
        q.eq("questionId", args.questionId).eq("visibility", "public")
      )
      .collect();

    // Sort by order
    publicTestCases.sort((a, b) => a.order - b.order);

    // Get total testcase count (public + hidden)
    const allTestCases = await ctx.db
      .query("codingTestCases")
      .withIndex("by_questionId", (q) => q.eq("questionId", args.questionId))
      .collect();

    return {
      _id: question._id,
      _creationTime: question._creationTime,
      title: question.title,
      promptRichText: question.promptRichText,
      difficulty: question.difficulty,
      tags: question.tags,
      authorId: question.authorId,
      upvotes: question.upvotes,
      downvotes: question.downvotes,
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
 * Get a coding question for admin/author view.
 * Returns question data + ALL testcases (public and hidden).
 * Only accessible by the question author.
 */
export const getCodingQuestionForAdmin = query({
  args: {
    questionId: v.id("codingQuestions"),
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("codingQuestions"),
      _creationTime: v.number(),
      title: v.string(),
      promptRichText: v.string(),
      difficulty: v.union(
        v.literal("easy"),
        v.literal("medium"),
        v.literal("hard")
      ),
      tags: v.array(v.string()),
      authorId: v.id("users"),
      upvotes: v.number(),
      downvotes: v.number(),
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
      testCases: v.array(fullTestCaseValidator),
    })
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }

    const question = await ctx.db.get(args.questionId);
    if (!question) {
      return null;
    }

    // Only author can view admin details
    if (question.authorId !== userId) {
      return null;
    }

    // Get all testcases
    const testCases = await ctx.db
      .query("codingTestCases")
      .withIndex("by_questionId", (q) => q.eq("questionId", args.questionId))
      .collect();

    // Sort by order
    testCases.sort((a, b) => a.order - b.order);

    return {
      _id: question._id,
      _creationTime: question._creationTime,
      title: question.title,
      promptRichText: question.promptRichText,
      difficulty: question.difficulty,
      tags: question.tags,
      authorId: question.authorId,
      upvotes: question.upvotes,
      downvotes: question.downvotes,
      languageIdsAllowed: question.languageIdsAllowed,
      defaultLanguageId: question.defaultLanguageId,
      timeLimitSeconds: question.timeLimitSeconds,
      memoryLimitMb: question.memoryLimitMb,
      outputComparison: question.outputComparison,
      starterCode: question.starterCode,
      testCases: testCases.map((tc) => ({
        _id: tc._id,
        visibility: tc.visibility,
        stdin: tc.stdin,
        expectedStdout: tc.expectedStdout,
        name: tc.name,
        order: tc.order,
      })),
    };
  },
});

/**
 * List coding questions with pagination.
 */
export const listCodingQuestions = query({
  args: {
    paginationOpts: paginationOptsValidator,
    difficulty: v.optional(
      v.union(v.literal("easy"), v.literal("medium"), v.literal("hard"))
    ),
    tag: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get coding questions
    let questions;
    if (args.difficulty) {
      questions = await ctx.db
        .query("codingQuestions")
        .withIndex("by_difficulty", (q) => q.eq("difficulty", args.difficulty!))
        .collect();
    } else {
      questions = await ctx.db.query("codingQuestions").collect();
    }

    // Filter by tag if provided
    if (args.tag) {
      questions = questions.filter((q) => q.tags.includes(args.tag!));
    }

    // Sort by creation time descending (newest first)
    questions.sort((a, b) => b._creationTime - a._creationTime);

    // Manual pagination
    const pageSize = args.paginationOpts.numItems;
    const cursor = args.paginationOpts.cursor;

    let startIdx = 0;
    if (cursor) {
      const cursorIdx = questions.findIndex((q) => q._id === cursor);
      if (cursorIdx !== -1) {
        startIdx = cursorIdx + 1;
      }
    }

    const page = questions.slice(startIdx, startIdx + pageSize);
    const isDone = startIdx + pageSize >= questions.length;
    const continueCursor = page.length > 0 ? page[page.length - 1]._id : "";

    return {
      page: page.map((q) => ({
        _id: q._id,
        _creationTime: q._creationTime,
        title: q.title,
        difficulty: q.difficulty,
        tags: q.tags,
        upvotes: q.upvotes,
        downvotes: q.downvotes,
      })),
      isDone,
      continueCursor: continueCursor || "",
    };
  },
});

/**
 * Internal query to get all testcases for a question (used by judge).
 * Returns testcases in order for execution.
 */
export const getAllTestCases = internalQuery({
  args: {
    questionId: v.id("codingQuestions"),
  },
  returns: v.array(
    v.object({
      _id: v.id("codingTestCases"),
      visibility: v.union(v.literal("public"), v.literal("hidden")),
      stdin: v.string(),
      expectedStdout: v.string(),
      name: v.optional(v.string()),
      order: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const testCases = await ctx.db
      .query("codingTestCases")
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
export const getQuestionForJudge = internalQuery({
  args: {
    questionId: v.id("codingQuestions"),
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("codingQuestions"),
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
