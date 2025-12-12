import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useParams, useNavigate, Link } from "react-router";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";

export default function PersonalizedQuestionViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [answer, setAnswer] = useState("");

  const personalizedQuestionId = id as Id<"personalizedQuestions"> | undefined;
  const question = useQuery(
    api.queries.personalizedQuestions.getPersonalizedQuestion,
    personalizedQuestionId ? { id: personalizedQuestionId } : "skip"
  );

  const submitAnswer = useMutation(
    api.mutations.personalizedQuestions.submitPersonalizedAnswer
  );

  const handleSubmitAnswer = async () => {
    if (!personalizedQuestionId || !answer.trim()) {
      toast.error("Please enter an answer");
      return;
    }

    try {
      const result = await submitAnswer({
        personalizedQuestionId,
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
            Personalized question not found
          </h1>
          <Link to="/personalized-questions">
            <Button variant="outline">Back to Personalized Questions</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans">
      <div className="max-w-4xl mx-auto p-8">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate("/personalized-questions")}
            className="mb-4 flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Personalized Questions
          </Button>
        </div>

        <div className="bg-white border border-zinc-200 rounded-lg p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-zinc-900 mb-4">
                {question.title}
              </h1>
              <div className="flex items-center gap-4 text-sm mb-4 flex-wrap">
                <span className="px-3 py-1 bg-zinc-100 rounded capitalize">
                  {question.type === "mcq" ? "MCQ" : "Descriptive"}
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

          <p className="text-zinc-700 mb-6 whitespace-pre-wrap text-lg">
            {question.questionText}
          </p>

          {/* Show options for MCQ (always), but only reveal which one is correct after answering */}
          {question.type === "mcq" && question.options && (
            <div className="border-t border-zinc-200 pt-6 mb-6">
              <h3 className="font-semibold text-zinc-900 mb-4 text-lg">
                Options
              </h3>
              <div className="space-y-2">
                {question.options.map((option, index) => {
                  const showCorrect =
                    question.hasAnswered && index === question.correctAnswer;
                  return (
                    <div
                      key={index}
                      className={`w-full text-left p-4 rounded-md border ${
                        showCorrect
                          ? "bg-green-50 border-green-200 text-green-900"
                          : "border-zinc-300 bg-zinc-50"
                      }`}
                    >
                      {option}
                      {showCorrect && (
                        <span className="ml-2 text-xs text-green-600">
                          ✓ Correct
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Answer Status */}
          {question.hasAnswered && (
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
                You have already submitted an answer to this personalized
                question.
              </p>
            </div>
          )}

          {/* Answer Form */}
          {!question.hasAnswered && (
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

          {/* For descriptive, show the correct answer after answering */}
          {question.type === "descriptive" && question.hasAnswered && (
            <div className="border-t border-zinc-200 pt-6">
              <div className="p-3 bg-green-50 border border-green-200 rounded">
                <p className="text-sm font-medium text-green-900 mb-1">
                  Correct Answer:
                </p>
                <p className="text-sm text-green-800">{question.correctAnswer}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


