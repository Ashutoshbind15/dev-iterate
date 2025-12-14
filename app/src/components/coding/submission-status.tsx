import { Loader2, CheckCircle2, XCircle, AlertTriangle, Clock } from "lucide-react";
import type { Submission } from "@/hooks/use-coding-submission";

interface SubmissionStatusProps {
  submission: Submission;
  compact?: boolean;
}

export function SubmissionStatus({ submission, compact = false }: SubmissionStatusProps) {
  const { status, passedCount, totalCount, firstFailureIndex, firstFailure } =
    submission;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <StatusIcon status={status} size="sm" />
        <span className="text-sm font-medium text-slate-200">
          <StatusLabel status={status} />
        </span>
        {(status === "passed" || status === "failed") &&
          passedCount !== undefined &&
          totalCount !== undefined && (
            <span className="text-xs text-slate-500">
              ({passedCount}/{totalCount})
            </span>
          )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-700/50 bg-slate-900/50 overflow-hidden">
      {/* Status Header */}
      <div className={`px-4 py-3 flex items-center gap-3 ${getStatusHeaderBg(status)}`}>
        <StatusIcon status={status} />
        <div className="flex-1">
          <p className="font-semibold text-slate-100">
            <StatusLabel status={status} />
          </p>
          {(status === "passed" || status === "failed") &&
            passedCount !== undefined &&
            totalCount !== undefined && (
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden max-w-[120px]">
                  <div
                    className={`h-full rounded-full transition-all ${
                      status === "passed" ? "bg-emerald-500" : "bg-red-500"
                    }`}
                    style={{ width: `${(passedCount / totalCount) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400">
                  {passedCount}/{totalCount} passed
                </span>
              </div>
            )}
        </div>
        {submission.durationMs !== undefined &&
          status !== "queued" &&
          status !== "running" && (
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Clock className="h-3 w-3" />
              {(submission.durationMs / 1000).toFixed(2)}s
            </div>
          )}
      </div>

      {/* Failure Details */}
      {status === "failed" && firstFailure && (
        <div className="border-t border-slate-700/50">
          <FailureDetails failureIndex={firstFailureIndex} failure={firstFailure} />
        </div>
      )}

      {/* Error Details */}
      {status === "error" && firstFailure?.errorMessage && (
        <div className="border-t border-slate-700/50 p-4 bg-red-500/5">
          <p className="text-xs font-medium text-red-400 mb-2 uppercase tracking-wider">
            System Error
          </p>
          <pre className="text-sm text-red-300 whitespace-pre-wrap font-mono bg-red-500/10 p-3 rounded border border-red-500/20 overflow-x-auto">
            {firstFailure.errorMessage}
          </pre>
        </div>
      )}

      {/* Compile Output */}
      {submission.compileOutput && (
        <div className="border-t border-slate-700/50 p-4 bg-amber-500/5">
          <p className="text-xs font-medium text-amber-400 mb-2 uppercase tracking-wider">
            Compile Output
          </p>
          <pre className="text-sm text-amber-300 whitespace-pre-wrap font-mono bg-amber-500/10 p-3 rounded border border-amber-500/20 overflow-x-auto max-h-40 overflow-y-auto">
            {submission.compileOutput}
          </pre>
        </div>
      )}

      {/* Stderr (runtime errors) */}
      {submission.stderr && (
        <div className="border-t border-slate-700/50 p-4 bg-orange-500/5">
          <p className="text-xs font-medium text-orange-400 mb-2 uppercase tracking-wider">
            Runtime Error
          </p>
          <pre className="text-sm text-orange-300 whitespace-pre-wrap font-mono bg-orange-500/10 p-3 rounded border border-orange-500/20 overflow-x-auto max-h-40 overflow-y-auto">
            {submission.stderr}
          </pre>
        </div>
      )}
    </div>
  );
}

function getStatusHeaderBg(status: Submission["status"]): string {
  switch (status) {
    case "queued":
      return "bg-slate-800/50";
    case "running":
      return "bg-blue-500/10 border-b border-blue-500/20";
    case "passed":
      return "bg-emerald-500/10 border-b border-emerald-500/20";
    case "failed":
      return "bg-red-500/10 border-b border-red-500/20";
    case "error":
      return "bg-amber-500/10 border-b border-amber-500/20";
  }
}

function StatusIcon({
  status,
  size = "md",
}: {
  status: Submission["status"];
  size?: "sm" | "md";
}) {
  const sizeClass = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  switch (status) {
    case "queued":
      return <Clock className={`${sizeClass} text-slate-400`} />;
    case "running":
      return <Loader2 className={`${sizeClass} text-blue-400 animate-spin`} />;
    case "passed":
      return <CheckCircle2 className={`${sizeClass} text-emerald-400`} />;
    case "failed":
      return <XCircle className={`${sizeClass} text-red-400`} />;
    case "error":
      return <AlertTriangle className={`${sizeClass} text-amber-400`} />;
  }
}

function StatusLabel({ status }: { status: Submission["status"] }) {
  switch (status) {
    case "queued":
      return "Queued";
    case "running":
      return "Running tests...";
    case "passed":
      return "All tests passed!";
    case "failed":
      return "Tests failed";
    case "error":
      return "System error";
  }
}

interface FailureDetailsProps {
  failureIndex?: number;
  failure: NonNullable<Submission["firstFailure"]>;
}

function FailureDetails({ failureIndex, failure }: FailureDetailsProps) {
  return (
    <div className="p-4 space-y-4">
      <p className="text-xs font-medium text-red-400 uppercase tracking-wider">
        First failure: Test #{(failureIndex ?? 0) + 1}
      </p>

      {/* Error message (TLE, runtime error, wrong answer) */}
      {failure.errorMessage && (
        <div>
          <p className="text-[10px] uppercase tracking-wider font-medium text-slate-500 mb-1.5">
            Error
          </p>
          <pre className="text-sm text-red-300 whitespace-pre-wrap font-mono bg-red-500/10 p-3 rounded border border-red-500/20">
            {failure.errorMessage}
          </pre>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Input (only shown for public testcases) */}
        {failure.stdin !== undefined && (
          <div>
            <p className="text-[10px] uppercase tracking-wider font-medium text-slate-500 mb-1.5">
              Input
            </p>
            <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono bg-slate-800 p-3 rounded border border-slate-700 max-h-32 overflow-y-auto">
              {failure.stdin || "(empty)"}
            </pre>
          </div>
        )}

        {/* Expected output (only shown for public testcases) */}
        {failure.expectedOutput !== undefined && (
          <div>
            <p className="text-[10px] uppercase tracking-wider font-medium text-slate-500 mb-1.5">
              Expected
            </p>
            <pre className="text-sm text-emerald-300 whitespace-pre-wrap font-mono bg-emerald-500/10 p-3 rounded border border-emerald-500/20 max-h-32 overflow-y-auto">
              {failure.expectedOutput || "(empty)"}
            </pre>
          </div>
        )}
      </div>

      {/* Actual output */}
      {failure.actualOutput !== undefined && (
        <div>
          <p className="text-[10px] uppercase tracking-wider font-medium text-slate-500 mb-1.5">
            Your Output
          </p>
          <pre className="text-sm text-red-300 whitespace-pre-wrap font-mono bg-red-500/10 p-3 rounded border border-red-500/20 max-h-32 overflow-y-auto">
            {failure.actualOutput || "(empty)"}
          </pre>
        </div>
      )}
    </div>
  );
}
