import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";

// Validator for testcase input
const testCaseValidator = v.object({
  visibility: v.union(v.literal("public"), v.literal("hidden")),
  stdin: v.string(),
  expectedStdout: v.string(),
  name: v.optional(v.string()),
});

// Validator for output comparison settings
const outputComparisonValidator = v.object({
  trimOutputs: v.boolean(),
  normalizeWhitespace: v.boolean(),
  caseSensitive: v.boolean(),
});

/**
 * Create a new coding question with testcases.
 * Creates the question record and all associated testcases in one transaction.
 */
export const createCodingQuestion = mutation({
  args: {
    title: v.string(),
    promptRichText: v.string(), // Rich text JSON for problem prompt
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
    outputComparison: outputComparisonValidator,
    starterCode: v.optional(v.record(v.string(), v.string())),
    testCases: v.array(testCaseValidator),
  },
  returns: v.id("codingQuestions"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError("User not authenticated");
    }

    // Validate at least one public testcase exists
    const publicTestCases = args.testCases.filter(
      (tc) => tc.visibility === "public"
    );
    if (publicTestCases.length === 0) {
      throw new ConvexError("At least one public testcase is required");
    }

    // Validate default language is in allowed languages
    if (!args.languageIdsAllowed.includes(args.defaultLanguageId)) {
      throw new ConvexError(
        "Default language must be in allowed languages list"
      );
    }

    // Validate time and memory limits
    if (args.timeLimitSeconds <= 0) {
      throw new ConvexError("Time limit must be positive");
    }
    if (args.memoryLimitMb <= 0) {
      throw new ConvexError("Memory limit must be positive");
    }

    // Validate tags (remove empty strings and trim)
    const validTags = args.tags
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    // Create the question
    const questionId = await ctx.db.insert("codingQuestions", {
      title: args.title,
      promptRichText: args.promptRichText,
      authorId: userId,
      upvotes: 0,
      downvotes: 0,
      difficulty: args.difficulty,
      tags: validTags,
      languageIdsAllowed: args.languageIdsAllowed,
      defaultLanguageId: args.defaultLanguageId,
      timeLimitSeconds: args.timeLimitSeconds,
      memoryLimitMb: args.memoryLimitMb,
      outputComparison: args.outputComparison,
      starterCode: args.starterCode,
    });

    // Create testcases with order
    for (let i = 0; i < args.testCases.length; i++) {
      const tc = args.testCases[i];
      await ctx.db.insert("codingTestCases", {
        questionId,
        visibility: tc.visibility,
        stdin: tc.stdin,
        expectedStdout: tc.expectedStdout,
        name: tc.name,
        order: i,
      });
    }

    return questionId;
  },
});

/**
 * Update an existing coding question.
 * Updates question metadata and optionally replaces all testcases.
 */
export const updateCodingQuestion = mutation({
  args: {
    questionId: v.id("codingQuestions"),
    title: v.optional(v.string()),
    promptRichText: v.optional(v.string()),
    difficulty: v.optional(
      v.union(v.literal("easy"), v.literal("medium"), v.literal("hard"))
    ),
    tags: v.optional(v.array(v.string())),
    languageIdsAllowed: v.optional(v.array(v.number())),
    defaultLanguageId: v.optional(v.number()),
    timeLimitSeconds: v.optional(v.number()),
    memoryLimitMb: v.optional(v.number()),
    outputComparison: v.optional(outputComparisonValidator),
    starterCode: v.optional(v.record(v.string(), v.string())),
    // If provided, replaces ALL testcases
    testCases: v.optional(v.array(testCaseValidator)),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError("User not authenticated");
    }

    const question = await ctx.db.get(args.questionId);
    if (!question) {
      throw new ConvexError("Question not found");
    }

    // Only author can update
    if (question.authorId !== userId) {
      throw new ConvexError("Only the author can update this question");
    }

    // Validate testcases if provided
    if (args.testCases !== undefined) {
      const publicTestCases = args.testCases.filter(
        (tc) => tc.visibility === "public"
      );
      if (publicTestCases.length === 0) {
        throw new ConvexError("At least one public testcase is required");
      }
    }

    // Validate default language if both are provided
    const languageIds = args.languageIdsAllowed ?? question.languageIdsAllowed;
    const defaultLang = args.defaultLanguageId ?? question.defaultLanguageId;
    if (!languageIds.includes(defaultLang)) {
      throw new ConvexError(
        "Default language must be in allowed languages list"
      );
    }

    // Validate limits if provided
    if (args.timeLimitSeconds !== undefined && args.timeLimitSeconds <= 0) {
      throw new ConvexError("Time limit must be positive");
    }
    if (args.memoryLimitMb !== undefined && args.memoryLimitMb <= 0) {
      throw new ConvexError("Memory limit must be positive");
    }

    // Build update object (only include provided fields)
    const updates: Record<string, unknown> = {};
    if (args.title !== undefined) updates.title = args.title;
    if (args.promptRichText !== undefined)
      updates.promptRichText = args.promptRichText;
    if (args.difficulty !== undefined) updates.difficulty = args.difficulty;
    if (args.tags !== undefined) {
      updates.tags = args.tags
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);
    }
    if (args.languageIdsAllowed !== undefined)
      updates.languageIdsAllowed = args.languageIdsAllowed;
    if (args.defaultLanguageId !== undefined)
      updates.defaultLanguageId = args.defaultLanguageId;
    if (args.timeLimitSeconds !== undefined)
      updates.timeLimitSeconds = args.timeLimitSeconds;
    if (args.memoryLimitMb !== undefined)
      updates.memoryLimitMb = args.memoryLimitMb;
    if (args.outputComparison !== undefined)
      updates.outputComparison = args.outputComparison;
    if (args.starterCode !== undefined) updates.starterCode = args.starterCode;

    // Update question if there are changes
    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(args.questionId, updates);
    }

    // Replace testcases if provided
    if (args.testCases !== undefined) {
      // Delete existing testcases
      const existingTestCases = await ctx.db
        .query("codingTestCases")
        .withIndex("by_questionId", (q) => q.eq("questionId", args.questionId))
        .collect();

      for (const tc of existingTestCases) {
        await ctx.db.delete(tc._id);
      }

      // Create new testcases
      for (let i = 0; i < args.testCases.length; i++) {
        const tc = args.testCases[i];
        await ctx.db.insert("codingTestCases", {
          questionId: args.questionId,
          visibility: tc.visibility,
          stdin: tc.stdin,
          expectedStdout: tc.expectedStdout,
          name: tc.name,
          order: i,
        });
      }
    }

    return null;
  },
});

/**
 * Delete a coding question and all its testcases.
 */
export const deleteCodingQuestion = mutation({
  args: {
    questionId: v.id("codingQuestions"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError("User not authenticated");
    }

    const question = await ctx.db.get(args.questionId);
    if (!question) {
      throw new ConvexError("Question not found");
    }

    // Only author can delete
    if (question.authorId !== userId) {
      throw new ConvexError("Only the author can delete this question");
    }

    // Delete all testcases
    const testCases = await ctx.db
      .query("codingTestCases")
      .withIndex("by_questionId", (q) => q.eq("questionId", args.questionId))
      .collect();

    for (const tc of testCases) {
      await ctx.db.delete(tc._id);
    }

    // Delete the question
    await ctx.db.delete(args.questionId);

    return null;
  },
});
