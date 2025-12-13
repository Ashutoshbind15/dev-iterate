import "dotenv/config";
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { z } from "zod";
import { randomUUID } from "crypto";
import { loadEnv } from "./env.js";
import {
  JudgeRequestSchema,
  JudgeQuestionRequestSchema,
  ConvexTestCasesResponseSchema,
  type JudgeResponse,
  type JudgeQuestionResponse,
  type JudgeQuestionFirstFailure,
  type ConvexTestCasesResponse,
} from "./contracts.js";
import { fetchTextWithTimeout } from "./http.js";
import {
  Judge0Client,
  isCompileError,
  isRuntimeError,
  isTimeLimitExceeded,
  isAccepted,
  type Judge0Result,
} from "./judge0/client.js";
import { compareOutputs, type CompareOptions } from "./judge0/compare.js";

const env = loadEnv();

// Initialize Judge0 client
const judge0 = new Judge0Client({
  baseUrl: env.JUDGE0_BASE_URL,
  apiKey: env.JUDGE0_API_KEY || undefined,
  timeoutMs: env.REQUEST_TIMEOUT_MS,
  pollIntervalMs: 500,
  maxPollAttempts: Math.ceil(env.REQUEST_TIMEOUT_MS / 500),
});

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));

app.get("/healthz", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.get("/readyz", async (_req, res) => {
  const base = env.JUDGE0_BASE_URL.replace(/\/+$/, "");
  const headers: Record<string, string> = {};
  if (env.JUDGE0_API_KEY) headers["X-Auth-Token"] = env.JUDGE0_API_KEY;

  // `/languages` is a small, unauthenticated endpoint on default Judge0 CE setups.
  const probe = await fetchTextWithTimeout(`${base}/languages`, {
    timeoutMs: env.REQUEST_TIMEOUT_MS,
    headers,
  });

  if (!probe.ok) {
    res.status(503).json({
      ok: false,
      judge0: { reachable: false, status: probe.status, error: probe.error },
    });
    return;
  }

  res.status(200).json({ ok: true });
});

app.post("/v1/judge", async (req, res) => {
  const requestId = (req.headers["x-request-id"] as string) || randomUUID();
  const startTime = Date.now();

  const parsed = JudgeRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      status: "error",
      message: "Invalid request body",
      details: { issues: parsed.error.issues },
    });
    return;
  }

  const { sourceCode, testCases, languageId, limits } = parsed.data;

  // Validation: source code size
  if (Buffer.byteLength(sourceCode, "utf8") > env.MAX_SOURCE_BYTES) {
    res.status(400).json({
      status: "error",
      message: "sourceCode exceeds MAX_SOURCE_BYTES",
      details: { maxBytes: env.MAX_SOURCE_BYTES },
    });
    return;
  }

  // Validation: testcase count
  if (testCases.length > env.MAX_TESTCASES) {
    res.status(400).json({
      status: "error",
      message: "testCases exceeds MAX_TESTCASES",
      details: { max: env.MAX_TESTCASES },
    });
    return;
  }

  // Normalize source code newlines
  const normalizedSource = sourceCode.replace(/\r\n/g, "\n");

  let passedCount = 0;

  // Sequential fail-fast execution
  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const normalizedStdin = tc.stdin.replace(/\r\n/g, "\n");

    let result: Judge0Result;
    try {
      result = await judge0.submitAndWait({
        sourceCode: normalizedSource,
        languageId,
        stdin: normalizedStdin,
        cpuTimeLimit: limits?.cpuTimeSeconds,
        memoryLimit: limits?.memoryMb ? limits.memoryMb * 1024 : undefined, // Convert MB to KB
        wallTimeLimit: limits?.wallTimeSeconds,
      });
    } catch (err) {
      // Judge0 communication error
      const durationMs = Date.now() - startTime;
      console.error(`[${requestId}] Judge0 error on testcase ${i}:`, err);

      const response: JudgeResponse = {
        status: "error",
        message:
          err instanceof Error ? err.message : "Judge0 communication error",
        details: { requestId, testcaseIndex: i },
      };
      res.status(502).json(response);
      return;
    }

    // Check for compile error
    if (isCompileError(result.status.id)) {
      const durationMs = Date.now() - startTime;
      console.log(
        `[${requestId}] Compile error | testcases: ${testCases.length} | duration: ${durationMs}ms`
      );

      const response: JudgeResponse = {
        status: "failed",
        summary: { passedCount: 0, totalCount: testCases.length, durationMs },
        firstFailure: {
          index: 0,
          testCase: {
            stdin: tc.stdin,
            expectedStdout: tc.expectedStdout,
            name: tc.name,
          },
          actualStdout: result.stdout ?? "",
          stderr: result.stderr,
          compileOutput: result.compile_output,
          judge0: {
            status: result.status,
            time: result.time,
            memory: result.memory,
          },
        },
      };
      res.status(200).json(response);
      return;
    }

    // Check for runtime error
    if (isRuntimeError(result.status.id)) {
      const durationMs = Date.now() - startTime;
      console.log(
        `[${requestId}] Runtime error at ${i} | passed: ${passedCount}/${testCases.length} | duration: ${durationMs}ms`
      );

      const response: JudgeResponse = {
        status: "failed",
        summary: { passedCount, totalCount: testCases.length, durationMs },
        firstFailure: {
          index: i,
          testCase: {
            stdin: tc.stdin,
            expectedStdout: tc.expectedStdout,
            name: tc.name,
          },
          actualStdout: result.stdout ?? "",
          stderr: result.stderr,
          compileOutput: result.compile_output,
          judge0: {
            status: result.status,
            time: result.time,
            memory: result.memory,
            exitCode: result.exit_code,
          },
        },
      };
      res.status(200).json(response);
      return;
    }

    // Check for TLE
    if (isTimeLimitExceeded(result.status.id)) {
      const durationMs = Date.now() - startTime;
      console.log(
        `[${requestId}] TLE at ${i} | passed: ${passedCount}/${testCases.length} | duration: ${durationMs}ms`
      );

      const response: JudgeResponse = {
        status: "failed",
        summary: { passedCount, totalCount: testCases.length, durationMs },
        firstFailure: {
          index: i,
          testCase: {
            stdin: tc.stdin,
            expectedStdout: tc.expectedStdout,
            name: tc.name,
          },
          actualStdout: result.stdout ?? "",
          stderr: result.stderr,
          compileOutput: result.compile_output,
          judge0: {
            status: result.status,
            time: result.time,
            memory: result.memory,
          },
        },
      };
      res.status(200).json(response);
      return;
    }

    // Compare output (for accepted or other statuses where we got stdout)
    const actualStdout = result.stdout ?? "";
    const comparison = compareOutputs(actualStdout, tc.expectedStdout, {
      trimOutputs: true,
      normalizeWhitespace: false,
      caseSensitive: true,
    });

    if (!comparison.match) {
      const durationMs = Date.now() - startTime;
      console.log(
        `[${requestId}] Wrong answer at ${i} | passed: ${passedCount}/${testCases.length} | duration: ${durationMs}ms`
      );

      const response: JudgeResponse = {
        status: "failed",
        summary: { passedCount, totalCount: testCases.length, durationMs },
        firstFailure: {
          index: i,
          testCase: {
            stdin: tc.stdin,
            expectedStdout: tc.expectedStdout,
            name: tc.name,
          },
          actualStdout,
          stderr: result.stderr,
          compileOutput: result.compile_output,
          judge0: {
            status: result.status,
            time: result.time,
            memory: result.memory,
          },
        },
      };
      res.status(200).json(response);
      return;
    }

    // Test passed
    passedCount++;
  }

  // All tests passed
  const durationMs = Date.now() - startTime;
  console.log(
    `[${requestId}] All passed | ${passedCount}/${testCases.length} | duration: ${durationMs}ms`
  );

  const response: JudgeResponse = {
    status: "passed",
    summary: { passedCount, totalCount: testCases.length, durationMs },
  };
  res.status(200).json(response);
});

