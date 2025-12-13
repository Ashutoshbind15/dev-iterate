import { Router } from "express";
import { fetchTextWithTimeout } from "../http.js";

export interface HealthRoutesConfig {
  judge0BaseUrl: string;
  judge0ApiKey?: string;
  requestTimeoutMs: number;
}

export function createHealthRoutes(config: HealthRoutesConfig): Router {
  const router = Router();

  router.get("/healthz", (_req, res) => {
    res.status(200).json({ ok: true });
  });

  router.get("/readyz", async (_req, res) => {
    const base = config.judge0BaseUrl.replace(/\/+$/, "");
    const headers: Record<string, string> = {};
    if (config.judge0ApiKey) headers["X-Auth-Token"] = config.judge0ApiKey;

    // `/languages` is a small, unauthenticated endpoint on default Judge0 CE setups.
    const probe = await fetchTextWithTimeout(`${base}/languages`, {
      timeoutMs: config.requestTimeoutMs,
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

  return router;
}

