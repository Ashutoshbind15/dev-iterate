import { Router } from "express";
import { randomUUID } from "crypto";
import { JudgeQuestionRequestSchema } from "../contracts.js";
import { ConvexService } from "../services/convex.js";
import { SubmissionProcessor } from "../services/submission-processor.js";

export interface JudgeQuestionRouteConfig {
  maxSourceBytes: number;
}

export function createJudgeQuestionRoute(
  convex: ConvexService,
  processor: SubmissionProcessor,
  config: JudgeQuestionRouteConfig
): Router {
  const router = Router();

  router.post("/v1/judge-question", async (req, res) => {
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

    const { questionId, submissionId, languageId, sourceCode, submissionKind } =
      parsed.data;
    const kind = submissionKind ?? "standard";

    // Validate source code size
    if (Buffer.byteLength(sourceCode, "utf8") > config.maxSourceBytes) {
      res.status(400).json({
        status: "error",
        submissionId,
        message: "sourceCode exceeds MAX_SOURCE_BYTES",
        details: { maxBytes: config.maxSourceBytes },
      });
      return;
    }

    // Mark submission as running - this is the sync part we wait for
    try {
      await convex.markSubmissionRunning(submissionId, kind);
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
    processor
      .process({
        requestId,
        submissionId,
        questionId,
        languageId,
        sourceCode,
        startTime,
        submissionKind: kind,
      })
      .catch((err) => {
        // This catch is just a safety net - processor.process
        // should handle all errors internally
        console.error(
          `[${requestId}] Unhandled error in background processing:`,
          err
        );
      });
  });

  return router;
}

