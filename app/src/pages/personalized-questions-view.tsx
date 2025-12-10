import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useParams, Link } from "react-router";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ArrowLeft,
  BookOpen,
  Sparkles,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";

export default function PersonalizedQuestionsViewPage() {
  const { id } = useParams<{ id: string }>();
  const submissionId = id as Id<"personalizedQuestionSubmissions"> | undefined;

  const submissions = useQuery(
    api.queries.personalizedQuestions.getPersonalizedQuestionSubmissions
  );
  const personalizedQuestions = useQuery(
    api.queries.personalizedQuestions.getPersonalizedQuestions
  );
  const submissionData = useQuery(
    api.queries.personalizedQuestions.getSubmissionWithQuestions,
    submissionId ? { submissionId } : "skip"
  );

  const createSubmission = useMutation(
    api.mutations.personalizedQuestions.createPersonalizedQuestionSubmission
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // If there's a submission ID, show that specific submission's questions
  if (submissionId) {
    if (submissionData === undefined) {
      return (
        <div className="min-h-screen bg-white p-8">
          <div className="max-w-4xl mx-auto">
            <p className="text-zinc-600">Loading...</p>
          </div>
        </div>
      );
    }

    if (submissionData === null) {
      return (
        <div className="min-h-screen bg-white p-8">
          <div className="max-w-4xl mx-auto">
            <p className="text-zinc-600">Submission not found</p>
            <Link to="/personalized-questions">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Personalized Questions
              </Button>
            </Link>
          </div>
        </div>
      );
    }

    const { submission, questions } = submissionData;

    return (
      <div className="min-h-screen bg-white text-zinc-900 font-sans">
        <div className="max-w-4xl mx-auto p-8">
          {/* Header */}
          <div className="mb-6">
            <Link to="/personalized-questions">
              <Button
                variant="outline"
                className="mb-4 flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Personalized Questions
              </Button>
            </Link>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-2">
              Personalized Questions
            </h1>
            <p className="text-zinc-600">
              Generated on {new Date(submission.createdAt).toLocaleString()}
            </p>
            <div className="mt-2 p-3 bg-zinc-50 rounded-lg border border-zinc-200">
              <p className="text-sm text-zinc-600">
                <span className="font-medium">Analysis:</span>{" "}
                {submission.analysis}
              </p>
            </div>
          </div>

          {/* Questions List */}
          {questions.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
              <p className="text-zinc-600">
                No questions found for this submission.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => (
                <div
                  key={question._id}
                  className="bg-zinc-50 rounded-lg p-6 border border-zinc-200 hover:border-zinc-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-zinc-500">
                          Question {index + 1}
                        </span>
                        <span className="text-zinc-300">•</span>
                        <h3 className="font-semibold text-zinc-900">
                          {question.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(
                            question.difficulty
                          )}`}
                        >
                          {question.difficulty}
                        </span>
                        <span className="px-2 py-1 bg-zinc-200 text-zinc-700 text-xs rounded capitalize">
                          {question.type === "mcq" ? "MCQ" : "Descriptive"}
                        </span>
                        {question.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {question.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="prose prose-sm max-w-none">
                        <p className="text-zinc-700 whitespace-pre-wrap">
                          {question.questionText}
                        </p>
                      </div>
                      {question.type === "mcq" && question.options && (
                        <div className="mt-4 space-y-2">
                          <p className="text-sm font-medium text-zinc-700 mb-2">
                            Options:
                          </p>
                          <ul className="space-y-2">
                            {question.options.map((option, optIndex) => (
                              <li
                                key={optIndex}
                                className={`px-3 py-2 rounded border ${
                                  optIndex === question.correctAnswer
                                    ? "bg-green-50 border-green-200 text-green-900"
                                    : "bg-white border-zinc-200 text-zinc-700"
                                }`}
                              >
                                <span className="font-medium mr-2">
                                  {String.fromCharCode(65 + optIndex)}.
                                </span>
                                {option}
                                {optIndex === question.correctAnswer && (
                                  <span className="ml-2 text-xs text-green-600">
                                    ✓ Correct
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {question.type === "descriptive" && (
                        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                          <p className="text-sm font-medium text-green-900 mb-1">
                            Correct Answer:
                          </p>
                          <p className="text-sm text-green-800">
                            {question.correctAnswer}
                          </p>
                        </div>
                      )}
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

  // Main page: show all submissions and questions
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
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">
              Submission History
            </h2>
            <div className="space-y-3">
              {submissions.map((submission) => (
                <div
                  key={submission._id}
                  className="bg-zinc-50 rounded-lg p-4 border border-zinc-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(submission.status)}
                        <span className="font-medium text-zinc-900 capitalize">
                          {submission.status}
                        </span>
                        <span className="text-sm text-zinc-500">
                          {new Date(submission.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-600 mb-2">
                        <span className="font-medium">Analysis:</span>{" "}
                        {submission.analysis}
                      </p>
                      {submission.errorMessage && (
                        <p className="text-sm text-red-600">
                          <span className="font-medium">Error:</span>{" "}
                          {submission.errorMessage}
                        </p>
                      )}
                    </div>
                    {submission.status === "completed" && (
                      <Link
                        to={`/personalized-questions/${submission._id}`}
                        className="text-sm text-zinc-900 hover:text-zinc-700 font-medium"
                      >
                        View Questions →
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Personalized Questions */}
        {personalizedQuestions && personalizedQuestions.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">
              Your Personalized Questions
            </h2>
            <div className="space-y-4">
              {personalizedQuestions.slice(0, 5).map((question) => {
                const submission = submissions?.find(
                  (s) => s._id === question.submissionId
                );
                return (
                  <div
                    key={question._id}
                    className="bg-zinc-50 rounded-lg p-4 border border-zinc-200 hover:border-zinc-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
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
                        </div>
                        <p className="text-sm text-zinc-600 mb-2 line-clamp-2">
                          {question.questionText}
                        </p>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {question.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-zinc-200 text-zinc-700 text-xs rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        {submission && (
                          <Link
                            to={`/personalized-questions/${submission._id}`}
                            className="text-xs text-zinc-600 hover:text-zinc-900 underline"
                          >
                            View all questions from this set →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
