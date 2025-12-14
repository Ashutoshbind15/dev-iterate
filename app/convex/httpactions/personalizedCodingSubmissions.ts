import { httpAction } from "../_generated/server";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";

/**
 * HTTP action to get testcases for judge (for personalized coding questions).
 * Called by the code-exec server when processing a personalized submission.
 */
export const getPersonalizedTestCasesForJudge = httpAction(async (ctx, req) => {
  const body = await req.json();
  const { questionId } = body ?? {};

  if (!questionId) {
    return new Response(
      JSON.stringify({ error: "Missing required field: questionId" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const testCases = await ctx.runQuery(
    internal.queries.personalizedCodingQuestions.getAllPersonalizedTestCases,
    {
      questionId: questionId as Id<"personalizedCodingQuestions">,
    }
  );

  const question = await ctx.runQuery(
    internal.queries.personalizedCodingQuestions.getPersonalizedQuestionForJudge,
    {
      questionId: questionId as Id<"personalizedCodingQuestions">,
    }
  );

  if (!question) {
    return new Response(
      JSON.stringify({ error: "Question not found" }),
      {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  return new Response(
    JSON.stringify({
      testCases,
      question,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
});

/**
 * HTTP action to update personalized submission result.
 * Called by the code-exec server after processing.
 */
export const updatePersonalizedSubmissionResult = httpAction(async (ctx, req) => {
  const body = await req.json();
  const {
    submissionId,
    status,
    passedCount,
    totalCount,
    firstFailureIndex,
    firstFailure,
    stdout,
    stderr,
    compileOutput,
    durationMs,
  } = body ?? {};

  if (!submissionId || !status) {
    return new Response(
      JSON.stringify({ error: "Missing required fields: submissionId, status" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  await ctx.runMutation(
    internal.mutations.personalizedCodingSubmissions.updatePersonalizedCodingSubmissionResult,
    {
      submissionId: submissionId as Id<"personalizedCodingSubmissions">,
      status,
      passedCount,
      totalCount,
      firstFailureIndex,
      firstFailure,
      stdout,
      stderr,
      compileOutput,
      durationMs,
    }
  );

  return new Response(
    JSON.stringify({ ok: true }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
});

/**
 * HTTP action to mark personalized submission as running.
 * Called by the code-exec server when it starts processing.
 */
export const markPersonalizedSubmissionRunning = httpAction(async (ctx, req) => {
  const body = await req.json();
  const { submissionId } = body ?? {};

  if (!submissionId) {
    return new Response(
      JSON.stringify({ error: "Missing required field: submissionId" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  await ctx.runMutation(
    internal.mutations.personalizedCodingSubmissions.markPersonalizedSubmissionRunning,
    {
      submissionId: submissionId as Id<"personalizedCodingSubmissions">,
    }
  );

  return new Response(
    JSON.stringify({ ok: true }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
});

