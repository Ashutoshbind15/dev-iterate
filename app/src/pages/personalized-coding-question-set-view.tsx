import { useQuery } from "convex/react";
import { useParams, Link } from "react-router";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Code2,
  CheckCircle,
  Clock,
  XCircle,
  Play,
  Trophy,
} from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";

export default function PersonalizedCodingQuestionSetViewPage() {
  const { id } = useParams<{ id: string }>();
  const submissionId = id as
    | Id<"personalizedCodingQuestionSubmissions">
    | undefined;

  const submissionData = useQuery(
    api.queries.personalizedCodingQuestions
      .getPersonalizedCodingSubmissionWithQuestions,
    submissionId ? { submissionId } : "skip"
  );

  const splitAnalysis = (analysis: string): Array<string> => {
    return analysis
      .split(/\r?\n|,\s+/g)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  };

  const getDifficultyColor = (difficulty: "easy" | "medium" | "hard") => {
    switch (difficulty) {
      case "easy":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "medium":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "hard":
        return "bg-rose-100 text-rose-700 border-rose-200";
    }
  };

  const getStatusIcon = (status: "pending" | "completed" | "failed") => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-amber-600" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-emerald-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-rose-600" />;
    }
  };

  if (!submissionId) {
    return (
      <div className="min-h-screen bg-zinc-50 p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-zinc-600">Missing submission id</p>
          <Link to="/personalized-coding">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (submissionData === undefined) {
    return (
      <div className="min-h-screen bg-zinc-50 p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-zinc-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (submissionData === null) {
    return (
      <div className="min-h-screen bg-zinc-50 p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-zinc-600">Problem set not found</p>
          <Link to="/personalized-coding">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Personalized Coding
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { submission, questions } = submissionData;

  const solvedCount = questions.filter((q) => q.hasPassed).length;
  const attemptedCount = questions.filter((q) => q.hasSubmitted).length;

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <div className="bg-white border-b border-zinc-200">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <Link to="/personalized-coding">
            <Button
              variant="ghost"
              className="mb-4 -ml-2 text-zinc-600 hover:text-zinc-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to problem sets
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg">
              <Code2 className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-zinc-900">
              Personalized Problem Set
            </h1>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 text-zinc-600">
              {getStatusIcon(submission.status)}
              <span className="capitalize">{submission.status}</span>
            </div>
            <span className="text-zinc-300">•</span>
            <span className="text-zinc-500">
              {new Date(submission.createdAt).toLocaleString()}
            </span>
            {questions.length > 0 && (
              <>
                <span className="text-zinc-300">•</span>
                <span className="text-zinc-500">
                  {solvedCount}/{questions.length} solved
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Analysis Card */}
        <div className="bg-white rounded-xl border border-zinc-200 p-5 mb-8">
          <p className="text-sm font-medium text-zinc-700 mb-3">
            Analysis used for this problem set
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm text-zinc-600">
            {splitAnalysis(submission.analysis).map((item, idx) => (
              <li key={`${submission._id}-${idx}`}>{item}</li>
            ))}
          </ul>
          {submission.errorMessage && (
            <p className="text-sm text-rose-600 mt-3">
              <span className="font-medium">Error:</span>{" "}
              {submission.errorMessage}
            </p>
          )}
        </div>

        {/* Progress Summary */}
        {questions.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-zinc-200 p-4 text-center">
              <div className="text-2xl font-bold text-zinc-900">
                {questions.length}
              </div>
              <div className="text-sm text-zinc-500">Total Problems</div>
            </div>
            <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4 text-center">
              <div className="text-2xl font-bold text-emerald-700">
                {solvedCount}
              </div>
              <div className="text-sm text-emerald-600">Solved</div>
            </div>
            <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 text-center">
              <div className="text-2xl font-bold text-amber-700">
                {attemptedCount - solvedCount}
              </div>
              <div className="text-sm text-amber-600">In Progress</div>
            </div>
          </div>
        )}

        {/* Questions List */}
        {questions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-zinc-200">
            <Code2 className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
            <p className="text-zinc-600">No problems found for this set.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((question, index) => (
              <div
                key={question._id}
                className={`bg-white rounded-xl border transition-colors ${
                  question.hasPassed
                    ? "border-emerald-200"
                    : "border-zinc-200 hover:border-zinc-300"
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        <span className="text-sm font-medium text-zinc-400">
                          #{index + 1}
                        </span>
                        <h3 className="font-semibold text-zinc-900 truncate">
                          {question.title}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium border capitalize ${getDifficultyColor(
                            question.difficulty
                          )}`}
                        >
                          {question.difficulty}
                        </span>
                        {question.hasPassed && (
                          <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                            <Trophy className="h-3 w-3" />
                            Solved
                          </span>
                        )}
                        {question.hasSubmitted && !question.hasPassed && (
                          <span className="text-xs text-amber-600 font-medium">
                            Attempted ({question.submissionCount})
                          </span>
                        )}
                      </div>

                      {question.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {question.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 bg-zinc-100 text-zinc-600 text-xs rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="text-xs text-zinc-400">
                        Time: {question.timeLimitSeconds}s • Memory:{" "}
                        {question.memoryLimitMb}MB
                      </div>
                    </div>

                    <div className="shrink-0">
                      <Link to={`/personalized-coding/${question._id}/solve`}>
                        <Button
                          className={
                            question.hasPassed
                              ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                              : "bg-violet-600 hover:bg-violet-500 text-white"
                          }
                        >
                          <Play className="h-4 w-4 mr-2" />
                          {question.hasPassed ? "Review" : "Solve"}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
