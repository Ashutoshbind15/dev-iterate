import "dotenv/config";
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { z } from "zod";
import { loadEnv } from "./env.js";
import { JudgeRequestSchema } from "./contracts.js";
import { fetchTextWithTimeout } from "./http.js";

const env = loadEnv();

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
  const parsed = JudgeRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      status: "error",
      message: "Invalid request body",
      details: { issues: parsed.error.issues },
    });
    return;
  }

  const { sourceCode, testCases } = parsed.data;
  if (Buffer.byteLength(sourceCode, "utf8") > env.MAX_SOURCE_BYTES) {
    res.status(400).json({
      status: "error",
      message: "sourceCode exceeds MAX_SOURCE_BYTES",
      details: { maxBytes: env.MAX_SOURCE_BYTES },
    });
    return;
  }
  if (testCases.length > env.MAX_TESTCASES) {
    res.status(400).json({
      status: "error",
      message: "testCases exceeds MAX_TESTCASES",
      details: { max: env.MAX_TESTCASES },
    });
    return;
  }

  // Stage 1: contract is defined + validated, but real Judge0 integration is out of scope.
  res.status(501).json({
    status: "error",
    message:
      "Not implemented (stage 1): Judge0 submission/polling not implemented yet.",
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
