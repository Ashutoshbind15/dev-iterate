import { mutation, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import { internal } from "../_generated/api";

/**
 * Create a new coding submission.
 * Creates a submission with "queued" status and schedules the code execution action.
 * The action will call the code-exec server which will update the submission status
 * via HTTP callback. Client can subscribe to the submission for real-time updates.
 */
export const createCodingSubmission = mutation({
  args: {
    questionId: v.id("codingQuestions"),
    languageId: v.number(),
    sourceCode: v.string(),
  },
  returns: v.id("codingSubmissions"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError("User not authenticated");
    }

    // Validate question exists
    const question = await ctx.db.get(args.questionId);
    if (!question) {
      throw new ConvexError("Question not found");
    }

    // Validate language is allowed
    if (!question.languageIdsAllowed.includes(args.languageId)) {
      throw new ConvexError("Language not allowed for this question");
    }

    // Validate source code is not empty
    if (args.sourceCode.trim().length === 0) {
      throw new ConvexError("Source code cannot be empty");
    }

    // Create submission with queued status
    const submissionId = await ctx.db.insert("codingSubmissions", {
      questionId: args.questionId,
      userId,
      languageId: args.languageId,
      sourceCode: args.sourceCode,
      status: "queued" as const,
    });

    // Schedule the code execution action
    // This runs asynchronously - the code-exec server will update the submission
    // status via HTTP callback when done
    await ctx.scheduler.runAfter(
      0, // Run immediately
      internal.actionsdir.codeExecution.triggerCodeExecution,
      {
        submissionId,
        questionId: args.questionId,
        languageId: args.languageId,
        sourceCode: args.sourceCode,
      }
    );

    return submissionId;
  },
});

// First failure details validator (for internal use)
const firstFailureValidator = v.object({
  stdin: v.optional(v.string()),
  actualOutput: v.optional(v.string()),
  expectedOutput: v.optional(v.string()),
  errorMessage: v.optional(v.string()),
});

/**
 * Update a submission's status and results.
 * This is an INTERNAL mutation - only callable from trusted backend (judge integration).
 * Should NOT be exposed to clients.
 */
export const updateCodingSubmissionResult = internalMutation({
  args: {
    submissionId: v.id("codingSubmissions"),
    status: v.union(
      v.literal("running"),
      v.literal("passed"),
      v.literal("failed"),
      v.literal("error")
    ),
    passedCount: v.optional(v.number()),
    totalCount: v.optional(v.number()),
    firstFailureIndex: v.optional(v.number()),
    firstFailure: v.optional(firstFailureValidator),
    stdout: v.optional(v.string()),
    stderr: v.optional(v.string()),
    compileOutput: v.optional(v.string()),
    durationMs: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const submission = await ctx.db.get(args.submissionId);
    if (!submission) {
      throw new ConvexError("Submission not found");
    }

    // Build update object
    const updates: Record<string, unknown> = {
      status: args.status,
    };

    if (args.passedCount !== undefined) updates.passedCount = args.passedCount;
    if (args.totalCount !== undefined) updates.totalCount = args.totalCount;
    if (args.firstFailureIndex !== undefined)
      updates.firstFailureIndex = args.firstFailureIndex;
    if (args.firstFailure !== undefined)
      updates.firstFailure = args.firstFailure;
    if (args.stdout !== undefined) updates.stdout = args.stdout;
    if (args.stderr !== undefined) updates.stderr = args.stderr;
    if (args.compileOutput !== undefined)
      updates.compileOutput = args.compileOutput;
    if (args.durationMs !== undefined) updates.durationMs = args.durationMs;

    await ctx.db.patch(args.submissionId, updates);

    return null;
  },
});

/**
 * Mark a submission as running.
 * Called when the judge starts processing the submission.
 */
export const markSubmissionRunning = internalMutation({
  args: {
    submissionId: v.id("codingSubmissions"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const submission = await ctx.db.get(args.submissionId);
    if (!submission) {
      throw new ConvexError("Submission not found");
    }

    await ctx.db.patch(args.submissionId, {
      status: "running" as const,
    });

    return null;
  },
});
