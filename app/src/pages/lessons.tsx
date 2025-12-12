import { useMemo, useState } from "react";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Link } from "react-router";
import { BookOpen, ChevronRight, Layers, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function LessonsPage() {
  const PAGE_SIZE = 12;
  const [sortBy, setSortBy] = useState<"newest" | "upvotes">("newest");
  const [selectedTag, setSelectedTag] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const currentUser = useQuery(api.queries.user.getCurrentUser);
  const voteLesson = useMutation(api.mutations.lessons.voteLesson);

  const allTags = useQuery(api.queries.lessons.getAllLessonTags);

  const queryArgs = useMemo(
    () => ({
      sortBy,
      tag: selectedTag,
      search: search.trim() || undefined,
    }),
    [sortBy, selectedTag, search]
  );

  const { results, status, loadMore } = usePaginatedQuery(
    api.queries.lessons.listLessonsPaginated,
    queryArgs,
    { initialNumItems: PAGE_SIZE }
  );

  const loadedPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const resolvedCurrentPage = Math.min(currentPage, loadedPages);

  const pageResults = useMemo(() => {
    const start = (resolvedCurrentPage - 1) * PAGE_SIZE;
    return results.slice(start, start + PAGE_SIZE);
  }, [results, resolvedCurrentPage]);

  const paginationItems = useMemo(() => {
    // Convex pagination is cursor-based, so we don't know the true total page count.
    // Only render pages we have already loaded.
    if (loadedPages <= 7) {
      return Array.from({ length: loadedPages }, (_, i) => i + 1);
    }

    const set = new Set<number>();
    set.add(1);
    set.add(2);
    set.add(loadedPages - 1);
    set.add(loadedPages);
    set.add(resolvedCurrentPage);
    set.add(resolvedCurrentPage - 1);
    set.add(resolvedCurrentPage + 1);

    return Array.from(set)
      .filter((p) => p >= 1 && p <= loadedPages)
      .sort((a, b) => a - b);
  }, [loadedPages, resolvedCurrentPage]);

  const goToPage = (targetPage: number) => {
    if (targetPage < 1) return;
    const nowLoadedPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
    if (targetPage <= nowLoadedPages) {
      setCurrentPage(targetPage);
      return;
    }
    if (targetPage === nowLoadedPages + 1 && status === "CanLoadMore") {
      setCurrentPage(targetPage);
      loadMore(PAGE_SIZE);
    }
  };

  const handleUpvote = async (lessonId: Id<"lessons">) => {
    try {
      await voteLesson({ lessonId });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to upvote";
      toast.error(message);
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
              Lessons
            </h1>
            <p className="text-zinc-500 mt-2">
              Browse lessons and open one to read the full content
            </p>
          </div>
          <div className="p-2 bg-zinc-900 text-white rounded-sm">
            <Layers className="h-5 w-5" />
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-zinc-700">Search:</span>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or description..."
              className="max-w-md"
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-zinc-700">Sort:</span>
            <ToggleGroup
              type="single"
              variant="outline"
              spacing={2}
              size="sm"
              value={sortBy}
              onValueChange={(value) => {
                if (value) setSortBy(value as "newest" | "upvotes");
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
            </ToggleGroup>
          </div>

          {allTags && allTags.length > 0 && (
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-medium text-zinc-700">Tags:</span>
              <ToggleGroup
                type="single"
                variant="outline"
                spacing={2}
                size="sm"
                value={selectedTag || "all"}
                onValueChange={(value) => {
                  if (value === "all") setSelectedTag(undefined);
                  else if (value) setSelectedTag(value);
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

        {/* Grid */}
        {status === "LoadingFirstPage" ? (
          <div className="py-16 text-center text-zinc-500">
            Loading lessons...
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-24 border-2 border-dashed border-zinc-200 rounded-sm bg-zinc-50">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-20 text-zinc-500" />
            <p className="text-xl font-bold text-zinc-400">No lessons found</p>
            <p className="text-sm text-zinc-500 mt-2">
              Try adjusting filters or search
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {pageResults.map((lesson) => (
              <Link
                key={lesson._id}
                to={`/lessons/${lesson._id}`}
                className="block"
              >
                <div className="h-full p-5 rounded-sm border border-zinc-200 bg-white hover:border-zinc-400 transition-all hover:shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-lg font-bold text-zinc-900 truncate">
                        {lesson.title}
                      </div>
                      {lesson.description && (
                        <div className="text-sm text-zinc-500 mt-1 line-clamp-2">
                          {lesson.description}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-zinc-300 shrink-0 mt-1" />
                  </div>

                  {lesson.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-4">
                      {lesson.tags.slice(0, 4).map((tag: string) => (
                        <span
                          key={tag}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                      {lesson.tags.length > 4 && (
                        <span className="px-2 py-1 text-xs text-zinc-500">
                          +{lesson.tags.length - 4}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="mt-5 flex items-center justify-between gap-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      {lesson.itemCount} items
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleUpvote(lesson._id);
                        }}
                        disabled={!currentUser}
                        className={`inline-flex items-center gap-2 px-2 py-1 rounded border text-xs transition-colors ${
                          !currentUser
                            ? "text-zinc-300 border-zinc-200 cursor-not-allowed"
                            : lesson.hasUpvoted
                            ? "text-green-700 border-green-200 bg-green-50"
                            : "text-zinc-600 border-zinc-200 hover:text-green-700 hover:border-green-200 hover:bg-green-50"
                        }`}
                      >
                        <ThumbsUp className="h-3.5 w-3.5" />
                        {lesson.upvotes}
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {results.length > 0 && (
          <div className="mt-8 space-y-3">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      goToPage(resolvedCurrentPage - 1);
                    }}
                    className={cn(
                      resolvedCurrentPage <= 1 &&
                        "pointer-events-none opacity-50"
                    )}
                  />
                </PaginationItem>

                {paginationItems.map((p, idx) => {
                  const prev = paginationItems[idx - 1];
                  const needsEllipsis = prev !== undefined && p - prev > 1;
                  return (
                    <span key={p} className="contents">
                      {needsEllipsis && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}
                      <PaginationItem>
                        <PaginationLink
                          href="#"
                          isActive={p === resolvedCurrentPage}
                          onClick={(e) => {
                            e.preventDefault();
                            goToPage(p);
                          }}
                        >
                          {p}
                        </PaginationLink>
                      </PaginationItem>
                    </span>
                  );
                })}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      goToPage(resolvedCurrentPage + 1);
                    }}
                    className={cn(
                      status === "LoadingMore" &&
                        "pointer-events-none opacity-50",
                      status === "Exhausted" &&
                        resolvedCurrentPage >= loadedPages &&
                        "pointer-events-none opacity-50"
                    )}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>

            {status === "LoadingMore" && (
              <div className="text-center text-sm text-zinc-500">
                Loading more lessons...
              </div>
            )}
            {status === "Exhausted" && (
              <div className="text-center text-sm text-zinc-500">
                No more lessons to load
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
