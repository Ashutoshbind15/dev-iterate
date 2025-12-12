import { httpAction } from "../_generated/server";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";

export const savePersonalizedQuestions = httpAction(async (ctx, req) => {
  // TODO: add your m2m token auth like you mentioned in getFeed
  const body = await req.json();
  const { submissionId, questions, errorMessage } = body ?? {};

  if (!submissionId) {
    return new Response(
      JSON.stringify({ error: "Missing required field: submissionId" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // If there's an error message, mark submission as failed
  if (errorMessage) {
    await ctx.runMutation(
      internal.mutations.personalizedQuestions.markSubmissionFailed,
      {
        submissionId: submissionId as Id<"personalizedQuestionSubmissions">,
        errorMessage,
      }
    );

    return new Response(
      JSON.stringify({ ok: true, message: "Submission marked as failed" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Validate questions array
  if (!questions || !Array.isArray(questions)) {
    return new Response(
      JSON.stringify({ error: "Missing or invalid questions array" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  if (questions.length === 0) {
    return new Response(
      JSON.stringify({ error: "Questions array cannot be empty" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const questionIds = await ctx.runMutation(
      internal.mutations.personalizedQuestions.savePersonalizedQuestions,
      {
        submissionId: submissionId as Id<"personalizedQuestionSubmissions">,
        questions,
      }
    );

    return new Response(
      JSON.stringify({
        ok: true,
        message: "Questions saved successfully",
        questionIds,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to save questions";

    // Try to mark submission as failed
    try {
      await ctx.runMutation(
        internal.mutations.personalizedQuestions.markSubmissionFailed,
        {
          submissionId: submissionId as Id<"personalizedQuestionSubmissions">,
          errorMessage,
        }
      );
    } catch (markError) {
      console.error("Failed to mark submission as failed:", markError);
    }

    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});

