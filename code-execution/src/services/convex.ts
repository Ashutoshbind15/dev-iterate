import {
  ConvexTestCasesResponseSchema,
  type ConvexTestCasesResponse,
} from "../contracts.js";

export interface ConvexConfig {
  siteUrl: string;
}

export interface ConvexSubmissionResult {
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

export type SubmissionKind = "standard" | "personalized";

export class ConvexService {
  private siteUrl: string;

  constructor(config: ConvexConfig) {
    this.siteUrl = config.siteUrl.replace(/\/+$/, "");
  }

  private paths(kind: SubmissionKind) {
    return kind === "personalized"
      ? {
          testcases: "/coding/personalized-testcases",
          running: "/coding/personalized-submission-running",
          result: "/coding/personalized-submission-result",
        }
      : {
          testcases: "/coding/testcases",
          running: "/coding/submission-running",
          result: "/coding/submission-result",
        };
  }

  async fetchTestCases(
    questionId: string,
    kind: SubmissionKind = "standard"
  ): Promise<ConvexTestCasesResponse | null> {
    const url = `${this.siteUrl}${this.paths(kind).testcases}`;
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

  async markSubmissionRunning(
    submissionId: string,
    kind: SubmissionKind = "standard"
  ): Promise<void> {
    const url = `${this.siteUrl}${this.paths(kind).running}`;
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

  async updateSubmissionResult(
    submissionId: string,
    result: ConvexSubmissionResult,
    kind: SubmissionKind = "standard"
  ): Promise<void> {
    const url = `${this.siteUrl}${this.paths(kind).result}`;
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
}

