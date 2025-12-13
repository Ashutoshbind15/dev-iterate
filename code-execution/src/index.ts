import "dotenv/config";
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { z } from "zod";
import { randomUUID } from "crypto";
import { loadEnv } from "./env.js";
import { JudgeRequestSchema, type JudgeResponse } from "./contracts.js";
import { fetchTextWithTimeout } from "./http.js";
import {
  Judge0Client,
  isCompileError,
  isRuntimeError,
  isTimeLimitExceeded,
  isAccepted,
  type Judge0Result,
} from "./judge0/client.js";
import { compareOutputs } from "./judge0/compare.js";

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
