import { useState } from "react";
import { useQuery } from "convex/react";
import { Link } from "react-router";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Code2, ChevronRight, Filter, Loader2, Plus } from "lucide-react";

type Difficulty = "easy" | "medium" | "hard";

export default function CodingQuestionsPage() {
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | "all">(
    "all"
  );

  const result = useQuery(api.queries.codingQuestions.listCodingQuestions, {
    paginationOpts: { numItems: 50, cursor: null },
    difficulty: difficultyFilter === "all" ? undefined : difficultyFilter,
  });

  const currentUser = useQuery(api.queries.user.getCurrentUser);

  const getDifficultyColor = (difficulty: Difficulty) => {
    switch (difficulty) {
      case "easy":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "medium":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "hard":
        return "bg-rose-100 text-rose-700 border-rose-200";
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <div className="bg-white border-b border-zinc-200">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-zinc-900 rounded-lg">
              <Code2 className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-zinc-900">
              Coding Problems
            </h1>
          </div>
          <p className="text-zinc-500 ml-14">
            Practice your programming skills with algorithmic challenges
          </p>
        </div>
        {currentUser && (
          <div className="max-w-5xl mx-auto px-4 pb-4">
            <Link to="/coding/create">
              <Button className="bg-emerald-600 hover:bg-emerald-500 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Create Problem
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="bg-white rounded-lg border border-zinc-200 p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <Filter className="h-4 w-4" />
              <span>Filters</span>
            </div>
            <Select
              value={difficultyFilter}
              onValueChange={(value) =>
                setDifficultyFilter(value as Difficulty | "all")
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Difficulties</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Questions List */}
        {result === undefined ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
          </div>
        ) : result.page.length === 0 ? (
          <div className="bg-white rounded-lg border border-zinc-200 p-12 text-center">
            <Code2 className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-zinc-900 mb-2">
              No problems found
            </h3>
            <p className="text-zinc-500 text-sm">
              {difficultyFilter !== "all"
                ? `No ${difficultyFilter} problems available. Try a different filter.`
                : "No coding problems have been created yet."}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
            <div className="divide-y divide-zinc-100">
              {result.page.map((question) => (
                <Link
                  key={question._id}
                  to={`/coding/${question._id}/solve`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-zinc-50 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-medium text-zinc-900 group-hover:text-zinc-700 truncate">
                        {question.title}
                      </h3>
                      <Badge
                        variant="outline"
                        className={`capitalize text-xs ${getDifficultyColor(
                          question.difficulty
                        )}`}
                      >
                        {question.difficulty}
                      </Badge>
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
                      <span className="text-emerald-600 font-medium">
                        {question.upvotes}
                      </span>{" "}
                      votes
                    </div>
                    <ChevronRight className="h-5 w-5 text-zinc-300 group-hover:text-zinc-500 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Load More */}
        {result && !result.isDone && (
          <div className="mt-6 text-center">
            <Button variant="outline" disabled>
              Load More (coming soon)
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

