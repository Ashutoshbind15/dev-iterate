import { useState, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export interface UsePersonalizedCodingSubmissionOptions {
  questionId: Id<"personalizedCodingQuestions">;
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

export interface PersonalizedSubmission {
  _id: Id<"personalizedCodingSubmissions">;
  _creationTime: number;
  questionId: Id<"personalizedCodingQuestions">;
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

export interface UsePersonalizedCodingSubmissionReturn {
  /** Submit code - returns submissionId */
  submit: (
    sourceCode: string,
    languageId: number
  ) => Promise<Id<"personalizedCodingSubmissions">>;

  /** Current submission being tracked (for real-time updates) */
  currentSubmission: PersonalizedSubmission | null | undefined;

  /** Loading state when submitting */
  isSubmitting: boolean;

  /** Set which submission to track */
  trackSubmission: (
    submissionId: Id<"personalizedCodingSubmissions"> | null
  ) => void;

  /** Currently tracked submission ID */
  trackedSubmissionId: Id<"personalizedCodingSubmissions"> | null;
}

export function usePersonalizedCodingSubmission({
  questionId,
}: UsePersonalizedCodingSubmissionOptions): UsePersonalizedCodingSubmissionReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [trackedSubmissionId, setTrackedSubmissionId] =
    useState<Id<"personalizedCodingSubmissions"> | null>(null);

  const createSubmission = useMutation(
    api.mutations.personalizedCodingSubmissions
      .createPersonalizedCodingSubmission
  );

  // Query for the tracked submission - this provides real-time updates
  const currentSubmission = useQuery(
    api.queries.personalizedCodingQuestions.getPersonalizedCodingSubmission,
    trackedSubmissionId ? { submissionId: trackedSubmissionId } : "skip"
  );

  const submit = useCallback(
    async (
      sourceCode: string,
      languageId: number
    ): Promise<Id<"personalizedCodingSubmissions">> => {
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
    (submissionId: Id<"personalizedCodingSubmissions"> | null) => {
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
