import { httpAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";

// TODO: Add M2M auth token validation later (see other httpactions for pattern)

/**
 * HTTP action to get all testcases for a coding question (for judge processing).
 * Returns both public and hidden testcases + question settings.
 *
 * POST /coding/testcases
 * Body: { questionId: string }
 */
export const getTestCasesForJudge = httpAction(async (ctx, req) => {
  const body = await req.json();
  const { questionId } = body ?? {};

  if (!questionId || typeof questionId !== "string") {
    return new Response(
      JSON.stringify({ error: "Missing required field: questionId" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Get question settings
  const question = await ctx.runQuery(
    internal.queries.codingQuestions.getQuestionForJudge,
    { questionId: questionId as Id<"codingQuestions"> }
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

  // Get all testcases (public + hidden)
  const testCases = await ctx.runQuery(
    internal.queries.codingQuestions.getAllTestCases,
    { questionId: questionId as Id<"codingQuestions"> }
  );

  return new Response(
    JSON.stringify({
      question: {
        _id: question._id,
        timeLimitSeconds: question.timeLimitSeconds,
        memoryLimitMb: question.memoryLimitMb,
        outputComparison: question.outputComparison,
      },
      testCases: testCases.map((tc) => ({
        _id: tc._id,
        visibility: tc.visibility,
        stdin: tc.stdin,
        expectedStdout: tc.expectedStdout,
        name: tc.name,
        order: tc.order,
      })),
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
});

/**
 * HTTP action to update a submission's result after judge processing.
 *
 * POST /coding/submission-result
 * Body: {
 *   submissionId: string,
 *   status: "running" | "passed" | "failed" | "error",
 *   passedCount?: number,
 *   totalCount?: number,
 *   firstFailureIndex?: number,
 *   firstFailure?: { stdin?, actualOutput?, expectedOutput?, errorMessage? },
 *   stdout?: string,
 *   stderr?: string,
 *   compileOutput?: string,
 *   durationMs?: number,
 * }
 */
export const updateSubmissionResult = httpAction(async (ctx, req) => {
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

  if (!submissionId || typeof submissionId !== "string") {
    return new Response(
      JSON.stringify({ error: "Missing required field: submissionId" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const validStatuses = ["running", "passed", "failed", "error"];
  if (!status || !validStatuses.includes(status)) {
    return new Response(
      JSON.stringify({
        error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  await ctx.runMutation(
    internal.mutations.codingSubmissions.updateCodingSubmissionResult,
    {
      submissionId: submissionId as Id<"codingSubmissions">,
      status: status as "running" | "passed" | "failed" | "error",
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

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

/**
 * HTTP action to mark a submission as running.
 *
 * POST /coding/submission-running
 * Body: { submissionId: string }
 */
export const markSubmissionRunning = httpAction(async (ctx, req) => {
  const body = await req.json();
  const { submissionId } = body ?? {};

  if (!submissionId || typeof submissionId !== "string") {
    return new Response(
      JSON.stringify({ error: "Missing required field: submissionId" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  await ctx.runMutation(
    internal.mutations.codingSubmissions.markSubmissionRunning,
    { submissionId: submissionId as Id<"codingSubmissions"> }
  );

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

