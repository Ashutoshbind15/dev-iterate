import { useQuery } from "convex/react";
import { useParams, Link } from "react-router";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, CheckCircle, Clock, XCircle } from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";

export default function PersonalizedQuestionSetViewPage() {
  const { id } = useParams<{ id: string }>();
  const submissionId = id as Id<"personalizedQuestionSubmissions"> | undefined;

  const submissionData = useQuery(
    api.queries.personalizedQuestions.getSubmissionWithQuestions,
    submissionId ? { submissionId } : "skip"
  );

  const splitAnalysis = (analysis: string): Array<string> => {
    // Backwards-compatible: historically we stored comma-separated analysis.
    return analysis
      .split(/\r?\n|,\s+/g)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
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

  if (!submissionId) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-zinc-600">Missing submission id</p>
          <Link to="/personalized-questions">
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
            <Button variant="outline" className="mb-4 flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to analyses
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-2">
            Personalized Question Set
          </h1>
          <div className="flex items-center gap-2 text-zinc-600">
            {getStatusIcon(submission.status)}
            <span className="capitalize">{submission.status}</span>
            <span className="text-zinc-300">•</span>
            <span>{new Date(submission.createdAt).toLocaleString()}</span>
          </div>
          <div className="mt-3 p-4 bg-zinc-50 rounded-lg border border-zinc-200">
            <p className="text-sm font-medium text-zinc-700 mb-2">
              Analysis used for this set
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-zinc-600">
              {splitAnalysis(submission.analysis).map((item, idx) => (
                <li key={`${submission._id}-${idx}`}>{item}</li>
              ))}
            </ul>
            {submission.errorMessage && (
              <p className="text-sm text-red-600 mt-3">
                <span className="font-medium">Error:</span>{" "}
                {submission.errorMessage}
              </p>
            )}
          </div>
        </div>

        {/* Questions List */}
        {questions.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
            <p className="text-zinc-600">No questions found for this set.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((question, index) => (
              <div
                key={question._id}
                className="bg-zinc-50 rounded-lg p-6 border border-zinc-200 hover:border-zinc-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-4 gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-sm font-medium text-zinc-500">
                        Question {index + 1}
                      </span>
                      <span className="text-zinc-300">•</span>
                      <h3 className="font-semibold text-zinc-900">
                        {question.title}
                      </h3>
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

                {/* Option reveal: only after answering */}
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
                            question.hasAnswered &&
                            optIndex === question.correctAnswer
                              ? "bg-green-50 border-green-200 text-green-900"
                              : "bg-white border-zinc-200 text-zinc-700"
                          }`}
                        >
                          <span className="font-medium mr-2">
                            {String.fromCharCode(65 + optIndex)}.
                          </span>
                          {option}
                          {question.hasAnswered &&
                            optIndex === question.correctAnswer && (
                              <span className="ml-2 text-xs text-green-600">
                                ✓ Correct
                              </span>
                            )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {question.type === "descriptive" && question.hasAnswered && (
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
