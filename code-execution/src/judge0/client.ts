import { z } from "zod";

// Judge0 Status IDs: https://github.com/judge0/judge0/blob/master/docs/api/statuses.md
export const Judge0Status = {
  IN_QUEUE: 1,
  PROCESSING: 2,
  ACCEPTED: 3,
  WRONG_ANSWER: 4,
  TIME_LIMIT_EXCEEDED: 5,
  COMPILATION_ERROR: 6,
  RUNTIME_ERROR_SIGSEGV: 7,
  RUNTIME_ERROR_SIGXFSZ: 8,
  RUNTIME_ERROR_SIGFPE: 9,
  RUNTIME_ERROR_SIGABRT: 10,
  RUNTIME_ERROR_NZEC: 11,
  RUNTIME_ERROR_OTHER: 12,
  INTERNAL_ERROR: 13,
  EXEC_FORMAT_ERROR: 14,
} as const;

// Terminal statuses (no longer processing)
export const TERMINAL_STATUS_IDS: Set<number> = new Set([
  Judge0Status.ACCEPTED,
  Judge0Status.WRONG_ANSWER,
  Judge0Status.TIME_LIMIT_EXCEEDED,
  Judge0Status.COMPILATION_ERROR,
  Judge0Status.RUNTIME_ERROR_SIGSEGV,
  Judge0Status.RUNTIME_ERROR_SIGXFSZ,
  Judge0Status.RUNTIME_ERROR_SIGFPE,
  Judge0Status.RUNTIME_ERROR_SIGABRT,
  Judge0Status.RUNTIME_ERROR_NZEC,
  Judge0Status.RUNTIME_ERROR_OTHER,
  Judge0Status.INTERNAL_ERROR,
  Judge0Status.EXEC_FORMAT_ERROR,
]);

export function isTerminalStatus(statusId: number): boolean {
  return TERMINAL_STATUS_IDS.has(statusId);
}

export function isCompileError(statusId: number): boolean {
  return statusId === Judge0Status.COMPILATION_ERROR;
}

export function isRuntimeError(statusId: number): boolean {
  return (
    statusId >= Judge0Status.RUNTIME_ERROR_SIGSEGV &&
    statusId <= Judge0Status.RUNTIME_ERROR_OTHER
  );
}

export function isTimeLimitExceeded(statusId: number): boolean {
  return statusId === Judge0Status.TIME_LIMIT_EXCEEDED;
}

export function isAccepted(statusId: number): boolean {
  return statusId === Judge0Status.ACCEPTED;
}

// Schemas for Judge0 API responses
const Judge0SubmissionResponseSchema = z.object({
  token: z.string(),
});

const Judge0StatusSchema = z.object({
  id: z.number(),
  description: z.string(),
});

const Judge0ResultSchema = z.object({
  token: z.string(),
  stdout: z.string().nullable(),
  stderr: z.string().nullable(),
  compile_output: z.string().nullable(),
  message: z.string().nullable(),
  status: Judge0StatusSchema,
  time: z.string().nullable(),
  memory: z.number().nullable(),
  exit_code: z.number().nullable(),
});

export type Judge0Result = z.infer<typeof Judge0ResultSchema>;

export interface CreateSubmissionParams {
  sourceCode: string;
  languageId: number;
  stdin: string;
  expectedOutput?: string;
  cpuTimeLimit?: number; // seconds
  memoryLimit?: number; // KB
  wallTimeLimit?: number; // seconds
}

export interface Judge0ClientConfig {
  baseUrl: string;
  apiKey?: string;
  timeoutMs: number;
  pollIntervalMs?: number;
  maxPollAttempts?: number;
}

export class Judge0Client {
  private config: Judge0ClientConfig;

  constructor(config: Judge0ClientConfig) {
    this.config = {
      pollIntervalMs: 500,
      maxPollAttempts: 60, // 30 seconds max polling at 500ms intervals
      ...config,
    };
  }

  private get headers(): Record<string, string> {
    const h: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.config.apiKey) {
      h["X-Auth-Token"] = this.config.apiKey;
    }
    return h;
  }

  private get baseUrl(): string {
    return this.config.baseUrl.replace(/\/+$/, "");
  }

  /**
   * Encode string to base64.
   */
  private toBase64(str: string): string {
    return Buffer.from(str, "utf-8").toString("base64");
  }

  /**
   * Decode base64 string.
   */
  private fromBase64(str: string | null): string | null {
    if (str === null) return null;
    try {
      return Buffer.from(str, "base64").toString("utf-8");
    } catch {
      return str; // Return as-is if not valid base64
    }
  }

  /**
   * Create a submission and return the token.
   */
  async createSubmission(params: CreateSubmissionParams): Promise<string> {
    // Use base64 encoding for source code and stdin to handle all character types
    const body: Record<string, unknown> = {
      source_code: this.toBase64(params.sourceCode),
      language_id: params.languageId,
      stdin: this.toBase64(params.stdin),
    };

    if (params.expectedOutput !== undefined) {
      body.expected_output = this.toBase64(params.expectedOutput);
    }
    if (params.cpuTimeLimit !== undefined) {
      body.cpu_time_limit = params.cpuTimeLimit;
    }
    if (params.memoryLimit !== undefined) {
      body.memory_limit = params.memoryLimit;
    }
    if (params.wallTimeLimit !== undefined) {
      body.wall_time_limit = params.wallTimeLimit;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const res = await fetch(
        `${this.baseUrl}/submissions?base64_encoded=true&wait=false`,
        {
          method: "POST",
          headers: this.headers,
          body: JSON.stringify(body),
          signal: controller.signal,
        }
      );

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(
          `Judge0 create submission failed: ${res.status} ${text}`
        );
      }

      const json = await res.json();
      const parsed = Judge0SubmissionResponseSchema.safeParse(json);
      if (!parsed.success) {
        throw new Error(`Invalid Judge0 response: ${parsed.error.message}`);
      }
      return parsed.data.token;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Get submission result by token.
   */
  async getSubmission(token: string): Promise<Judge0Result> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const res = await fetch(
        `${this.baseUrl}/submissions/${token}?base64_encoded=true&fields=*`,
        {
          method: "GET",
          headers: this.headers,
          signal: controller.signal,
        }
      );

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Judge0 get submission failed: ${res.status} ${text}`);
      }

      const json = await res.json();
      const parsed = Judge0ResultSchema.safeParse(json);
      if (!parsed.success) {
        throw new Error(`Invalid Judge0 result: ${parsed.error.message}`);
      }

      // Decode base64 fields
      const result = parsed.data;
      return {
        ...result,
        stdout: this.fromBase64(result.stdout),
        stderr: this.fromBase64(result.stderr),
        compile_output: this.fromBase64(result.compile_output),
        message: this.fromBase64(result.message),
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Poll until terminal status or timeout.
   */
  async waitForResult(token: string): Promise<Judge0Result> {
    const { pollIntervalMs, maxPollAttempts } = this.config;

    for (let attempt = 0; attempt < maxPollAttempts!; attempt++) {
      const result = await this.getSubmission(token);

      if (isTerminalStatus(result.status.id)) {
        return result;
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    throw new Error(`Judge0 polling timeout after ${maxPollAttempts} attempts`);
  }

  /**
   * Convenience: submit and wait for result in one call.
   */
  async submitAndWait(params: CreateSubmissionParams): Promise<Judge0Result> {
    const token = await this.createSubmission(params);
    return this.waitForResult(token);
  }
}
