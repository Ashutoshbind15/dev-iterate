import { Loader2, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import type { Submission } from "@/hooks/use-coding-submission";

interface SubmissionStatusProps {
  submission: Submission;
}

export function SubmissionStatus({ submission }: SubmissionStatusProps) {
  const { status, passedCount, totalCount, firstFailureIndex, firstFailure } =
    submission;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 space-y-3">
      {/* Status Header */}
      <div className="flex items-center gap-3">
        <StatusIcon status={status} />
        <div>
          <p className="font-semibold text-zinc-900">
            <StatusLabel status={status} />
          </p>
          {(status === "passed" || status === "failed") &&
            passedCount !== undefined &&
            totalCount !== undefined && (
              <p className="text-sm text-zinc-500">
                {passedCount}/{totalCount} test cases passed
              </p>
            )}
        </div>
      </div>

      {/* Failure Details */}
      {status === "failed" && firstFailure && (
        <FailureDetails
          failureIndex={firstFailureIndex}
          failure={firstFailure}
        />
      )}

      {/* Error Details */}
      {status === "error" && firstFailure?.errorMessage && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm font-medium text-red-800 mb-1">System Error</p>
          <pre className="text-xs text-red-700 whitespace-pre-wrap font-mono">
            {firstFailure.errorMessage}
          </pre>
        </div>
      )}

      {/* Compile Output */}
      {submission.compileOutput && (
        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
          <p className="text-sm font-medium text-amber-800 mb-1">
            Compile Output
          </p>
          <pre className="text-xs text-amber-700 whitespace-pre-wrap font-mono overflow-x-auto max-h-40 overflow-y-auto">
            {submission.compileOutput}
          </pre>
        </div>
      )}

      {/* Stderr (runtime errors) */}
      {submission.stderr && (
        <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-md">
          <p className="text-sm font-medium text-orange-800 mb-1">
            Runtime Error
          </p>
          <pre className="text-xs text-orange-700 whitespace-pre-wrap font-mono overflow-x-auto max-h-40 overflow-y-auto">
            {submission.stderr}
          </pre>
        </div>
      )}

      {/* Duration */}
      {submission.durationMs !== undefined && status !== "queued" && status !== "running" && (
        <p className="text-xs text-zinc-400">
          Completed in {(submission.durationMs / 1000).toFixed(2)}s
        </p>
      )}
    </div>
  );
}

function StatusIcon({ status }: { status: Submission["status"] }) {
  switch (status) {
    case "queued":
    case "running":
      return <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />;
    case "passed":
      return <CheckCircle2 className="h-6 w-6 text-green-500" />;
    case "failed":
      return <XCircle className="h-6 w-6 text-red-500" />;
    case "error":
      return <AlertTriangle className="h-6 w-6 text-amber-500" />;
  }
}

function StatusLabel({ status }: { status: Submission["status"] }) {
  switch (status) {
    case "queued":
      return "Submission queued...";
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
    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md space-y-3">
      <p className="text-sm font-medium text-red-800">
        First failure: Test case #{(failureIndex ?? 0) + 1}
      </p>

      {/* Error message (TLE, runtime error, wrong answer) */}
      {failure.errorMessage && (
        <div>
          <p className="text-xs font-medium text-red-700 mb-1">Error</p>
          <pre className="text-xs text-red-600 whitespace-pre-wrap font-mono bg-red-100/50 p-2 rounded">
            {failure.errorMessage}
          </pre>
        </div>
      )}

      {/* Input (only shown for public testcases) */}
      {failure.stdin !== undefined && (
        <div>
          <p className="text-xs font-medium text-red-700 mb-1">Input</p>
          <pre className="text-xs text-zinc-700 whitespace-pre-wrap font-mono bg-white p-2 rounded border border-red-100 max-h-24 overflow-y-auto">
            {failure.stdin || "(empty)"}
          </pre>
        </div>
      )}

      {/* Expected output (only shown for public testcases) */}
      {failure.expectedOutput !== undefined && (
        <div>
          <p className="text-xs font-medium text-red-700 mb-1">Expected Output</p>
          <pre className="text-xs text-zinc-700 whitespace-pre-wrap font-mono bg-white p-2 rounded border border-red-100 max-h-24 overflow-y-auto">
            {failure.expectedOutput || "(empty)"}
          </pre>
        </div>
      )}

      {/* Actual output */}
      {failure.actualOutput !== undefined && (
        <div>
          <p className="text-xs font-medium text-red-700 mb-1">Your Output</p>
          <pre className="text-xs text-zinc-700 whitespace-pre-wrap font-mono bg-white p-2 rounded border border-red-100 max-h-24 overflow-y-auto">
            {failure.actualOutput || "(empty)"}
          </pre>
        </div>
      )}
    </div>
  );
}


