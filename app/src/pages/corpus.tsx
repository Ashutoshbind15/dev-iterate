import { useState } from "react";
import { usePaginatedQuery, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Link } from "react-router";
import { Plus, CheckCircle, XCircle, ChevronRight } from "lucide-react";

export default function CorpusPage() {
  const [sortBy, setSortBy] = useState<"newest" | "upvotes" | "popular">(
    "newest"
  );
  const [difficulty, setDifficulty] = useState<
    "easy" | "medium" | "hard" | undefined
  >(undefined);
  const [selectedTag, setSelectedTag] = useState<string | undefined>(undefined);

  const currentUser = useQuery(api.queries.user.getCurrentUser);

  const { results, status, loadMore } = usePaginatedQuery(
    api.queries.questions.getQuestionsPaginated,
    {
      sortBy,
      difficulty,
      tag: selectedTag,
    },
    { initialNumItems: 10 }
  );

  const allTags = useQuery(api.queries.questions.getAllTags);

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

  if (status === "LoadingFirstPage") {
    return <div className="min-h-screen bg-white p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
              Question Corpus
            </h1>
            <p className="text-zinc-500 mt-2">
              Browse and answer questions contributed by the community
            </p>
          </div>
          <Link to="/contribute">
            <Button className="bg-zinc-900 hover:bg-zinc-800 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Contribute Question
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex gap-2 flex-wrap">
            <span className="text-sm font-medium text-zinc-700 py-2">
              Sort:
            </span>
            <button
              onClick={() => setSortBy("newest")}
              className={`px-4 py-2 rounded-md border transition-colors text-sm ${
                sortBy === "newest"
                  ? "bg-zinc-900 text-white border-zinc-900"
                  : "bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-50"
              }`}
            >
              Newest
            </button>
            <button
              onClick={() => setSortBy("upvotes")}
              className={`px-4 py-2 rounded-md border transition-colors text-sm ${
                sortBy === "upvotes"
                  ? "bg-zinc-900 text-white border-zinc-900"
                  : "bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-50"
              }`}
            >
              Most Upvoted
            </button>
            <button
              onClick={() => setSortBy("popular")}
              className={`px-4 py-2 rounded-md border transition-colors text-sm ${
                sortBy === "popular"
                  ? "bg-zinc-900 text-white border-zinc-900"
                  : "bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-50"
              }`}
            >
              Popular
            </button>
          </div>

          <div className="flex gap-2 flex-wrap">
            <span className="text-sm font-medium text-zinc-700 py-2">
              Difficulty:
            </span>
            <button
              onClick={() => setDifficulty(undefined)}
              className={`px-4 py-2 rounded-md border transition-colors text-sm ${
                difficulty === undefined
                  ? "bg-zinc-900 text-white border-zinc-900"
                  : "bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-50"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setDifficulty("easy")}
              className={`px-4 py-2 rounded-md border transition-colors text-sm ${
                difficulty === "easy"
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-50"
              }`}
            >
              Easy
            </button>
            <button
              onClick={() => setDifficulty("medium")}
              className={`px-4 py-2 rounded-md border transition-colors text-sm ${
                difficulty === "medium"
                  ? "bg-yellow-600 text-white border-yellow-600"
                  : "bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-50"
              }`}
            >
              Medium
            </button>
            <button
              onClick={() => setDifficulty("hard")}
              className={`px-4 py-2 rounded-md border transition-colors text-sm ${
                difficulty === "hard"
                  ? "bg-red-600 text-white border-red-600"
                  : "bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-50"
              }`}
            >
              Hard
            </button>
          </div>

          {allTags && allTags.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <span className="text-sm font-medium text-zinc-700 py-2">
                Tags:
              </span>
              <button
                onClick={() => setSelectedTag(undefined)}
                className={`px-4 py-2 rounded-md border transition-colors text-sm ${
                  selectedTag === undefined
                    ? "bg-zinc-900 text-white border-zinc-900"
                    : "bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-50"
                }`}
              >
                All
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-4 py-2 rounded-md border transition-colors text-sm ${
                    selectedTag === tag
                      ? "bg-zinc-900 text-white border-zinc-900"
                      : "bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-50"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Table */}
        <div className="border border-zinc-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Difficulty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Tags
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Score
                </th>
                {currentUser && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Status
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-zinc-200">
              {results.length === 0 ? (
                <tr>
                  <td
                    colSpan={currentUser ? 7 : 6}
                    className="px-6 py-12 text-center text-zinc-500"
                  >
                    No questions found. Be the first to contribute!
                  </td>
                </tr>
              ) : (
                results.map((question) => {
                  const score = question.upvotes - question.downvotes;
                  return (
                    <tr key={question._id} className="hover:bg-zinc-50">
                      <td className="px-6 py-4">
                        <Link
                          to={`/corpus/${question._id}`}
                          className="block hover:text-zinc-600 transition-colors"
                        >
                          <div className="text-sm font-medium text-zinc-900">
                            {question.title}
                          </div>
                          <div className="text-xs text-zinc-500 line-clamp-1 mt-1">
                            {question.questionText}
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-zinc-100 text-zinc-700 rounded capitalize">
                          {question.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded capitalize ${getDifficultyColor(
                            question.difficulty
                          )}`}
                        >
                          {question.difficulty}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {question.tags.slice(0, 3).map((tag: string) => (
                            <span
                              key={tag}
                              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                          {question.tags.length > 3 && (
                            <span className="px-2 py-1 text-xs text-zinc-500">
                              +{question.tags.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-medium ${
                              score >= 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {score}
                          </span>
                          <div className="flex items-center gap-1 text-xs text-zinc-500">
                            <span>↑ {question.upvotes}</span>
                          </div>
                        </div>
                      </td>
                      {currentUser && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          {question.hasAnswered ? (
                            <div className="flex items-center gap-1">
                              {question.isCorrect ? (
                                <>
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                  <span className="text-xs text-green-600">
                                    Correct
                                  </span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-4 w-4 text-red-600" />
                                  <span className="text-xs text-red-600">
                                    Incorrect
                                  </span>
                                </>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-zinc-400">
                              Not answered
                            </span>
                          )}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          to={`/corpus/${question._id}`}
                          className="text-sm text-zinc-600 hover:text-zinc-900 font-medium"
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {status === "CanLoadMore" && (
          <div className="mt-6 flex justify-center">
            <Button
              onClick={() => loadMore(10)}
              variant="outline"
              className="flex items-center gap-2"
            >
              Load More
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
        {status === "LoadingMore" && (
          <div className="mt-6 flex justify-center">
            <div className="text-zinc-500">Loading more questions...</div>
          </div>
        )}
        {status === "Exhausted" && results.length > 0 && (
          <div className="mt-6 flex justify-center">
            <div className="text-zinc-500 text-sm">
              No more questions to load
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
