import "dotenv/config";
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { z } from "zod";
import { loadEnv } from "./env.js";
import { Judge0Client } from "./judge0/client.js";
import { createHealthRoutes } from "./routes/health.js";
import { createJudgeQuestionRoute } from "./routes/judge-question.js";
import { ConvexService } from "./services/convex.js";
import { SubmissionProcessor } from "./services/submission-processor.js";

const env = loadEnv();

// Initialize Judge0 client
const judge0 = new Judge0Client({
  baseUrl: env.JUDGE0_BASE_URL,
  apiKey: env.JUDGE0_API_KEY || undefined,
  timeoutMs: env.REQUEST_TIMEOUT_MS,
  pollIntervalMs: 500,
  maxPollAttempts: Math.ceil(env.REQUEST_TIMEOUT_MS / 500),
});

// Initialize Convex service (optional - only if configured)
const convex = env.CONVEX_SITE_URL
  ? new ConvexService({ siteUrl: env.CONVEX_SITE_URL })
  : null;

// Initialize submission processor (only if Convex is configured)
const submissionProcessor = convex
  ? new SubmissionProcessor(judge0, convex, {
      maxTestcases: env.MAX_TESTCASES,
    })
  : null;

// Create Express app
const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));

// Mount routes
app.use(
  createHealthRoutes({
    judge0BaseUrl: env.JUDGE0_BASE_URL,
    judge0ApiKey: env.JUDGE0_API_KEY || undefined,
    requestTimeoutMs: env.REQUEST_TIMEOUT_MS,
  })
);

// Only mount judge-question route if Convex is configured
if (convex && submissionProcessor) {
  app.use(
    createJudgeQuestionRoute(convex, submissionProcessor, {
      maxSourceBytes: env.MAX_SOURCE_BYTES,
    })
  );
} else {
  // Return helpful error if endpoint is called without Convex config
  app.post("/v1/judge-question", (_req, res) => {
    res.status(500).json({
      status: "error",
      message: "CONVEX_SITE_URL not configured on code-exec server",
    });
  });
}

// Basic error guard (keeps express from returning HTML)
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
  console.log(`[code-execution] listening on :${env.PORT}`);
});
