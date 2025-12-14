import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";

/**
 * Trigger code execution for a personalized coding submission.
 * This action sends the submission to the code-exec server for processing.
 */
export const triggerPersonalizedCodeExecution = internalAction({
  args: {
    submissionId: v.id("personalizedCodingSubmissions"),
    questionId: v.id("personalizedCodingQuestions"),
    languageId: v.number(),
    sourceCode: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const CODE_EXEC_URL = process.env.CODE_EXEC_URL;
    if (!CODE_EXEC_URL) {
      console.error("CODE_EXEC_URL is not set - cannot trigger code execution");
      await ctx.runMutation(
        internal.mutations.personalizedCodingSubmissions
          .updatePersonalizedCodingSubmissionResult,
        { submissionId: args.submissionId, status: "error" as const }
      );
      return null;
    }

    const judgeUrl = `${CODE_EXEC_URL.replace(/\/+$/, "")}/v1/judge-question`;

    try {
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
          submissionKind: "personalized" as const,
        }),
      });

      if (response.status !== 202 && !response.ok) {
        const errorText = await response.text();
        console.error(
          `Personalized code execution failed to start: ${response.status} - ${errorText}`
        );
        await ctx.runMutation(
          internal.mutations.personalizedCodingSubmissions
            .updatePersonalizedCodingSubmissionResult,
          { submissionId: args.submissionId, status: "error" as const }
        );
      }
    } catch (err) {
      console.error("Failed to call code-exec server:", err);
      await ctx.runMutation(
        internal.mutations.personalizedCodingSubmissions
          .updatePersonalizedCodingSubmissionResult,
        { submissionId: args.submissionId, status: "error" as const }
      );
    }

    return null;
  },
});
