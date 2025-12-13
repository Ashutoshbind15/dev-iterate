import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";

/**
 * Trigger code execution on the code-exec server.
 * The code-exec server will:
 * 1. Mark submission as "running"
 * 2. Fetch testcases from Convex
 * 3. Run the judge
 * 4. Update the submission result via HTTP back to Convex
 *
 * If we can't reach the code-exec server, we update the submission to "error" state.
 */
export const triggerCodeExecution = internalAction({
  args: {
    submissionId: v.id("codingSubmissions"),
    questionId: v.id("codingQuestions"),
    languageId: v.number(),
    sourceCode: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const CODE_EXEC_URL = process.env.CODE_EXEC_URL;
    if (!CODE_EXEC_URL) {
      console.error("CODE_EXEC_URL is not set - cannot trigger code execution");
      // Update submission to error state
      await ctx.runMutation(
        internal.mutations.codingSubmissions.updateCodingSubmissionResult,
        {
          submissionId: args.submissionId,
          status: "error" as const,
        }
      );
      return null;
    }

    const judgeUrl = `${CODE_EXEC_URL.replace(/\/+$/, "")}/v1/judge-question`;

    try {
      // Fire-and-forget: we only wait for the code-exec server to acknowledge
      // the request and mark the submission as "running". The actual execution
      // happens in the background and results are pushed back via HTTP callbacks.
      const response = await fetch(judgeUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questionId: args.questionId,
          submissionId: args.submissionId,
          languageId: args.languageId,
          sourceCode: args.sourceCode,
        }),
      });

      if (response.status === 202) {
        // Success - submission accepted and queued for execution
        const result = await response.json();
        console.log(
          `Code execution queued for submission ${args.submissionId}:`,
          result.message
        );
      } else if (!response.ok) {
        // Server returned an error before starting execution
        const errorText = await response.text();
        console.error(
          `Code execution failed to start: ${response.status} - ${errorText}`
        );
        // Update submission to error state (server might not have done this)
        await ctx.runMutation(
          internal.mutations.codingSubmissions.updateCodingSubmissionResult,
          {
            submissionId: args.submissionId,
            status: "error" as const,
          }
        );
      }
    } catch (err) {
      // Network error - code-exec server is unreachable
      console.error("Failed to call code-exec server:", err);
      // Update submission to error state
      await ctx.runMutation(
        internal.mutations.codingSubmissions.updateCodingSubmissionResult,
        {
          submissionId: args.submissionId,
          status: "error" as const,
        }
      );
    }

    return null;
  },
});
