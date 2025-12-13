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

export class ConvexService {
  private siteUrl: string;

  constructor(config: ConvexConfig) {
    this.siteUrl = config.siteUrl.replace(/\/+$/, "");
  }

  async fetchTestCases(
    questionId: string
  ): Promise<ConvexTestCasesResponse | null> {
    const url = `${this.siteUrl}/coding/testcases`;
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

  async markSubmissionRunning(submissionId: string): Promise<void> {
    const url = `${this.siteUrl}/coding/submission-running`;
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
    result: ConvexSubmissionResult
  ): Promise<void> {
    const url = `${this.siteUrl}/coding/submission-result`;
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

