import { useState } from "react";
import { usePaginatedQuery, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-zinc-700">Sort:</span>
            <ToggleGroup
              type="single"
              variant="outline"
              spacing={2}
              size="sm"
              value={sortBy}
              onValueChange={(value) => {
                if (value) {
                  setSortBy(value as "newest" | "upvotes" | "popular");
                }
              }}
            >
              <ToggleGroupItem
                value="newest"
                aria-label="Sort by newest"
                className="data-[state=on]:bg-zinc-900 data-[state=on]:text-white data-[state=on]:border-zinc-900"
              >
                Newest
              </ToggleGroupItem>
              <ToggleGroupItem
                value="upvotes"
                aria-label="Sort by upvotes"
                className="data-[state=on]:bg-zinc-900 data-[state=on]:text-white data-[state=on]:border-zinc-900"
              >
                Most Upvoted
              </ToggleGroupItem>
              <ToggleGroupItem
                value="popular"
                aria-label="Sort by popular"
                className="data-[state=on]:bg-zinc-900 data-[state=on]:text-white data-[state=on]:border-zinc-900"
              >
                Popular
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-zinc-700">
              Difficulty:
            </span>
            <ToggleGroup
              type="single"
              variant="outline"
              spacing={2}
              size="sm"
              value={difficulty || "all"}
              onValueChange={(value) => {
                if (value === "all") {
                  setDifficulty(undefined);
                } else if (value) {
                  setDifficulty(value as "easy" | "medium" | "hard");
                }
              }}
            >
              <ToggleGroupItem
                value="all"
                aria-label="All difficulties"
                className="data-[state=on]:bg-zinc-900 data-[state=on]:text-white data-[state=on]:border-zinc-900"
              >
                All
              </ToggleGroupItem>
              <ToggleGroupItem
                value="easy"
                aria-label="Easy difficulty"
                className="data-[state=on]:bg-green-600 data-[state=on]:text-white data-[state=on]:border-green-600"
              >
                Easy
              </ToggleGroupItem>
              <ToggleGroupItem
                value="medium"
                aria-label="Medium difficulty"
                className="data-[state=on]:bg-yellow-600 data-[state=on]:text-white data-[state=on]:border-yellow-600"
              >
                Medium
              </ToggleGroupItem>
              <ToggleGroupItem
                value="hard"
                aria-label="Hard difficulty"
                className="data-[state=on]:bg-red-600 data-[state=on]:text-white data-[state=on]:border-red-600"
              >
                Hard
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {allTags && allTags.length > 0 && (
            <div className="grid grid-cols-[max-content,1fr] items-start gap-x-3 gap-y-2">
              <span className="text-sm font-medium text-zinc-700 pt-1">
                Tags:
              </span>
              <ToggleGroup
                type="single"
                variant="outline"
                spacing={2}
                size="sm"
                className="w-full flex-wrap justify-start min-w-0"
                value={selectedTag || "all"}
                onValueChange={(value) => {
                  if (value === "all") {
                    setSelectedTag(undefined);
                  } else if (value) {
                    setSelectedTag(value);
                  }
                }}
              >
                <ToggleGroupItem
                  value="all"
                  aria-label="All tags"
                  className="data-[state=on]:bg-zinc-900 data-[state=on]:text-white data-[state=on]:border-zinc-900"
                >
                  All
                </ToggleGroupItem>
                {allTags.map((tag) => (
                  <ToggleGroupItem
                    key={tag}
                    value={tag}
                    aria-label={`Filter by ${tag}`}
                    className="data-[state=on]:bg-zinc-900 data-[state=on]:text-white data-[state=on]:border-zinc-900"
                  >
                    {tag}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="border border-zinc-200 rounded-lg overflow-hidden">
          <Table>
            <TableHeader className="bg-zinc-50">
              <TableRow>
                <TableHead className="px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Title
                </TableHead>
                <TableHead className="px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Type
                </TableHead>
                <TableHead className="px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Difficulty
                </TableHead>
                <TableHead className="px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Tags
                </TableHead>
                <TableHead className="px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Score
                </TableHead>
                {currentUser && (
                  <TableHead className="px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Status
                  </TableHead>
                )}
                <TableHead className="px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={currentUser ? 7 : 6}
                    className="px-6 py-12 text-center text-zinc-500"
                  >
                    No questions found. Be the first to contribute!
                  </TableCell>
                </TableRow>
              ) : (
                results.map((question) => {
                  const score = question.upvotes - question.downvotes;
                  return (
                    <TableRow key={question._id}>
                      <TableCell className="px-6 py-4">
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
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-zinc-100 text-zinc-700 rounded capitalize">
                          {question.type}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded capitalize ${getDifficultyColor(
                            question.difficulty
                          )}`}
                        >
                          {question.difficulty}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-4">
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
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap">
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
                      </TableCell>
                      {currentUser && (
                        <TableCell className="px-6 py-4 whitespace-nowrap">
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
                        </TableCell>
                      )}
                      <TableCell className="px-6 py-4 whitespace-nowrap">
                        <Link
                          to={`/corpus/${question._id}`}
                          className="text-sm text-zinc-600 hover:text-zinc-900 font-medium"
                        >
                          View →
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
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