// ============================================================
// Convex integration helpers
// ============================================================

async function fetchTestCasesFromConvex(
  questionId: string
): Promise<ConvexTestCasesResponse | null> {
  if (!env.CONVEX_SITE_URL) {
    throw new Error("CONVEX_SITE_URL not configured");
  }

  const url = `${env.CONVEX_SITE_URL.replace(/\/+$/, "")}/coding/testcases`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ questionId }),
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Convex error (${response.status}): ${text}`);
  }

  const json = await response.json();
  return ConvexTestCasesResponseSchema.parse(json);
}

async function markConvexSubmissionRunning(
  submissionId: string
): Promise<void> {
  if (!env.CONVEX_SITE_URL) {
    throw new Error("CONVEX_SITE_URL not configured");
  }

  const url = `${env.CONVEX_SITE_URL.replace(
    /\/+$/,
    ""
  )}/coding/submission-running`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ submissionId }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to mark submission running: ${text}`);
  }
}

interface ConvexSubmissionResult {
  status: "passed" | "failed" | "error";
  passedCount?: number;
  totalCount?: number;
  firstFailureIndex?: number;
  firstFailure?: {
    stdin?: string;
    actualOutput?: string;
    expectedOutput?: string;
    errorMessage?: string;
  };
  stdout?: string;
  stderr?: string;
  compileOutput?: string;
  durationMs?: number;
}

