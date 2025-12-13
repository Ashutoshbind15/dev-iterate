import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { useParams, Link, useNavigate } from "react-router";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Clock, HardDrive, Play } from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";
import { useCodingSubmission } from "@/hooks/use-coding-submission";
import { SubmissionStatus } from "@/components/coding/submission-status";
import { SubmissionHistory } from "@/components/coding/submission-history";
import { JUDGE0_LANGUAGES, getLanguageName } from "@/components/coding/language-constants";

export default function CodingSolvePage() {
  const { questionId: questionIdParam } = useParams<{ questionId: string }>();
  const navigate = useNavigate();
  const questionId = questionIdParam as Id<"codingQuestions"> | undefined;

  const [sourceCode, setSourceCode] = useState("");
  const [languageId, setLanguageId] = useState<number | null>(null);

  // Fetch question data
  const question = useQuery(
    api.queries.codingQuestions.getCodingQuestionForSolve,
    questionId ? { questionId } : "skip"
  );

  // Current user
  const currentUser = useQuery(api.queries.user.getCurrentUser);

  // Submission hook
  const {
    submit,
    currentSubmission,
    isSubmitting,
    trackSubmission,
    trackedSubmissionId,
  } = useCodingSubmission({
    questionId: questionId!,
  });

  // Initialize language and starter code when question loads
  useEffect(() => {
    if (question && languageId === null) {
      setLanguageId(question.defaultLanguageId);
      // Load starter code if available
      const starterCode = question.starterCode?.[String(question.defaultLanguageId)];
      if (starterCode) {
        setSourceCode(starterCode);
      }
    }
  }, [question, languageId]);

  // Update starter code when language changes
  useEffect(() => {
    if (question && languageId !== null && sourceCode === "") {
      const starterCode = question.starterCode?.[String(languageId)];
      if (starterCode) {
        setSourceCode(starterCode);
      }
    }
  }, [languageId, question, sourceCode]);

  const handleSubmit = async () => {
    if (!questionId || languageId === null) return;

    if (!sourceCode.trim()) {
      toast.error("Please enter some code before submitting");
      return;
    }

    try {
      const submissionId = await submit(sourceCode, languageId);
      trackSubmission(submissionId);
      toast.success("Submission queued!");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to submit";
      toast.error(message);
      console.error(error);
    }
  };

  const handleSelectHistoricalSubmission = (
    submissionId: Id<"codingSubmissions">
  ) => {
    trackSubmission(submissionId);
  };

  const getDifficultyColor = (difficulty: "easy" | "medium" | "hard") => {
    switch (difficulty) {
      case "easy":
        return "bg-emerald-100 text-emerald-700";
      case "medium":
        return "bg-amber-100 text-amber-700";
      case "hard":
        return "bg-rose-100 text-rose-700";
    }
  };

  // Loading state
  if (question === undefined) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-zinc-500">Loading question...</div>
      </div>
    );
  }

  // Not found
  if (question === null) {
    return (
      <div className="min-h-screen bg-zinc-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-900 mb-4">
            Question not found
          </h1>
          <Link to="/">
            <Button variant="outline">Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Filter allowed languages
  const allowedLanguages = JUDGE0_LANGUAGES.filter((lang) =>
    question.languageIdsAllowed.includes(lang.id)
  );

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <div className="bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-2 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900">
                {question.title}
              </h1>
              <div className="flex items-center gap-3 mt-2 text-sm">
                <span
                  className={`px-2 py-0.5 rounded font-medium capitalize ${getDifficultyColor(
                    question.difficulty
                  )}`}
                >
                  {question.difficulty}
                </span>
                <span className="flex items-center gap-1 text-zinc-500">
                  <Clock className="h-3.5 w-3.5" />
                  {question.timeLimitSeconds}s
                </span>
                <span className="flex items-center gap-1 text-zinc-500">
                  <HardDrive className="h-3.5 w-3.5" />
                  {question.memoryLimitMb}MB
                </span>
                {question.tags.length > 0 && (
                  <div className="flex gap-1">
                    {question.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-1.5 py-0.5 text-xs bg-zinc-100 text-zinc-600 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel: Problem Statement */}
          <div className="space-y-6">
            {/* Problem Description */}
            <div className="bg-white rounded-lg border border-zinc-200 p-6">
              <h2 className="text-lg font-semibold text-zinc-900 mb-4">
                Problem
              </h2>
              <div
                className="prose prose-zinc prose-sm max-w-none"
                dangerouslySetInnerHTML={{
                  __html: parseRichText(question.promptRichText),
                }}
              />
            </div>

            {/* Public Test Cases */}
            <div className="bg-white rounded-lg border border-zinc-200 p-6">
              <h2 className="text-lg font-semibold text-zinc-900 mb-4">
                Examples ({question.publicTestCases.length} of{" "}
                {question.totalTestCaseCount} test cases shown)
              </h2>
              <div className="space-y-4">
                {question.publicTestCases.map((tc, idx) => (
                  <div
                    key={tc._id}
                    className="p-4 bg-zinc-50 rounded-lg border border-zinc-100"
                  >
                    <p className="text-sm font-medium text-zinc-700 mb-2">
                      {tc.name || `Example ${idx + 1}`}
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-medium text-zinc-500 mb-1">
                          Input
                        </p>
                        <pre className="text-sm text-zinc-800 bg-white p-2 rounded border border-zinc-200 font-mono whitespace-pre-wrap">
                          {tc.stdin || "(empty)"}
                        </pre>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-zinc-500 mb-1">
                          Expected Output
                        </p>
                        <pre className="text-sm text-zinc-800 bg-white p-2 rounded border border-zinc-200 font-mono whitespace-pre-wrap">
                          {tc.expectedStdout || "(empty)"}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel: Code Editor & Submissions */}
          <div className="space-y-6">
            {/* Code Editor */}
            <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
              {/* Editor Header */}
              <div className="px-4 py-3 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
                <Select
                  value={languageId?.toString()}
                  onValueChange={(value) => setLanguageId(Number(value))}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select language">
                      {languageId !== null && getLanguageName(languageId)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {allowedLanguages.map((lang) => (
                      <SelectItem key={lang.id} value={lang.id.toString()}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !currentUser || languageId === null}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Play className="h-4 w-4 mr-1" />
                  {isSubmitting ? "Submitting..." : "Submit"}
                </Button>
              </div>

              {/* Code Textarea (temporary - will be Monaco in Plan 5) */}
              <textarea
                value={sourceCode}
                onChange={(e) => setSourceCode(e.target.value)}
                placeholder="Write your code here..."
                className="w-full h-80 p-4 font-mono text-sm text-zinc-800 bg-white border-none resize-none focus:outline-none focus:ring-0"
                spellCheck={false}
                disabled={!currentUser}
              />

              {/* Not signed in message */}
              {!currentUser && (
                <div className="px-4 py-3 bg-amber-50 border-t border-amber-200 text-sm text-amber-700">
                  Please sign in to submit code.
                </div>
              )}
            </div>

            {/* Current Submission Status */}
            {currentSubmission && (
              <div>
                <h3 className="text-sm font-medium text-zinc-700 mb-2">
                  Current Submission
                </h3>
                <SubmissionStatus submission={currentSubmission} />
              </div>
            )}

            {/* Submission History */}
            {currentUser && (
              <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-zinc-200 bg-zinc-50">
                  <h3 className="text-sm font-medium text-zinc-700">
                    Your Submissions
                  </h3>
                </div>
                <SubmissionHistory
                  questionId={questionId!}
                  onSelectSubmission={handleSelectHistoricalSubmission}
                  selectedSubmissionId={trackedSubmissionId}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Simple parser for TipTap JSON rich text.
 * In a real app, you'd use a proper renderer, but this works for basic content.
 */
function parseRichText(jsonString: string): string {
  try {
    const doc = JSON.parse(jsonString);
    return renderNode(doc);
  } catch {
    // If it's not valid JSON, return as plain text
    return `<p>${escapeHtml(jsonString)}</p>`;
  }
}

function renderNode(node: { type?: string; content?: unknown[]; text?: string; marks?: { type: string }[] }): string {
  if (!node.type) return "";

  switch (node.type) {
    case "doc":
      return node.content?.map(renderNode).join("") ?? "";
    case "paragraph":
      return `<p>${node.content?.map(renderNode).join("") ?? ""}</p>`;
    case "text": {
      let text = escapeHtml(node.text ?? "");
      if (node.marks) {
        for (const mark of node.marks) {
          if (mark.type === "bold") text = `<strong>${text}</strong>`;
          if (mark.type === "italic") text = `<em>${text}</em>`;
          if (mark.type === "code") text = `<code>${text}</code>`;
        }
      }
      return text;
    }
    case "bulletList":
      return `<ul>${node.content?.map(renderNode).join("") ?? ""}</ul>`;
    case "orderedList":
      return `<ol>${node.content?.map(renderNode).join("") ?? ""}</ol>`;
    case "listItem":
      return `<li>${node.content?.map(renderNode).join("") ?? ""}</li>`;
    case "codeBlock":
      return `<pre><code>${node.content?.map(renderNode).join("") ?? ""}</code></pre>`;
    case "heading": {
      const level = (node as { attrs?: { level?: number } }).attrs?.level ?? 1;
      return `<h${level}>${node.content?.map(renderNode).join("") ?? ""}</h${level}>`;
    }
    case "blockquote":
      return `<blockquote>${node.content?.map(renderNode).join("") ?? ""}</blockquote>`;
    case "hardBreak":
      return "<br />";
    default:
      return node.content?.map(renderNode).join("") ?? "";
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


