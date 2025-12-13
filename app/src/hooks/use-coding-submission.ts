import { useState, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export interface UseCodingSubmissionOptions {
  questionId: Id<"codingQuestions">;
}

export type SubmissionStatus =
  | "queued"
  | "running"
  | "passed"
  | "failed"
  | "error";

export interface FirstFailure {
  stdin?: string;
  actualOutput?: string;
  expectedOutput?: string;
  errorMessage?: string;
}

export interface Submission {
  _id: Id<"codingSubmissions">;
  _creationTime: number;
  questionId: Id<"codingQuestions">;
  userId: Id<"users">;
  languageId: number;
  sourceCode: string;
  status: SubmissionStatus;
  passedCount?: number;
  totalCount?: number;
  firstFailureIndex?: number;
  firstFailure?: FirstFailure;
  stdout?: string;
  stderr?: string;
  compileOutput?: string;
  durationMs?: number;
}

export interface UseCodingSubmissionReturn {
  /** Submit code - returns submissionId */
  submit: (
    sourceCode: string,
    languageId: number
  ) => Promise<Id<"codingSubmissions">>;

  /** Current submission being tracked (for real-time updates) */
  currentSubmission: Submission | null | undefined;

  /** Loading state when submitting */
  isSubmitting: boolean;

  /** Set which submission to track */
  trackSubmission: (submissionId: Id<"codingSubmissions"> | null) => void;

  /** Currently tracked submission ID */
  trackedSubmissionId: Id<"codingSubmissions"> | null;
}

export function useCodingSubmission({
  questionId,
}: UseCodingSubmissionOptions): UseCodingSubmissionReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [trackedSubmissionId, setTrackedSubmissionId] =
    useState<Id<"codingSubmissions"> | null>(null);

  const createSubmission = useMutation(
    api.mutations.codingSubmissions.createCodingSubmission
  );

  // Query for the tracked submission - this provides real-time updates
  const currentSubmission = useQuery(
    api.queries.codingSubmissions.getCodingSubmission,
    trackedSubmissionId ? { submissionId: trackedSubmissionId } : "skip"
  );

  const submit = useCallback(
    async (
      sourceCode: string,
      languageId: number
    ): Promise<Id<"codingSubmissions">> => {
      setIsSubmitting(true);
      try {
        const submissionId = await createSubmission({
          questionId,
          sourceCode,
          languageId,
        });
        return submissionId;
      } finally {
        setIsSubmitting(false);
      }
    },
    [createSubmission, questionId]
  );

  const trackSubmission = useCallback(
    (submissionId: Id<"codingSubmissions"> | null) => {
      setTrackedSubmissionId(submissionId);
    },
    []
  );

  return {
    submit,
    currentSubmission,
    isSubmitting,
    trackSubmission,
    trackedSubmissionId,
  };
}


