import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { CheckCircle2, XCircle, AlertTriangle, Clock, Loader2 } from "lucide-react";
import { JUDGE0_LANGUAGES } from "./language-constants";

interface SubmissionHistoryProps {
  questionId: Id<"codingQuestions">;
  onSelectSubmission?: (submissionId: Id<"codingSubmissions">) => void;
  selectedSubmissionId?: Id<"codingSubmissions"> | null;
}

type SubmissionStatus = "queued" | "running" | "passed" | "failed" | "error";

interface SubmissionSummary {
  _id: Id<"codingSubmissions">;
  _creationTime: number;
  questionId: Id<"codingQuestions">;
  languageId: number;
  status: SubmissionStatus;
  passedCount?: number;
  totalCount?: number;
  durationMs?: number;
}

export function SubmissionHistory({
  questionId,
  onSelectSubmission,
  selectedSubmissionId,
}: SubmissionHistoryProps) {
  const result = useQuery(api.queries.codingSubmissions.listMyCodingSubmissions, {
    questionId,
  });

  if (result === undefined) {
    return (
      <div className="p-4 text-center text-zinc-500">
        <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
        Loading submissions...
      </div>
    );
  }

  const submissions = result.page as SubmissionSummary[];

  if (submissions.length === 0) {
    return (
      <div className="p-4 text-center text-zinc-500 text-sm">
        No submissions yet. Write some code and submit!
      </div>
    );
  }

  return (
    <div className="divide-y divide-zinc-100">
      {submissions.map((submission) => (
        <SubmissionRow
          key={submission._id}
          submission={submission}
          isSelected={selectedSubmissionId === submission._id}
          onClick={() => onSelectSubmission?.(submission._id)}
        />
      ))}
    </div>
  );
}

interface SubmissionRowProps {
  submission: SubmissionSummary;
  isSelected: boolean;
  onClick: () => void;
}

function SubmissionRow({ submission, isSelected, onClick }: SubmissionRowProps) {
  const language = JUDGE0_LANGUAGES.find((l) => l.id === submission.languageId);

  return (
    <button
      onClick={onClick}
      className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors hover:bg-zinc-50 ${
        isSelected ? "bg-zinc-100" : ""
      }`}
    >
      <StatusIcon status={submission.status} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-900">
            {language?.name ?? `Language ${submission.languageId}`}
          </span>
          <StatusBadge status={submission.status} />
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
          <span>{formatTimestamp(submission._creationTime)}</span>
          {submission.passedCount !== undefined &&
            submission.totalCount !== undefined && (
              <>
                <span>·</span>
                <span>
                  {submission.passedCount}/{submission.totalCount} passed
                </span>
              </>
            )}
        </div>
      </div>
    </button>
  );
}

function StatusIcon({ status }: { status: SubmissionStatus }) {
  switch (status) {
    case "queued":
      return <Clock className="h-4 w-4 text-zinc-400 flex-shrink-0" />;
    case "running":
      return <Loader2 className="h-4 w-4 text-blue-500 animate-spin flex-shrink-0" />;
    case "passed":
      return <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />;
    case "failed":
      return <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />;
    case "error":
      return <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />;
  }
}

function StatusBadge({ status }: { status: SubmissionStatus }) {
  const styles: Record<SubmissionStatus, string> = {
    queued: "bg-zinc-100 text-zinc-600",
    running: "bg-blue-100 text-blue-700",
    passed: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
    error: "bg-amber-100 text-amber-700",
  };

  const labels: Record<SubmissionStatus, string> = {
    queued: "Queued",
    running: "Running",
    passed: "Passed",
    failed: "Failed",
    error: "Error",
  };

  return (
    <span
      className={`px-1.5 py-0.5 text-xs font-medium rounded ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}


