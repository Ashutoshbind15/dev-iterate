import { mutation, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";

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
 *
 * Also triggers weakness analysis after every 10 completed submissions.
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

    // Only trigger weakness analysis for terminal states (passed/failed/error)
    const isTerminalStatus = ["passed", "failed", "error"].includes(
      args.status
    );
    if (!isTerminalStatus) {
      return null;
    }

    const userId = submission.userId;

    // Check if we should trigger weakness analysis (every 10 completed submissions)
    const completedSubmissions = await ctx.db
      .query("codingSubmissions")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    // Filter to only completed submissions (passed/failed/error)
    const terminalSubmissions = completedSubmissions.filter((s) =>
      ["passed", "failed", "error"].includes(s.status)
    );

    // We only want to trigger when there are 10 *unanalyzed* terminal submissions.
    // IMPORTANT: don't slice to 10 *before* filtering out already-analyzed ones,
    // otherwise a single previously analyzed submission in the most-recent 10
    // will block analysis forever.
    if (terminalSubmissions.length >= 10) {
      // Get all executions (pending and completed) in parallel
      const [pendingExecutions, completedExecutions] = await Promise.all([
        ctx.db
          .query("codingWeaknessAnalysisExecutions")
          .withIndex("by_user_and_status", (q) =>
            q.eq("userId", userId).eq("status", "pending")
          )
          .collect(),
        ctx.db
          .query("codingWeaknessAnalysisExecutions")
          .withIndex("by_user_and_status", (q) =>
            q.eq("userId", userId).eq("status", "completed")
          )
          .collect(),
      ]);

      // Build sets of excluded submission IDs
      const excludedSubmissionIds = new Set(
        [...pendingExecutions, ...completedExecutions].flatMap(
          (e) => e.submissionIds
        )
      );

      // Filter to only unanalyzed submissions (keep overall ordering)
      const unanalyzedTerminalSubmissions = terminalSubmissions.filter(
        (s) => !excludedSubmissionIds.has(s._id)
      );

      // Take the 10 most recent unanalyzed submissions
      const submissionsToAnalyze = unanalyzedTerminalSubmissions.slice(0, 10);

      console.log("[codingSubmissions] weakness analysis gate", {
        terminalCount: terminalSubmissions.length,
        excludedCount: excludedSubmissionIds.size,
        unanalyzedTerminalCount: unanalyzedTerminalSubmissions.length,
        submissionsToAnalyzeCount: submissionsToAnalyze.length,
      });

      // Only proceed if we have 10 unanalyzed submissions
      if (submissionsToAnalyze.length >= 10) {
        // Fetch question details and build submission data in parallel
        const submissionData = await Promise.all(
          submissionsToAnalyze.map(async (sub) => {
            const question = await ctx.db.get(sub.questionId);
            if (!question) return null;

            // Sanitize firstFailure to avoid JSON parsing issues with control chars
            let sanitizedFailure: typeof sub.firstFailure = undefined;
            if (sub.firstFailure) {
              sanitizedFailure = {
                // Only include error message, not raw outputs which may have newlines
                errorMessage: sub.firstFailure.errorMessage,
              };
              // Add a simplified failure description if no error message
              if (
                !sanitizedFailure.errorMessage &&
                sub.firstFailure.actualOutput
              ) {
                sanitizedFailure.errorMessage = "Wrong output";
              }
            }

            return {
              submissionId: sub._id.toString(),
              questionTitle: question.title,
              questionTags: question.tags,
              difficulty: question.difficulty,
              languageId: sub.languageId,
              status: sub.status as "passed" | "failed" | "error",
              passedCount: sub.passedCount,
              totalCount: sub.totalCount,
              firstFailure: sanitizedFailure,
            };
          })
        );

        const validSubmissions = submissionData.filter(
          (s): s is NonNullable<typeof s> => s !== null
        );

        console.log("[codingSubmissions] weakness analysis submissionData", {
          submissionDataCount: submissionData.length,
          validSubmissionsCount: validSubmissions.length,
        });

        if (validSubmissions.length >= 10) {
          const submissionIds = submissionsToAnalyze.map((s) => s._id) as Array<
            Id<"codingSubmissions">
          >;

          // Create execution record and get past remarks in parallel
          const [, pastRemarks] = await Promise.all([
            ctx.db.insert("codingWeaknessAnalysisExecutions", {
              userId,
              submissionIds,
              status: "pending" as const,
              triggeredAt: Date.now(),
            }),
            ctx.db
              .query("codingUserRemarks")
              .withIndex("by_user", (q) => q.eq("userId", userId))
              .order("desc")
              .take(10)
              .then((remarks) => remarks.map((r) => r.remark).join(" | ")),
          ]);

          // Trigger Kestra flow (fire-and-forget)
          await ctx.scheduler.runAfter(
            0,
            internal.actionsdir.codingWeakness.triggerCodingWeaknessAnalysis,
            {
              userId,
              submissions: validSubmissions.slice(0, 10),
              pastRemarks: pastRemarks || "",
            }
          );
        }
      }
    }

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