async function updateConvexSubmissionResult(
  submissionId: string,
  result: ConvexSubmissionResult
): Promise<void> {
  if (!env.CONVEX_SITE_URL) {
    throw new Error("CONVEX_SITE_URL not configured");
  }

  const url = `${env.CONVEX_SITE_URL.replace(
    /\/+$/,
    ""
  )}/coding/submission-result`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ submissionId, ...result }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to update submission result: ${text}`);
  }
}

// ============================================================
// POST /v1/judge-question - Judge a submission using testcases from Convex
// Fire-and-forget: returns 202 after marking "running", processes in background
// ============================================================

/**
 * Background processor for code execution.
 * This runs after the HTTP response is sent, so all errors must be
 * handled internally and reported back to Convex via HTTP callbacks.
 */
async function processSubmissionInBackground(
  requestId: string,
  submissionId: string,
  questionId: string,
  languageId: number,
  sourceCode: string,
  startTime: number
): Promise<void> {
  // Fetch testcases from Convex
  let convexData: ConvexTestCasesResponse | null;
  try {
    convexData = await fetchTestCasesFromConvex(questionId);
  } catch (err) {
    console.error(`[${requestId}] Failed to fetch testcases:`, err);

    // Update submission as error
    try {
      await updateConvexSubmissionResult(submissionId, {
        status: "error",
        durationMs: Date.now() - startTime,
      });
    } catch (updateErr) {
      console.error(`[${requestId}] Failed to update error status:`, updateErr);
    }
    return;
  }

  if (!convexData) {
    // Question not found
    try {
      await updateConvexSubmissionResult(submissionId, {
        status: "error",
        durationMs: Date.now() - startTime,
      });
    } catch (updateErr) {
      console.error(`[${requestId}] Failed to update error status:`, updateErr);
    }
    return;
  }

  const { question, testCases } = convexData;

  // Validate testcase count
  if (testCases.length === 0) {
    try {
      await updateConvexSubmissionResult(submissionId, {
        status: "error",
        durationMs: Date.now() - startTime,
      });
    } catch (updateErr) {
      console.error(`[${requestId}] Failed to update error status:`, updateErr);
    }
    return;
  }

  if (testCases.length > env.MAX_TESTCASES) {
    try {
      await updateConvexSubmissionResult(submissionId, {
        status: "error",
        durationMs: Date.now() - startTime,
      });
    } catch (updateErr) {
      console.error(`[${requestId}] Failed to update error status:`, updateErr);
    }
    return;
  }

  // Normalize source code newlines
  const normalizedSource = sourceCode.replace(/\r\n/g, "\n");

  // Comparison options from question settings
  const compareOptions: CompareOptions = {
    trimOutputs: question.outputComparison.trimOutputs,
    normalizeWhitespace: question.outputComparison.normalizeWhitespace,
    caseSensitive: question.outputComparison.caseSensitive,
  };

  let passedCount = 0;

  // Sequential fail-fast execution
  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const normalizedStdin = tc.stdin.replace(/\r\n/g, "\n");

    let result: Judge0Result;
    try {
      result = await judge0.submitAndWait({
        sourceCode: normalizedSource,
        languageId,
        stdin: normalizedStdin,
        cpuTimeLimit: question.timeLimitSeconds,
        memoryLimit: question.memoryLimitMb * 1024, // Convert MB to KB
        wallTimeLimit: question.timeLimitSeconds * 2, // Wall time = 2x CPU time
      });
    } catch (err) {
      // Judge0 communication error
      const durationMs = Date.now() - startTime;
      console.error(`[${requestId}] Judge0 error on testcase ${i}:`, err);

      // Update submission as error
      try {
        await updateConvexSubmissionResult(submissionId, {
          status: "error",
          passedCount,
          totalCount: testCases.length,
          firstFailureIndex: i,
          durationMs,
        });
      } catch (updateErr) {
        console.error(
          `[${requestId}] Failed to update error status:`,
          updateErr
        );
      }
      return;
    }

    // Helper to build Convex first failure (for submission storage)
    const buildConvexFirstFailure = (
      actualOutput: string,
      errorMessage?: string
    ): ConvexSubmissionResult["firstFailure"] => {
      // For public testcases, include all details
      // For hidden testcases, only include actual output and error
      if (tc.visibility === "public") {
        return {
          stdin: tc.stdin,
          actualOutput,
          expectedOutput: tc.expectedStdout,
          errorMessage,
        };
      }
      return {
        actualOutput,
        errorMessage,
      };
    };

    // Check for compile error
    if (isCompileError(result.status.id)) {
      const durationMs = Date.now() - startTime;
      console.log(
        `[${requestId}] Compile error | testcases: ${testCases.length} | duration: ${durationMs}ms`
      );

      const actualStdout = result.stdout ?? "";
      const errorMessage = result.compile_output ?? "Compilation failed";

      // Update submission
      try {
        await updateConvexSubmissionResult(submissionId, {
          status: "failed",
          passedCount: 0,
          totalCount: testCases.length,
          firstFailureIndex: 0,
          firstFailure: buildConvexFirstFailure(actualStdout, errorMessage),
          compileOutput: result.compile_output ?? undefined,
          durationMs,
        });
      } catch (updateErr) {
        console.error(`[${requestId}] Failed to update submission:`, updateErr);
      }
      return;
    }

    // Check for runtime error
    if (isRuntimeError(result.status.id)) {
      const durationMs = Date.now() - startTime;
      console.log(
        `[${requestId}] Runtime error at ${i} | passed: ${passedCount}/${testCases.length} | duration: ${durationMs}ms`
      );

      const actualStdout = result.stdout ?? "";
      const errorMessage = result.stderr ?? "Runtime error";

      // Update submission
      try {
        await updateConvexSubmissionResult(submissionId, {
          status: "failed",
          passedCount,
          totalCount: testCases.length,
          firstFailureIndex: i,
          firstFailure: buildConvexFirstFailure(actualStdout, errorMessage),
          stderr: result.stderr ?? undefined,
          durationMs,
        });
      } catch (updateErr) {
        console.error(`[${requestId}] Failed to update submission:`, updateErr);
      }
      return;
    }

    // Check for TLE
    if (isTimeLimitExceeded(result.status.id)) {
      const durationMs = Date.now() - startTime;
      console.log(
        `[${requestId}] TLE at ${i} | passed: ${passedCount}/${testCases.length} | duration: ${durationMs}ms`
      );

      const actualStdout = result.stdout ?? "";
      const errorMessage = "Time limit exceeded";

      // Update submission
      try {
        await updateConvexSubmissionResult(submissionId, {
          status: "failed",
          passedCount,
          totalCount: testCases.length,
          firstFailureIndex: i,
          firstFailure: buildConvexFirstFailure(actualStdout, errorMessage),
          durationMs,
        });
      } catch (updateErr) {
        console.error(`[${requestId}] Failed to update submission:`, updateErr);
      }
      return;
    }

    // Compare output
    const actualStdout = result.stdout ?? "";
    const comparison = compareOutputs(
      actualStdout,
      tc.expectedStdout,
      compareOptions
    );

    if (!comparison.match) {
      const durationMs = Date.now() - startTime;
      console.log(
        `[${requestId}] Wrong answer at ${i} | passed: ${passedCount}/${testCases.length} | duration: ${durationMs}ms`
      );

      const errorMessage = "Wrong answer";

      // Update submission
      try {
        await updateConvexSubmissionResult(submissionId, {
          status: "failed",
          passedCount,
          totalCount: testCases.length,
          firstFailureIndex: i,
          firstFailure: buildConvexFirstFailure(actualStdout, errorMessage),
          durationMs,
        });
      } catch (updateErr) {
        console.error(`[${requestId}] Failed to update submission:`, updateErr);
      }
      return;
    }

    // Test passed
    passedCount++;
  }

  // All tests passed
  const durationMs = Date.now() - startTime;
  console.log(
    `[${requestId}] All passed | ${passedCount}/${testCases.length} | duration: ${durationMs}ms`
  );

  // Update submission as passed
  try {
    await updateConvexSubmissionResult(submissionId, {
      status: "passed",
      passedCount,
      totalCount: testCases.length,
      durationMs,
    });
  } catch (updateErr) {
    console.error(`[${requestId}] Failed to update submission:`, updateErr);
  }
}

app.post("/v1/judge-question", async (req, res) => {
  const requestId = (req.headers["x-request-id"] as string) || randomUUID();
  const startTime = Date.now();

  // Validate request
  const parsed = JudgeQuestionRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      status: "error",
      submissionId: req.body?.submissionId || "",
      message: "Invalid request body",
      details: { issues: parsed.error.issues },
    });
    return;
  }

  const { questionId, submissionId, languageId, sourceCode } = parsed.data;

  // Validate source code size
  if (Buffer.byteLength(sourceCode, "utf8") > env.MAX_SOURCE_BYTES) {
    res.status(400).json({
      status: "error",
      submissionId,
      message: "sourceCode exceeds MAX_SOURCE_BYTES",
      details: { maxBytes: env.MAX_SOURCE_BYTES },
    });
    return;
  }

  // Check CONVEX_SITE_URL is configured
  if (!env.CONVEX_SITE_URL) {
    res.status(500).json({
      status: "error",
      submissionId,
      message: "CONVEX_SITE_URL not configured on code-exec server",
    });
    return;
  }

  // Mark submission as running - this is the sync part we wait for
  try {
    await markConvexSubmissionRunning(submissionId);
  } catch (err) {
    console.error(`[${requestId}] Failed to mark submission running:`, err);
    // Return error - we couldn't even start
    res.status(502).json({
      status: "error",
      submissionId,
      message: "Failed to mark submission as running",
      details: { requestId },
    });
    return;
  }

  // Return 202 Accepted immediately - processing continues in background
  res.status(202).json({
    status: "accepted",
    submissionId,
    message: "Submission queued for execution",
    details: { requestId },
  });

  // Fire-and-forget: process in background
  // Don't await - let it run independently
  processSubmissionInBackground(
    requestId,
    submissionId,
    questionId,
    languageId,
    sourceCode,
    startTime
  ).catch((err) => {
    // This catch is just a safety net - processSubmissionInBackground
    // should handle all errors internally
    console.error(
      `[${requestId}] Unhandled error in background processing:`,
      err
    );
  });
});

// Basic error guard (keeps express from returning HTML).
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const msg =
    err instanceof z.ZodError
      ? err.message
      : err instanceof Error
      ? err.message
      : "Unknown error";
  res.status(500).json({
    status: "error",
    message: "Internal error",
    details: { error: msg },
  });
});

app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[code-execution] listening on :${env.PORT}`);
});
