import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { Plus, ArrowLeft } from "lucide-react";
import { Link } from "react-router";

export default function ContributeQuestionPage() {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"mcq" | "descriptive">("mcq");
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [correctAnswer, setCorrectAnswer] = useState<string>("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [tags, setTags] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createQuestion = useMutation(api.mutations.questions.createQuestion);
  const navigate = useNavigate();

  const handleAddOption = () => {
    setOptions([...options, ""]);
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
      // Reset correct answer if it was the removed option
      if (parseInt(correctAnswer) === index) {
        setCorrectAnswer("");
      } else if (parseInt(correctAnswer) > index) {
        setCorrectAnswer(String(parseInt(correctAnswer) - 1));
      }
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    if (!questionText.trim()) {
      toast.error("Please enter the question text");
      return;
    }

    if (type === "mcq") {
      const validOptions = options.filter((opt) => opt.trim() !== "");
      if (validOptions.length < 2) {
        toast.error("Please provide at least 2 options");
        return;
      }
      if (correctAnswer === "" || isNaN(parseInt(correctAnswer))) {
        toast.error("Please select the correct answer");
        return;
      }
      const correctIndex = parseInt(correctAnswer);
      if (correctIndex < 0 || correctIndex >= validOptions.length) {
        toast.error("Invalid correct answer selection");
        return;
      }

      setIsSubmitting(true);
      try {
        const tagArray = tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0);
        await createQuestion({
          title: title.trim(),
          type: "mcq",
          questionText: questionText.trim(),
          options: validOptions,
          correctAnswer: correctIndex,
          difficulty,
          tags: tagArray,
        });
        toast.success("Question created successfully!");
        navigate("/corpus");
      } catch (error: any) {
        toast.error(error.message || "Failed to create question");
        console.error(error);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      if (!correctAnswer.trim()) {
        toast.error("Please provide the correct answer");
        return;
      }

      setIsSubmitting(true);
      try {
        const tagArray = tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0);
        await createQuestion({
          title: title.trim(),
          type: "descriptive",
          questionText: questionText.trim(),
          correctAnswer: correctAnswer.trim(),
          difficulty,
          tags: tagArray,
        });
        toast.success("Question created successfully!");
        navigate("/corpus");
      } catch (error: any) {
        toast.error(error.message || "Failed to create question");
        console.error(error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans">
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/corpus"
            className="inline-flex items-center gap-2 text-zinc-600 hover:text-zinc-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Corpus
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            Contribute a Question
          </h1>
          <p className="text-zinc-500 mt-2">
            Add a new question to help others learn and practice
          </p>
        </div>

        {/* Question Type Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-zinc-700 mb-2">
            Question Type
          </label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => {
                setType("mcq");
                setCorrectAnswer("");
              }}
              className={`px-4 py-2 rounded-md border transition-colors ${
                type === "mcq"
                  ? "bg-zinc-900 text-white border-zinc-900"
                  : "bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-50"
              }`}
            >
              Multiple Choice (MCQ)
            </button>
            <button
              type="button"
              onClick={() => {
                setType("descriptive");
                setOptions(["", ""]);
                setCorrectAnswer("");
              }}
              className={`px-4 py-2 rounded-md border transition-colors ${
                type === "descriptive"
                  ? "bg-zinc-900 text-white border-zinc-900"
                  : "bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-50"
              }`}
            >
              Descriptive Answer
            </button>
          </div>
        </div>

        {/* Title Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-zinc-700 mb-2">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a descriptive title for the question..."
            className="w-full px-4 py-2 rounded-md border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
          />
        </div>

        {/* Question Text */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-zinc-700 mb-2">
            Question Text
          </label>
          <textarea
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="Enter the question..."
            rows={4}
            className="w-full px-4 py-2 rounded-md border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent resize-y"
          />
        </div>

        {/* MCQ Options */}
        {type === "mcq" && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-zinc-700">
                Options
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddOption}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Option
              </Button>
            </div>
            {options.map((option, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  className="flex-1 px-4 py-2 rounded-md border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveOption(index)}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md border border-red-200"
                  disabled={options.length <= 2}
                >
                  Remove
                </button>
              </div>
            ))}
            <div className="mt-4">
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Correct Answer
              </label>
              <select
                value={correctAnswer}
                onChange={(e) => setCorrectAnswer(e.target.value)}
                className="w-full px-4 py-2 rounded-md border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
              >
                <option value="">Select correct answer</option>
                {options.map((_, index) => (
                  <option key={index} value={index}>
                    Option {index + 1}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Descriptive Correct Answer */}
        {type === "descriptive" && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Correct Answer
            </label>
            <input
              type="text"
              value={correctAnswer}
              onChange={(e) => setCorrectAnswer(e.target.value)}
              placeholder="Enter the correct answer..."
              className="w-full px-4 py-2 rounded-md border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
            />
            <p className="text-xs text-zinc-500 mt-1">
              Answers will be matched case-insensitively
            </p>
          </div>
        )}

        {/* Difficulty Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-zinc-700 mb-2">
            Difficulty
          </label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setDifficulty("easy")}
              className={`px-4 py-2 rounded-md border transition-colors ${
                difficulty === "easy"
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-50"
              }`}
            >
              Easy
            </button>
            <button
              type="button"
              onClick={() => setDifficulty("medium")}
              className={`px-4 py-2 rounded-md border transition-colors ${
                difficulty === "medium"
                  ? "bg-yellow-600 text-white border-yellow-600"
                  : "bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-50"
              }`}
            >
              Medium
            </button>
            <button
              type="button"
              onClick={() => setDifficulty("hard")}
              className={`px-4 py-2 rounded-md border transition-colors ${
                difficulty === "hard"
                  ? "bg-red-600 text-white border-red-600"
                  : "bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-50"
              }`}
            >
              Hard
            </button>
          </div>
        </div>

        {/* Tags Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-zinc-700 mb-2">
            Tags
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Enter tags separated by commas (e.g., math, algebra, equations)"
            className="w-full px-4 py-2 rounded-md border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
          />
          <p className="text-xs text-zinc-500 mt-1">
            Separate multiple tags with commas
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => navigate("/corpus")}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-zinc-900 hover:bg-zinc-800 text-white"
          >
            {isSubmitting ? "Creating..." : "Create Question"}
          </Button>
        </div>
      </div>
    </div>
  );
}

