import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { Link } from "react-router";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Sparkles,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Code2,
  Play,
  Trophy,
} from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";

export default function PersonalizedCodingQuestionsViewPage() {
  const submissions = useQuery(
    api.queries.personalizedCodingQuestions
      .getPersonalizedCodingQuestionSubmissions
  );
  const personalizedQuestions = useQuery(
    api.queries.personalizedCodingQuestions.getPersonalizedCodingQuestions
  );

  const createSubmission = useMutation(
    api.mutations.personalizedCodingQuestions
      .createPersonalizedCodingQuestionSubmission
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSubmissionId, setSelectedSubmissionId] =
    useState<Id<"personalizedCodingQuestionSubmissions"> | null>(null);

  const splitAnalysis = (analysis: string): Array<string> => {
    return analysis
      .split(/\r?\n|,\s+/g)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  };

  const handleCreatePersonalizedQuestions = async () => {
    setIsSubmitting(true);
    try {
      await createSubmission({});
      toast.success(
        "Personalized coding question generation started! Check back soon."
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create submission";
      toast.error(message);
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
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

  useEffect(() => {
    if (!submissions || submissions.length === 0) return;
    if (selectedSubmissionId) return;

    const latestCompleted = submissions.find((s) => s.status === "completed");
    setSelectedSubmissionId((latestCompleted ?? submissions[0])._id);
  }, [submissions, selectedSubmissionId]);

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <div className="bg-white border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg">
              <Code2 className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-zinc-900">
              Personalized Coding Problems
            </h1>
          </div>
          <p className="text-zinc-500 ml-14">
            AI-generated coding challenges based on your submission history
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Create Personalized Questions Section */}
        <div className="mb-8 bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-6 border border-violet-200">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-violet-600" />
            <h2 className="text-xl font-semibold text-zinc-900">
              Generate Personalized Coding Problems
            </h2>
          </div>
          <p className="text-zinc-600 mb-4">
            Generate personalized algorithmic challenges based on your coding
            submission history. The AI analyzes your performance patterns to
            create problems tailored to your skill level.
          </p>
          <Button
            onClick={handleCreatePersonalizedQuestions}
            disabled={isSubmitting}
            className="bg-violet-600 hover:bg-violet-500 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Coding Problems
              </>
            )}
          </Button>
        </div>

        {/* Submissions History */}
        {submissions && submissions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-2">
              Choose a problem set
            </h2>
            <p className="text-sm text-zinc-600 mb-4">
              Each analysis generates a different set of coding problems. Select
              one to preview and start solving.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Selector */}
              <div className="space-y-3">
                {submissions.map((submission) => {
                  const isSelected = submission._id === selectedSubmissionId;
                  return (
                    <button
                      key={submission._id}
                      type="button"
                      onClick={() => setSelectedSubmissionId(submission._id)}
                      className={`w-full text-left bg-white rounded-lg p-4 border transition-all ${
                        isSelected
                          ? "border-violet-500 ring-2 ring-violet-100"
                          : "border-zinc-200 hover:border-zinc-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getStatusIcon(submission.status)}
                            <span className="font-medium text-zinc-900 capitalize">
                              {submission.status}
                            </span>
                            <span className="text-zinc-300">•</span>
                            <span className="text-sm text-zinc-500">
                              {new Date(submission.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-zinc-600 line-clamp-2">
                            {splitAnalysis(submission.analysis).join(" • ")}
                          </p>
                          {submission.errorMessage && (
                            <p className="text-sm text-rose-600 mt-2 line-clamp-2">
                              <span className="font-medium">Error:</span>{" "}
                              {submission.errorMessage}
                            </p>
                          )}
                        </div>
                        <div className="shrink-0">
                          <span
                            className={`text-xs font-medium ${
                              isSelected ? "text-violet-600" : "text-zinc-400"
                            }`}
                          >
                            {isSelected ? "Selected" : "Select"}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Preview */}
              <div className="bg-white border border-zinc-200 rounded-xl p-5">
                {(() => {
                  const selected = submissions.find(
                    (s) => s._id === selectedSubmissionId
                  );
                  if (!selected) {
                    return (
                      <p className="text-sm text-zinc-600">
                        Select a problem set to preview it.
                      </p>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusIcon(selected.status)}
                          <h3 className="font-semibold text-zinc-900">
                            Analysis preview
                          </h3>
                        </div>
                        <p className="text-xs text-zinc-500">
                          {new Date(selected.createdAt).toLocaleString()}
                        </p>
                      </div>

                      <ul className="list-disc pl-5 space-y-1 text-sm text-zinc-700">
                        {splitAnalysis(selected.analysis).map((item, idx) => (
                          <li key={`${selected._id}-${idx}`}>{item}</li>
                        ))}
                      </ul>

                      {selected.status === "completed" ? (
                        <div className="flex items-center gap-2">
                          <Link to={`/personalized-coding/set/${selected._id}`}>
                            <Button className="bg-violet-600 hover:bg-violet-500 text-white">
                              <Play className="h-4 w-4 mr-2" />
                              Start solving →
                            </Button>
                          </Link>
                          <p className="text-xs text-zinc-500">
                            Practice problems from this analysis.
                          </p>
                        </div>
                      ) : selected.status === "pending" ? (
                        <div className="text-sm text-zinc-600 flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          This set is still generating. Check back in a bit.
                        </div>
                      ) : (
                        <div className="text-sm text-rose-600">
                          Generation failed for this set.
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Recent Personalized Questions */}
        {personalizedQuestions && personalizedQuestions.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">
              Your Personalized Problems
            </h2>
            <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
              <div className="divide-y divide-zinc-100">
                {personalizedQuestions.map((question) => (
                  <Link
                    key={question._id}
                    to={`/personalized-coding/${question._id}/solve`}
                    className="flex items-center justify-between px-6 py-4 hover:bg-zinc-50 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-medium text-zinc-900 group-hover:text-zinc-700 truncate">
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
                            Attempted
                          </span>
                        )}
                      </div>
                      {question.tags.length > 0 && (
                        <div className="flex gap-1.5 flex-wrap">
                          {question.tags.slice(0, 4).map((tag) => (
                            <span
                              key={tag}
                              className="px-1.5 py-0.5 text-xs bg-zinc-100 text-zinc-500 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                          {question.tags.length > 4 && (
                            <span className="px-1.5 py-0.5 text-xs text-zinc-400">
                              +{question.tags.length - 4} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4 ml-4">
                      <div className="text-right text-xs text-zinc-400">
                        {question.submissionCount > 0 && (
                          <span>
                            {question.submissionCount} submission
                            {question.submissionCount !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      <Code2 className="h-5 w-5 text-zinc-300 group-hover:text-violet-500 transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {personalizedQuestions &&
          personalizedQuestions.length === 0 &&
          (!submissions || submissions.length === 0) && (
            <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center">
              <Code2 className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-zinc-900 mb-2">
                No personalized problems yet
              </h3>
              <p className="text-zinc-500 text-sm max-w-md mx-auto">
                Submit solutions to coding problems first. After 10 submissions,
                the system will analyze your performance and you can generate
                personalized problems.
              </p>
            </div>
          )}
      </div>
    </div>
  );
}
