import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useParams, Link, useNavigate } from "react-router";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ThumbsUp,
  ThumbsDown,
  Star,
  CheckCircle,
  XCircle,
  ArrowLeft,
} from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";

export default function QuestionViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [answer, setAnswer] = useState("");

  const currentUser = useQuery(api.queries.user.getCurrentUser);

  const questionId = id as Id<"questions"> | undefined;
  const question = useQuery(
    api.queries.questions.getQuestion,
    questionId ? { id: questionId } : "skip"
  );

  const submitAnswer = useMutation(api.mutations.questions.submitAnswer);
  const voteQuestion = useMutation(api.mutations.questions.voteQuestion);
  const starQuestion = useMutation(api.mutations.questions.starQuestion);

  const handleSubmitAnswer = async () => {
    if (!questionId || !answer.trim()) {
      toast.error("Please enter an answer");
      return;
    }

    try {
      const result = await submitAnswer({
        questionId,
        answer: answer.trim(),
      });
      if (result.isCorrect) {
        toast.success("Correct! Well done!");
      } else {
        toast.error("Incorrect. Try again!");
      }
      setAnswer("");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to submit answer";
      toast.error(message);
      console.error(error);
    }
  };

  const handleVote = async (voteType: "upvote" | "downvote") => {
    if (!questionId) return;
    try {
      await voteQuestion({ questionId, voteType });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to vote";
      toast.error(message);
      console.error(error);
    }
  };

  const handleStar = async () => {
    if (!questionId) return;
    try {
      await starQuestion({ questionId });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to star question";
      toast.error(message);
      console.error(error);
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

  if (question === undefined) {
    return (
      <div className="min-h-screen bg-white p-8 flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  if (question === null) {
    return (
      <div className="min-h-screen bg-white p-8 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-900 mb-4">
            Question not found
          </h1>
          <Link to="/corpus">
            <Button variant="outline">Back to Corpus</Button>
          </Link>
        </div>
      </div>
    );
  }

  const score = question.upvotes - question.downvotes;

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans">
      <div className="max-w-4xl mx-auto p-8">
        {/* Header with back button */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate("/corpus")}
            className="mb-4 flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Corpus
          </Button>
        </div>

        {/* Question Card */}
        <div className="bg-white border border-zinc-200 rounded-lg p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-zinc-900 mb-4">
                {question.title}
              </h1>
              <div className="flex items-center gap-4 text-sm mb-4 flex-wrap">
                <span className="px-3 py-1 bg-zinc-100 rounded capitalize">
                  {question.type}
                </span>
                <span
                  className={`px-3 py-1 rounded capitalize ${getDifficultyColor(
                    question.difficulty
                  )}`}
                >
                  {question.difficulty}
                </span>
                {question.tags.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {question.tags.map((tag: string) => (
                      <span
                        key={tag}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Voting and Starring Actions */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-zinc-200">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleVote("upvote")}
                disabled={!currentUser}
                className={`p-2 rounded transition-colors ${
                  !currentUser
                    ? "text-zinc-300 cursor-not-allowed"
                    : question.userVote === "upvote"
                    ? "text-green-600 bg-green-50"
                    : "text-zinc-400 hover:text-green-600 hover:bg-green-50"
                }`}
              >
                <ThumbsUp className="h-5 w-5" />
              </button>
              <span className="text-sm font-medium text-zinc-700 min-w-[2rem] text-center">
                {question.upvotes}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleVote("downvote")}
                disabled={!currentUser}
                className={`p-2 rounded transition-colors ${
                  !currentUser
                    ? "text-zinc-300 cursor-not-allowed"
                    : question.userVote === "downvote"
                    ? "text-red-600 bg-red-50"
                    : "text-zinc-400 hover:text-red-600 hover:bg-red-50"
                }`}
              >
                <ThumbsDown className="h-5 w-5" />
              </button>
              <span className="text-sm font-medium text-zinc-700 min-w-[2rem] text-center">
                {question.downvotes}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-sm font-medium ${
                  score >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                Score: {score}
              </span>
            </div>
            <div className="flex-1" />
            <button
              onClick={handleStar}
              disabled={!currentUser}
              className={`p-2 rounded transition-colors ${
                !currentUser
                  ? "text-zinc-300 cursor-not-allowed"
                  : question.isStarred
                  ? "text-yellow-500 bg-yellow-50"
                  : "text-zinc-400 hover:text-yellow-500 hover:bg-yellow-50"
              }`}
            >
              <Star
                className={`h-5 w-5 ${
                  question.isStarred ? "fill-current" : ""
                }`}
              />
            </button>
          </div>

          {/* Question Text */}
          <p className="text-zinc-700 mb-6 whitespace-pre-wrap text-lg">
            {question.questionText}
          </p>

          {/* Show options for MCQ - hide for authenticated users who haven't answered (they'll see it in the answer form) */}
          {question.type === "mcq" && question.options && !(currentUser && !question.hasAnswered) && (
            <div className="border-t border-zinc-200 pt-6 mb-6">
              <h3 className="font-semibold text-zinc-900 mb-4 text-lg">
                Options
              </h3>
              <div className="space-y-2">
                {question.options.map((option, index) => (
                  <div
                    key={index}
                    className="w-full text-left p-4 rounded-md border border-zinc-300 bg-zinc-50"
                  >
                    {option}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Answer Status - only show when authenticated */}
          {currentUser && question.hasAnswered && (
            <div className="border-t border-zinc-200 pt-6 mb-6">
              <div className="flex items-center gap-2 mb-2">
                {question.isCorrect ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-green-600 font-semibold">
                      You answered correctly!
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-600" />
                    <span className="text-red-600 font-semibold">
                      Your answer was incorrect.
                    </span>
                  </>
                )}
              </div>
              <p className="text-sm text-zinc-500">
                You have already submitted an answer to this question.
              </p>
            </div>
          )}

          {/* Answer Form - only show when authenticated */}
          {currentUser && !question.hasAnswered && (
            <div className="border-t border-zinc-200 pt-6">
              <h3 className="font-semibold text-zinc-900 mb-4 text-lg">
                Your Answer
              </h3>
              {question.type === "mcq" ? (
                <div className="space-y-2">
                  {question.options?.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => setAnswer(String(index))}
                      className={`w-full text-left p-4 rounded-md border transition-colors ${
                        answer === String(index)
                          ? "border-zinc-900 bg-zinc-50"
                          : "border-zinc-300 hover:border-zinc-400"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              ) : (
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Enter your answer..."
                  rows={6}
                  className="w-full px-4 py-3 rounded-md border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent resize-y"
                />
              )}
              <div className="mt-4 flex gap-2">
                <Button
                  onClick={handleSubmitAnswer}
                  disabled={!answer.trim()}
                  className="bg-zinc-900 hover:bg-zinc-800 text-white"
                >
                  Submit Answer
                </Button>
                <Button variant="outline" onClick={() => setAnswer("")}>
                  Clear
                </Button>
              </div>
            </div>
          )}

          {/* Show message when not authenticated */}
          {!currentUser && (
            <div className="border-t border-zinc-200 pt-6">
              <p className="text-sm text-zinc-500 italic">
                Sign in to submit an answer to this question.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
