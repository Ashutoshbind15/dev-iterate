import { usePaginatedQuery } from "convex/react";
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
import { ChevronRight, Trophy, Medal, Award } from "lucide-react";

export default function LeaderboardPage() {
  const { results, status, loadMore } = usePaginatedQuery(
    api.queries.user.getLeaderboardPaginated,
    {},
    { initialNumItems: 10 }
  );

  const getRankIcon = (rank: number) => {
    if (rank === 1) {
      return <Trophy className="h-5 w-5 text-yellow-500" />;
    } else if (rank === 2) {
      return <Medal className="h-5 w-5 text-gray-400" />;
    } else if (rank === 3) {
      return <Award className="h-5 w-5 text-amber-600" />;
    }
    return null;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) {
      return "bg-yellow-50 border-yellow-200";
    } else if (rank === 2) {
      return "bg-gray-50 border-gray-200";
    } else if (rank === 3) {
      return "bg-amber-50 border-amber-200";
    }
    return "";
  };

  if (status === "LoadingFirstPage") {
    return <div className="min-h-screen bg-white p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            Leaderboard
          </h1>
          <p className="text-zinc-500 mt-2">
            Top performers ranked by their question answering performance
          </p>
          <p className="text-sm text-zinc-400 mt-1">
            Scoring: +2 points for correct answers, -1 point for incorrect answers
          </p>
        </div>

        {/* Table */}
        <div className="border border-zinc-200 rounded-lg overflow-hidden">
          <Table>
            <TableHeader className="bg-zinc-50">
              <TableRow>
                <TableHead className="px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider w-20">
                  Rank
                </TableHead>
                <TableHead className="px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  User
                </TableHead>
                <TableHead className="px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider text-right">
                  Score
                </TableHead>
                <TableHead className="px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider text-right">
                  Correct
                </TableHead>
                <TableHead className="px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider text-right">
                  Incorrect
                </TableHead>
                <TableHead className="px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider text-right">
                  Total Answers
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="px-6 py-12 text-center text-zinc-500"
                  >
                    No users found. Start answering questions to appear on the leaderboard!
                  </TableCell>
                </TableRow>
              ) : (
                results.map((user, index) => {
                  const rank = index + 1;
                  const rankIcon = getRankIcon(rank);
                  const rankColor = getRankColor(rank);
                  return (
                    <TableRow
                      key={user.userId}
                      className={rankColor || undefined}
                    >
                      <TableCell className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {rankIcon}
                          <span className="text-sm font-medium text-zinc-900">
                            #{rank}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="text-sm font-medium text-zinc-900">
                          {user.name}
                        </div>
                        {user.email && (
                          <div className="text-xs text-zinc-500 mt-1">
                            {user.email}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-right">
                        <span
                          className={`text-lg font-bold ${
                            user.score >= 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {user.score > 0 ? "+" : ""}
                          {user.score}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm font-medium text-green-600">
                          {user.correctCount}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm font-medium text-red-600">
                          {user.incorrectCount}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm font-medium text-zinc-700">
                          {user.totalAnswers}
                        </span>
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
            <div className="text-zinc-500">Loading more users...</div>
          </div>
        )}
        {status === "Exhausted" && results.length > 0 && (
          <div className="mt-6 flex justify-center">
            <div className="text-zinc-500 text-sm">
              No more users to load
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

