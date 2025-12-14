import { useState, useCallback } from "react";
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
import {
  ArrowLeft,
  Clock,
  HardDrive,
  Send,
  RotateCcw,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";
import { useCodingSubmission } from "@/hooks/use-coding-submission";
import { SubmissionStatus } from "@/components/coding/submission-status";
import { SubmissionHistory } from "@/components/coding/submission-history";
import {
  JUDGE0_LANGUAGES,
  getLanguageName,
  getMonacoLanguageId,
} from "@/components/coding/language-constants";
import { MonacoCodeEditor } from "@/components/editor/monaco-editor";

export default function CodingSolvePage() {
  const { questionId: questionIdParam } = useParams<{ questionId: string }>();
  const navigate = useNavigate();
  const questionId = questionIdParam as Id<"codingQuestions"> | undefined;

  const [isEditorExpanded, setIsEditorExpanded] = useState(false);
  const [showTestCases, setShowTestCases] = useState(true);

  // Fetch question data
  const question = useQuery(
    api.queries.codingQuestions.getCodingQuestionForSolve,
    questionId ? { questionId } : "skip"
  );

  // Current user
  const currentUser = useQuery(api.queries.user.getCurrentUser);

  const [sourceCode, setSourceCode] = useState("");
  const [languageId, setLanguageId] = useState<number | null>(null);
  const [initialized, setInitialized] = useState(false);

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

  // Initialize language and starter code when question first loads
  if (question && !initialized) {
    setLanguageId(question.defaultLanguageId);
    const starterCode =
      question.starterCode?.[String(question.defaultLanguageId)];
    if (starterCode) {
      setSourceCode(starterCode);
    }
    setInitialized(true);
  }

  // Update starter code when language changes
  const handleLanguageChange = useCallback(
    (newLangId: number) => {
      setLanguageId(newLangId);
      if (question) {
        // Only load starter code if current code is empty or is the previous starter code
        const currentStarterCode =
          question.starterCode?.[String(languageId)] ?? "";
        const newStarterCode = question.starterCode?.[String(newLangId)] ?? "";

        if (sourceCode === "" || sourceCode === currentStarterCode) {
          setSourceCode(newStarterCode);
        }
      }
    },
    [question, languageId, sourceCode]
  );

  // Reset code to starter
  const handleResetCode = useCallback(() => {
    if (question && languageId) {
      const starterCode = question.starterCode?.[String(languageId)] ?? "";
      setSourceCode(starterCode);
      toast.success("Code reset to starter template");
    }
  }, [question, languageId]);

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
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "medium":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "hard":
        return "bg-rose-500/20 text-rose-400 border-rose-500/30";
    }
  };

  // Loading state
  if (question === undefined) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading question...</div>
      </div>
    );
  }

  // Not found
  if (question === null) {
    return (
      <div className="min-h-screen bg-slate-950 p-8 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-100 mb-4">
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

  const monacoLanguage = languageId
    ? getMonacoLanguageId(languageId)
    : "plaintext";

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-zinc-900">
      {/* Header */}
      <div className="bg-slate-900/80 border-b border-slate-700/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-[1800px] mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="text-slate-400 hover:text-slate-200 hover:bg-slate-800 shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-0">
                <h1 className="text-lg font-semibold text-slate-100 truncate">
                  {question.title}
                </h1>
                <div className="flex items-center gap-3 text-xs">
                  <span
                    className={`px-2 py-0.5 rounded border font-medium capitalize ${getDifficultyColor(
                      question.difficulty
                    )}`}
                  >
                    {question.difficulty}
                  </span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <Clock className="h-3 w-3" />
                    {question.timeLimitSeconds}s
                  </span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <HardDrive className="h-3 w-3" />
                    {question.memoryLimitMb}MB
                  </span>
                </div>
              </div>
            </div>
            {question.tags.length > 0 && (
              <div className="hidden md:flex gap-1.5 shrink-0">
                {question.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-xs bg-slate-800 text-slate-400 rounded border border-slate-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto px-4 py-4">
        <div
          className={`grid gap-4 ${
            isEditorExpanded
              ? "grid-cols-1"
              : "grid-cols-1 lg:grid-cols-2 xl:grid-cols-5"
          }`}
        >
          {/* Left Panel: Problem Statement */}
          {!isEditorExpanded && (
            <div className="xl:col-span-2 space-y-4 max-h-[calc(100vh-120px)] overflow-y-auto pr-2">
              {/* Problem Description */}
              <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
                <h2 className="text-sm font-semibold text-slate-200 mb-4">
                  Problem
                </h2>
                <div
                  className="prose prose-sm prose-invert max-w-none prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-700 prose-code:text-emerald-400"
                  dangerouslySetInnerHTML={{
                    __html: parseRichText(question.promptRichText),
                  }}
                />
              </div>

              {/* Public Test Cases */}
              <div className="bg-slate-800/50 rounded-xl border border-slate-700/50">
                <button
                  onClick={() => setShowTestCases(!showTestCases)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left"
                >
                  <h2 className="text-sm font-semibold text-slate-200">
                    Examples
                    <span className="ml-2 text-slate-500 font-normal">
                      ({question.publicTestCases.length} of{" "}
                      {question.totalTestCaseCount})
                    </span>
                  </h2>
                  {showTestCases ? (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  )}
                </button>
                {showTestCases && (
                  <div className="px-5 pb-5 space-y-4">
                    {question.publicTestCases.map((tc, idx) => (
                      <div
                        key={tc._id}
                        className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/50"
                      >
                        <p className="text-xs font-medium text-slate-400 mb-3">
                          {tc.name || `Example ${idx + 1}`}
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[10px] uppercase tracking-wider font-medium text-slate-500 mb-1.5">
                              Input
                            </p>
                            <pre className="text-sm text-slate-200 bg-slate-950 p-3 rounded border border-slate-700 font-mono whitespace-pre-wrap overflow-x-auto">
                              {tc.stdin || "(empty)"}
                            </pre>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-wider font-medium text-slate-500 mb-1.5">
                              Expected
                            </p>
                            <pre className="text-sm text-emerald-300 bg-slate-950 p-3 rounded border border-slate-700 font-mono whitespace-pre-wrap overflow-x-auto">
                              {tc.expectedStdout || "(empty)"}
                            </pre>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Right Panel: Code Editor & Submissions */}
          <div
            className={`${
              isEditorExpanded ? "" : "xl:col-span-3"
            } space-y-4 max-h-[calc(100vh-120px)] flex flex-col`}
          >
            {/* Code Editor */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden flex-1 flex flex-col min-h-[400px]">
              {/* Editor Header */}
              <div className="px-4 py-2.5 border-b border-slate-700/50 flex items-center justify-between bg-slate-900/50">
                <div className="flex items-center gap-3">
                  <Select
                    value={languageId?.toString()}
                    onValueChange={(value) =>
                      handleLanguageChange(Number(value))
                    }
                  >
                    <SelectTrigger className="w-44 h-8 text-sm bg-slate-800 border-slate-600 text-slate-200">
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
                    variant="ghost"
                    size="sm"
                    onClick={handleResetCode}
                    className="h-8 px-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700"
                    title="Reset to starter code"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditorExpanded(!isEditorExpanded)}
                    className="h-8 px-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700"
                  >
                    {isEditorExpanded ? (
                      <Minimize2 className="h-4 w-4" />
                    ) : (
                      <Maximize2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Monaco Editor */}
              <div className="flex-1 min-h-[300px]">
                <MonacoCodeEditor
                  value={sourceCode}
                  onChange={(value) => setSourceCode(value)}
                  language={monacoLanguage}
                  height="100%"
                  readOnly={!currentUser}
                  theme="catppuccin-mocha"
                  placeholder="// Write your solution here..."
                />
              </div>

              {/* Editor Footer - Actions */}
              <div className="px-4 py-3 border-t border-slate-700/50 bg-slate-900/50 flex items-center justify-between">
                {!currentUser ? (
                  <p className="text-sm text-amber-400">
                    Please sign in to submit code
                  </p>
                ) : (
                  <div className="text-xs text-slate-500">
                    {sourceCode.length} characters
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleSubmit}
                    disabled={
                      isSubmitting || !currentUser || languageId === null
                    }
                    className="bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="h-4 w-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Submit
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Current Submission Status */}
            {currentSubmission && (
              <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
                <h3 className="text-xs font-medium text-slate-400 mb-3 uppercase tracking-wider">
                  Latest Submission
                </h3>
                <SubmissionStatus submission={currentSubmission} />
              </div>
            )}

            {/* Submission History */}
            {currentUser && (
              <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-700/50 bg-slate-900/50">
                  <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Your Submissions
                  </h3>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  <SubmissionHistory
                    questionId={questionId!}
                    onSelectSubmission={handleSelectHistoricalSubmission}
                    selectedSubmissionId={trackedSubmissionId}
                  />
                </div>
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

interface RichTextNode {
  type?: string;
  content?: RichTextNode[];
  text?: string;
  marks?: { type: string }[];
  attrs?: { level?: number };
}

function renderNode(node: RichTextNode): string {
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
      return `<pre><code>${
        node.content?.map(renderNode).join("") ?? ""
      }</code></pre>`;
    case "heading": {
      const level = node.attrs?.level ?? 1;
      return `<h${level}>${
        node.content?.map(renderNode).join("") ?? ""
      }</h${level}>`;
    }
    case "blockquote":
      return `<blockquote>${
        node.content?.map(renderNode).join("") ?? ""
      }</blockquote>`;
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
