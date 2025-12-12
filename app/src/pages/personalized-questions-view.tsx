import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { Link } from "react-router";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Sparkles, Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";

export default function PersonalizedQuestionsViewPage() {
  const submissions = useQuery(
    api.queries.personalizedQuestions.getPersonalizedQuestionSubmissions
  );
  const personalizedQuestions = useQuery(
    api.queries.personalizedQuestions.getPersonalizedQuestions
  );

  const createSubmission = useMutation(
    api.mutations.personalizedQuestions.createPersonalizedQuestionSubmission
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSubmissionId, setSelectedSubmissionId] =
    useState<Id<"personalizedQuestionSubmissions"> | null>(null);

  const splitAnalysis = (analysis: string): Array<string> => {
    // Backwards-compatible: historically we stored comma-separated analysis.
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
        "Personalized question generation started! Check back soon."
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
        return "bg-green-100 text-green-700";
      case "medium":
        return "bg-yellow-100 text-yellow-700";
      case "hard":
        return "bg-red-100 text-red-700";
    }
  };

  const getStatusIcon = (status: "pending" | "completed" | "failed") => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  useEffect(() => {
    if (!submissions || submissions.length === 0) return;
    if (selectedSubmissionId) return;

    const latestCompleted = submissions.find((s) => s.status === "completed");
    setSelectedSubmissionId((latestCompleted ?? submissions[0])._id);
  }, [submissions, selectedSubmissionId]);

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            Personalized Questions
          </h1>
          <p className="text-zinc-500 mt-2">
            Questions generated based on your learning analysis from answered
            questions
          </p>
        </div>

        {/* Create Personalized Questions Section */}
        <div className="mb-8 bg-zinc-50 rounded-lg p-6 border border-zinc-200">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-zinc-900" />
            <h2 className="text-xl font-semibold text-zinc-900">
              Generate Personalized Question Set
            </h2>
          </div>
          <p className="text-zinc-600 mb-4">
            Generate 10 personalized questions based on your learning analysis
            from previous answers. The system will use your existing analysis
            data to create tailored questions.
          </p>
          <Button
            onClick={handleCreatePersonalizedQuestions}
            disabled={isSubmitting}
            className="bg-zinc-900 hover:bg-zinc-800 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Create Personalized Question Set
              </>
            )}
          </Button>
        </div>

        {/* Submissions History */}
        {submissions && submissions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-2">
              Choose an analysis
            </h2>
            <p className="text-sm text-zinc-600 mb-4">
              Each analysis snapshot generates a different question set. Select
              one to preview the analysis, then open its questions.
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
                      className={`w-full text-left bg-zinc-50 rounded-lg p-4 border transition-colors ${
                        isSelected
                          ? "border-zinc-900"
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
                            <p className="text-sm text-red-600 mt-2 line-clamp-2">
                              <span className="font-medium">Error:</span>{" "}
                              {submission.errorMessage}
                            </p>
                          )}
                        </div>
                        <div className="shrink-0">
                          <span className="text-xs font-medium text-zinc-600">
                            {isSelected ? "Selected" : "Select"}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Preview */}
              <div className="bg-white border border-zinc-200 rounded-lg p-5">
                {(() => {
                  const selected = submissions.find(
                    (s) => s._id === selectedSubmissionId
                  );
                  if (!selected) {
                    return (
                      <p className="text-sm text-zinc-600">
                        Select an analysis to preview it.
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
                          <Link
                            to={`/personalized-questions/set/${selected._id}`}
                          >
                            <Button className="bg-zinc-900 hover:bg-zinc-800 text-white">
                              Open question set →
                            </Button>
                          </Link>
                          <p className="text-xs text-zinc-500">
                            Practice from this specific analysis.
                          </p>
                        </div>
                      ) : selected.status === "pending" ? (
                        <div className="text-sm text-zinc-600">
                          This set is still generating. Check back in a bit.
                        </div>
                      ) : (
                        <div className="text-sm text-red-600">
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
              Your Personalized Questions (most recent first)
            </h2>
            <div className="space-y-4">
              {personalizedQuestions.map((question) => (
                <div
                  key={question._id}
                  className="bg-zinc-50 rounded-lg p-4 border border-zinc-200 hover:border-zinc-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="font-semibold text-zinc-900">
                          {question.title}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(
                            question.difficulty
                          )}`}
                        >
                          {question.difficulty}
                        </span>
                        <span className="text-xs text-zinc-500">
                          {question.type === "mcq" ? "MCQ" : "Descriptive"}
                        </span>
                        {question.hasAnswered && (
                          <span
                            className={`text-xs font-medium ${
                              question.isCorrect
                                ? "text-green-700"
                                : "text-red-700"
                            }`}
                          >
                            {question.isCorrect
                              ? "Answered correctly"
                              : "Answered incorrectly"}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-zinc-600 mb-2 line-clamp-2">
                        {question.questionText}
                      </p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {question.tags.slice(0, 6).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-zinc-200 text-zinc-700 text-xs rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-zinc-500">
                        Created {new Date(question.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="shrink-0">
                      <Link
                        to={`/personalized-questions/question/${question._id}`}
                      >
                        <Button className="bg-zinc-900 hover:bg-zinc-800 text-white">
                          Practice →
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
