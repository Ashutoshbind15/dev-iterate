import { httpAction } from "../_generated/server";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";

type OutputComparison = {
  trimOutputs: boolean;
  normalizeWhitespace: boolean;
  caseSensitive: boolean;
};

type NormalizedTestCase = {
  visibility: "public" | "hidden";
  stdin: string;
  expectedStdout: string;
  name?: string;
};

type NormalizedCodingQuestion = {
  title: string;
  promptRichText: string;
  difficulty: "easy" | "medium" | "hard";
  tags: Array<string>;
  languageIdsAllowed: Array<number>;
  defaultLanguageId: number;
  timeLimitSeconds: number;
  memoryLimitMb: number;
  outputComparison: OutputComparison;
  starterCode?: Record<string, string>;
  testCases: Array<NormalizedTestCase>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pickStringRecord(value: unknown): Record<string, string> | undefined {
  if (!isRecord(value)) return undefined;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(value)) {
    if (typeof v === "string") out[k] = v;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function getLanguageIdFromName(language: unknown): number {
  if (typeof language !== "string") return 71;
  const s = language.toLowerCase();
  if (s.includes("python")) return 71;
  if (s.includes("typescript")) return 74;
  if (s.includes("javascript")) return 63;
  if (s === "java" || s.includes(" java")) return 62;
  if (s.includes("c++") || s.includes("cpp")) return 54;
  return 71;
}

function coerceDifficulty(value: unknown): "easy" | "medium" | "hard" {
  return value === "medium" || value === "hard" ? value : "easy";
}

function tipTapDocFromPlainText(text: string): string {
  const paragraphs = text
    .split(/\n{2,}/g)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  const content =
    paragraphs.length > 0
      ? paragraphs.map((p) => ({
          type: "paragraph",
          content: [{ type: "text", text: p }],
        }))
      : [{ type: "paragraph" }];
  return JSON.stringify({ type: "doc", content });
}

function normalizeIncomingQuestion(raw: unknown): NormalizedCodingQuestion {
  if (!isRecord(raw)) {
    throw new Error("Invalid question: expected object");
  }

  // If Kestra already sent the canonical schema, just pass through (with a tiny bit of defensive defaulting).
  if (
    typeof raw.title === "string" &&
    typeof raw.promptRichText === "string" &&
    typeof raw.defaultLanguageId === "number" &&
    Array.isArray(raw.languageIdsAllowed) &&
    typeof raw.timeLimitSeconds === "number" &&
    typeof raw.memoryLimitMb === "number" &&
    isRecord(raw.outputComparison) &&
    Array.isArray(raw.testCases)
  ) {
    return {
      title: raw.title,
      promptRichText: raw.promptRichText,
      difficulty: coerceDifficulty(raw.difficulty),
      tags: Array.isArray(raw.tags)
        ? raw.tags.filter((t) => typeof t === "string")
        : [],
      languageIdsAllowed: raw.languageIdsAllowed.filter(
        (n) => typeof n === "number"
      ),
      defaultLanguageId: raw.defaultLanguageId,
      timeLimitSeconds: raw.timeLimitSeconds,
      memoryLimitMb: raw.memoryLimitMb,
      outputComparison: {
        trimOutputs: Boolean(
          (raw.outputComparison as Record<string, unknown>).trimOutputs
        ),
        normalizeWhitespace: Boolean(
          (raw.outputComparison as Record<string, unknown>).normalizeWhitespace
        ),
        caseSensitive: Boolean(
          (raw.outputComparison as Record<string, unknown>).caseSensitive
        ),
      },
      starterCode: pickStringRecord(raw.starterCode),
      testCases: raw.testCases.filter(isRecord).map((tc) => ({
        visibility: tc.visibility === "hidden" ? "hidden" : "public",
        stdin: typeof tc.stdin === "string" ? tc.stdin : "",
        expectedStdout:
          typeof tc.expectedStdout === "string" ? tc.expectedStdout : "",
        name: typeof tc.name === "string" ? tc.name : undefined,
      })),
    };
  }

  // Otherwise, try to normalize "function-style" generator output (like { prompt, examples, language, starterCode, ... }).
  const title = typeof raw.title === "string" ? raw.title : "Untitled";
  const prompt = typeof raw.prompt === "string" ? raw.prompt : "";
  const difficulty = coerceDifficulty(raw.difficulty);

  const tags: Array<string> = Array.isArray(raw.topics)
    ? raw.topics.filter((t) => typeof t === "string")
    : Array.isArray(raw.tags)
    ? raw.tags.filter((t) => typeof t === "string")
    : [];

  const defaultLanguageId =
    typeof raw.defaultLanguageId === "number"
      ? raw.defaultLanguageId
      : getLanguageIdFromName(raw.language);

  const outputComparison: OutputComparison = {
    trimOutputs: true,
    normalizeWhitespace: true,
    caseSensitive: false,
  };

  const timeLimitSeconds =
    typeof raw.timeLimitSeconds === "number" ? raw.timeLimitSeconds : 2;
  const memoryLimitMb =
    typeof raw.memoryLimitMb === "number" ? raw.memoryLimitMb : 256;

  // Starter code: accept either a per-language map or a single string.
  const starterCodeString =
    typeof raw.starterCode === "string" ? raw.starterCode : "";
  const starterCodeMap = pickStringRecord(raw.starterCode)
    ? pickStringRecord(raw.starterCode)
    : starterCodeString
    ? { [String(defaultLanguageId)]: starterCodeString }
    : undefined;

  // Derive minimal stdin-based testcases from examples, if present.
  const examples = Array.isArray(raw.examples) ? raw.examples : [];
  const derivedTestCases: Array<NormalizedTestCase> = [];
  for (let i = 0; i < examples.length; i++) {
    const ex = examples[i];
    if (!isRecord(ex)) continue;
    const stdin =
      ex.input !== undefined ? `${JSON.stringify(ex.input)}\n` : "\n";
    const expectedStdout =
      ex.output !== undefined ? `${JSON.stringify(ex.output)}\n` : "\n";
    derivedTestCases.push({
      visibility: i === 0 ? "public" : "hidden",
      stdin,
      expectedStdout,
      name: typeof ex.name === "string" ? ex.name : undefined,
    });
  }

  // Ensure at least one public testcase exists (even if it's empty).
  const testCases: Array<NormalizedTestCase> =
    derivedTestCases.length > 0
      ? derivedTestCases
      : [{ visibility: "public", stdin: "\n", expectedStdout: "\n" }];

  return {
    title,
    promptRichText: tipTapDocFromPlainText(prompt),
    difficulty,
    tags,
    languageIdsAllowed: [defaultLanguageId],
    defaultLanguageId,
    timeLimitSeconds,
    memoryLimitMb,
    outputComparison,
    starterCode: starterCodeMap,
    testCases,
  };
}

export const savePersonalizedCodingQuestions = httpAction(async (ctx, req) => {
  // TODO: add your m2m token auth like you mentioned in getFeed
  const body = await req.json();
  const { submissionId, questions, errorMessage } = body ?? {};

  if (!submissionId) {
    return new Response(
      JSON.stringify({ error: "Missing required field: submissionId" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // If there's an error message, mark submission as failed
  if (errorMessage) {
    await ctx.runMutation(
      internal.mutations.personalizedCodingQuestions.markSubmissionFailed,
      {
        submissionId:
          submissionId as Id<"personalizedCodingQuestionSubmissions">,
        errorMessage,
      }
    );

    return new Response(
      JSON.stringify({ ok: true, message: "Submission marked as failed" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Validate questions array
  if (!questions || !Array.isArray(questions)) {
    return new Response(
      JSON.stringify({ error: "Missing or invalid questions array" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  if (questions.length === 0) {
    return new Response(
      JSON.stringify({ error: "Questions array cannot be empty" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const normalizedQuestions = questions.map(normalizeIncomingQuestion);
    const questionIds = await ctx.runMutation(
      internal.mutations.personalizedCodingQuestions
        .savePersonalizedCodingQuestions,
      {
        submissionId:
          submissionId as Id<"personalizedCodingQuestionSubmissions">,
        questions: normalizedQuestions,
      }
    );

    return new Response(
      JSON.stringify({
        ok: true,
        message: "Coding questions saved successfully",
        questionIds,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const errMessage =
      error instanceof Error
        ? error.message
        : "Failed to save coding questions";

    // Try to mark submission as failed
    try {
      await ctx.runMutation(
        internal.mutations.personalizedCodingQuestions.markSubmissionFailed,
        {
          submissionId:
            submissionId as Id<"personalizedCodingQuestionSubmissions">,
          errorMessage: errMessage,
        }
      );
    } catch (markError) {
      console.error("Failed to mark submission as failed:", markError);
    }

    return new Response(JSON.stringify({ error: errMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
