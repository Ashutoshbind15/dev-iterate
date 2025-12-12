import { getAuthUserId } from "@convex-dev/auth/server";
import { query } from "../_generated/server";
import { ConvexError } from "convex/values";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError("User not authenticated");
    }
    return await ctx.db.get(userId);
  },
});

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }
    return await ctx.db.get(userId);
  },
});

export const getLeaderboardPaginated = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    // Query using the indexed sortScore field, sorted descending
    // This performs sorting entirely at the database level using the index
    // We use a wide range filter to get all records, then order descending
    // Since sortScore can be negative, we use a very low bound
    const result = await ctx.db
      .query("userStats")
      .withIndex("by_sortScore", (q) => q.gte("sortScore", -1e12))
      .order("desc")
      .paginate(args.paginationOpts);

    // Filter out users with no answers (should be rare, but handle edge cases)
    const filteredStats = result.page.filter((stat) => stat.totalAnswers > 0);

    // Enrich with user information
    const enrichedPage = await Promise.all(
      filteredStats.map(async (stat) => {
        const user = await ctx.db.get(stat.userId);
        return {
          userId: stat.userId,
          name: user?.name || user?.email || "Anonymous",
          email: user?.email || "",
          score: stat.score,
          correctCount: stat.correctCount,
          incorrectCount: stat.incorrectCount,
          totalAnswers: stat.totalAnswers,
        };
      })
    );

    // If we filtered out some results, we might need to adjust pagination
    // For simplicity, we'll use the original cursor and let the next page handle it
    // In practice, this edge case (users with 0 answers) should be very rare
    return {
      page: enrichedPage,
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    };
  },
});

/**
 * Check if the current user has any analysis (userRemarks)
 */
export const hasUserAnalysis = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return false;
    }

    const remark = await ctx.db
      .query("userRemarks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return remark !== undefined;
  },
});
