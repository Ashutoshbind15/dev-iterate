import { mutation, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import { internal } from "../_generated/api";
import { Id, Doc } from "../_generated/dataModel";

/**
 * Create a personalized coding question submission request
 * This records the request and triggers the Kestra workflow
 * Uses existing codingUserRemarks from the database as analysis
 *
 * Duplicate prevention: Only proceeds if there are new remarks not already
 * in pending or completed submissions (similar to weaknessAnalysisExecutions pattern)
 */
export const createPersonalizedCodingQuestionSubmission = mutation({
  args: {},
  returns: v.id("personalizedCodingQuestionSubmissions"),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError("User not authenticated");
    }

    // Get user remarks and pending/completed submissions in parallel
    const [userRemarks, pendingSubmissions, completedSubmissions] =
      await Promise.all([
        ctx.db
          .query("codingUserRemarks")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .order("desc")
          .take(10),
        ctx.db
          .query("personalizedCodingQuestionSubmissions")
          .withIndex("by_user_and_status", (q) =>
            q.eq("userId", userId).eq("status", "pending")
          )
          .collect(),
        ctx.db
          .query("personalizedCodingQuestionSubmissions")
          .withIndex("by_user_and_status", (q) =>
            q.eq("userId", userId).eq("status", "completed")
          )
          .collect(),
      ]);

    if (userRemarks.length === 0) {
      throw new ConvexError(
        "No analysis data found. Please submit some coding solutions first to generate personalized coding questions."
      );
    }

    // Build set of excluded remark IDs from all pending and completed submissions
    const excludedRemarkIds = new Set(
      [...pendingSubmissions, ...completedSubmissions].flatMap(
        (s) => s.remarkIds
      )
    );

    // Filter to only new remarks not in the excluded set
    const newRemarks = userRemarks.filter(
      (remark) => !excludedRemarkIds.has(remark._id)
    );

    // Only proceed if there are new remarks to process
    if (newRemarks.length === 0) {
      throw new ConvexError(
        "No new analysis data available. Submit more coding solutions to generate new personalized questions."
      );
    }

    // Combine new remarks into comma-separated analysis string
    const analysis = newRemarks
      .map((remark: Doc<"codingUserRemarks">) => remark.remark)
      .join(", ");

    // Extract remark IDs
    const remarkIds = newRemarks.map((remark) => remark._id);

    // Create submission record
    const submissionId = await ctx.db.insert(
      "personalizedCodingQuestionSubmissions",
      {
        userId,
        remarkIds,
        analysis,
        status: "pending" as const,
        createdAt: Date.now(),
      }
    );

    // Trigger Kestra workflow (fire-and-forget)
    await ctx.scheduler.runAfter(
      0,
      internal.actionsdir.personalizedCodingQuestions.triggerCodingQuestionGeneration,
      {
        userId,
        submissionId,
        analysis,
      }
    );

    return submissionId;
  },
});

// Test case validator for incoming data
const testCaseValidator = v.object({
  visibility: v.union(v.literal("public"), v.literal("hidden")),
  stdin: v.string(),
  expectedStdout: v.string(),
  name: v.optional(v.string()),
});

// Question validator for incoming data from Kestra
const questionValidator = v.object({
  title: v.string(),
  promptRichText: v.string(),
  difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
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
  testCases: v.array(testCaseValidator),
});

/**
 * Internal mutation to save generated personalized coding questions
 * Called from HTTP action after Kestra workflow completes
 */
export const savePersonalizedCodingQuestions = internalMutation({
  args: {
    submissionId: v.id("personalizedCodingQuestionSubmissions"),
    questions: v.array(questionValidator),
  },
  returns: v.array(v.id("personalizedCodingQuestions")),
  handler: async (ctx, args) => {
    // Verify submission exists and is pending
    const submission = await ctx.db.get(args.submissionId);
    if (!submission) {
      throw new ConvexError("Submission not found");
    }

    if (submission.status !== "pending") {
      throw new ConvexError(
        `Submission is already ${submission.status}, cannot save questions`
      );
    }

    const questionIds: Array<Id<"personalizedCodingQuestions">> = [];
    const createdAt = Date.now();

    // Insert all questions
    for (const question of args.questions) {
      // Validate tags (remove empty strings and trim)
      const validTags = question.tags
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      // Insert the question
      const questionId = await ctx.db.insert("personalizedCodingQuestions", {
        userId: submission.userId,
        submissionId: args.submissionId,
        title: question.title,
        promptRichText: question.promptRichText,
        difficulty: question.difficulty,
        tags: validTags,
        languageIdsAllowed: question.languageIdsAllowed,
        defaultLanguageId: question.defaultLanguageId,
        timeLimitSeconds: question.timeLimitSeconds,
        memoryLimitMb: question.memoryLimitMb,
        outputComparison: question.outputComparison,
        starterCode: question.starterCode,
        createdAt,
      });

      // Insert testcases for this question
      for (let i = 0; i < question.testCases.length; i++) {
        const tc = question.testCases[i];
        await ctx.db.insert("personalizedCodingTestCases", {
          questionId,
          visibility: tc.visibility,
          stdin: tc.stdin,
          expectedStdout: tc.expectedStdout,
          name: tc.name,
          order: i,
        });
      }

      questionIds.push(questionId);
    }

    // Update submission status to completed
    await ctx.db.patch(args.submissionId, {
      status: "completed" as const,
      completedAt: Date.now(),
    });

    return questionIds;
  },
});

/**
 * Internal mutation to mark submission as failed
 */
export const markSubmissionFailed = internalMutation({
  args: {
    submissionId: v.id("personalizedCodingQuestionSubmissions"),
    errorMessage: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const submission = await ctx.db.get(args.submissionId);
    if (!submission) {
      throw new ConvexError("Submission not found");
    }

    await ctx.db.patch(args.submissionId, {
      status: "failed" as const,
      completedAt: Date.now(),
      errorMessage: args.errorMessage,
    });

    return null;
  },
});

