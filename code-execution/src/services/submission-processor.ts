import {
  Judge0Client,
  isCompileError,
  isRuntimeError,
  isTimeLimitExceeded,
  type Judge0Result,
} from "../judge0/client.js";
import { compareOutputs, type CompareOptions } from "../judge0/compare.js";
import { ConvexService, type ConvexSubmissionResult } from "./convex.js";
import type { ConvexTestCasesResponse } from "../contracts.js";

export interface SubmissionProcessorConfig {
  maxTestcases: number;
}

export interface SubmissionInput {
  requestId: string;
  submissionId: string;
  questionId: string;
  languageId: number;
  sourceCode: string;
  startTime: number;
}

export class SubmissionProcessor {
  constructor(
    private judge0: Judge0Client,
    private convex: ConvexService,
    private config: SubmissionProcessorConfig
  ) {}

  /**
   * Background processor for code execution.
   * This runs after the HTTP response is sent, so all errors must be
   * handled internally and reported back to Convex via HTTP callbacks.
   */
  async process(input: SubmissionInput): Promise<void> {
    const { requestId, submissionId, questionId, languageId, sourceCode, startTime } = input;

    // Fetch testcases from Convex
    let convexData: ConvexTestCasesResponse | null;
    try {
      convexData = await this.convex.fetchTestCases(questionId);
    } catch (err) {
      console.error(`[${requestId}] Failed to fetch testcases:`, err);
      await this.updateWithError(submissionId, startTime, requestId);
      return;
    }

    if (!convexData) {
      // Question not found
      await this.updateWithError(submissionId, startTime, requestId);
      return;
    }

    const { question, testCases } = convexData;

    // Validate testcase count
    if (testCases.length === 0 || testCases.length > this.config.maxTestcases) {
      await this.updateWithError(submissionId, startTime, requestId);
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
        result = await this.judge0.submitAndWait({
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

        await this.safeUpdate(submissionId, requestId, {
          status: "error",
          passedCount,
          totalCount: testCases.length,
          firstFailureIndex: i,
          durationMs,
        });
        return;
      }

      // Helper to build Convex first failure (for submission storage)
      const buildFirstFailure = (
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

        await this.safeUpdate(submissionId, requestId, {
          status: "failed",
          passedCount: 0,
          totalCount: testCases.length,
          firstFailureIndex: 0,
          firstFailure: buildFirstFailure(actualStdout, errorMessage),
          compileOutput: result.compile_output ?? undefined,
          durationMs,
        });
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

        await this.safeUpdate(submissionId, requestId, {
          status: "failed",
          passedCount,
          totalCount: testCases.length,
          firstFailureIndex: i,
          firstFailure: buildFirstFailure(actualStdout, errorMessage),
          stderr: result.stderr ?? undefined,
          durationMs,
        });
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

        await this.safeUpdate(submissionId, requestId, {
          status: "failed",
          passedCount,
          totalCount: testCases.length,
          firstFailureIndex: i,
          firstFailure: buildFirstFailure(actualStdout, errorMessage),
          durationMs,
        });
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

        await this.safeUpdate(submissionId, requestId, {
          status: "failed",
          passedCount,
          totalCount: testCases.length,
          firstFailureIndex: i,
          firstFailure: buildFirstFailure(actualStdout, errorMessage),
          durationMs,
        });
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

    await this.safeUpdate(submissionId, requestId, {
      status: "passed",
      passedCount,
      totalCount: testCases.length,
      durationMs,
    });
  }

  private async updateWithError(
    submissionId: string,
    startTime: number,
    requestId: string
  ): Promise<void> {
    try {
      await this.convex.updateSubmissionResult(submissionId, {
        status: "error",
        durationMs: Date.now() - startTime,
      });
    } catch (updateErr) {
      console.error(`[${requestId}] Failed to update error status:`, updateErr);
    }
  }

  private async safeUpdate(
    submissionId: string,
    requestId: string,
    result: ConvexSubmissionResult
  ): Promise<void> {
    try {
      await this.convex.updateSubmissionResult(submissionId, result);
    } catch (updateErr) {
      console.error(`[${requestId}] Failed to update submission:`, updateErr);
    }
  }
}

