import { query } from "../_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { paginationOptsValidator } from "convex/server";

export const getQuestionsPaginated = query({
  args: {
    paginationOpts: paginationOptsValidator,
    sortBy: v.optional(
      v.union(v.literal("newest"), v.literal("upvotes"), v.literal("popular"))
    ),
    difficulty: v.optional(
      v.union(v.literal("easy"), v.literal("medium"), v.literal("hard"))
    ),
    tag: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    // Get all questions (we'll filter and sort in memory for now)
    // Note: For better performance with large datasets, you'd want to add more indexes
    let allQuestions;
    if (args.difficulty) {
      const difficulty = args.difficulty; // Type narrowing
      allQuestions = await ctx.db
        .query("questions")
        .withIndex("by_difficulty", (q) => q.eq("difficulty", difficulty))
        .collect();
    } else {
      allQuestions = await ctx.db.query("questions").collect();
    }

    // Filter by tag if provided
    const filteredQuestions = args.tag
      ? allQuestions.filter((q) => q.tags.includes(args.tag!))
      : allQuestions;

    // Sort questions
    const sortedQuestions = [...filteredQuestions];
    if (args.sortBy === "upvotes" || args.sortBy === "popular") {
      sortedQuestions.sort((a, b) => {
        const scoreA = a.upvotes - a.downvotes;
        const scoreB = b.upvotes - b.downvotes;
        return scoreB - scoreA;
      });
    } else {
      // newest (default)
      sortedQuestions.sort((a, b) => b._creationTime - a._creationTime);
    }

    // Paginate manually (since we're sorting in memory)
    const pageSize = args.paginationOpts.numItems;
    const cursor = args.paginationOpts.cursor;

    let startIdx = 0;
    if (cursor) {
      // Find the index of the cursor question
      const cursorIdx = sortedQuestions.findIndex((q) => q._id === cursor);
      if (cursorIdx !== -1) {
        startIdx = cursorIdx + 1;
      }
    }

    const page = sortedQuestions.slice(startIdx, startIdx + pageSize);
    const isDone = startIdx + pageSize >= sortedQuestions.length;
    const continueCursor = page.length > 0 ? page[page.length - 1]._id : "";

    // Enrich with user status
    const enrichedPage = await Promise.all(
      page.map(async (question) => {
        let hasAnswered = false;
        let isCorrect: boolean | undefined = undefined;
        let isStarred = false;
        let userVote: "upvote" | "downvote" | undefined = undefined;

        if (userId) {
          // Check if answered
          const answer = await ctx.db
            .query("answers")
            .withIndex("by_question_and_user", (q) =>
              q.eq("questionId", question._id).eq("userId", userId)
            )
            .first();

          if (answer) {
            hasAnswered = true;
            isCorrect = answer.isCorrect;
          }

          // Check if starred
          const star = await ctx.db
            .query("questionStars")
            .withIndex("by_question_and_user", (q) =>
              q.eq("questionId", question._id).eq("userId", userId)
            )
            .first();

          isStarred = star !== null;

          // Check vote
          const vote = await ctx.db
            .query("questionVotes")
            .withIndex("by_question_and_user", (q) =>
              q.eq("questionId", question._id).eq("userId", userId)
            )
            .first();

          if (vote) {
            userVote = vote.voteType;
          }
        }

        return {
          ...question,
          hasAnswered,
          isCorrect,
          isStarred,
          userVote,
        };
      })
    );

    return {
      page: enrichedPage,
      isDone,
      continueCursor: continueCursor || "",
    };
  },
});

export const getQuestion = query({
  args: {
    id: v.id("questions"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const question = await ctx.db.get(args.id);
    if (!question) return null;

    let hasAnswered = false;
    let isCorrect: boolean | undefined = undefined;
    let isStarred = false;
    let userVote: "upvote" | "downvote" | undefined = undefined;

    if (userId) {
      // Check if answered
      const answer = await ctx.db
        .query("answers")
        .withIndex("by_question_and_user", (q) =>
          q.eq("questionId", question._id).eq("userId", userId)
        )
        .first();

      if (answer) {
        hasAnswered = true;
        isCorrect = answer.isCorrect;
      }

      // Check if starred
      const star = await ctx.db
        .query("questionStars")
        .withIndex("by_question_and_user", (q) =>
          q.eq("questionId", question._id).eq("userId", userId)
        )
        .first();

      isStarred = star !== null;

      // Check vote
      const vote = await ctx.db
        .query("questionVotes")
        .withIndex("by_question_and_user", (q) =>
          q.eq("questionId", question._id).eq("userId", userId)
        )
        .first();

      if (vote) {
        userVote = vote.voteType;
      }
    }

    return {
      ...question,
      hasAnswered,
      isCorrect,
      isStarred,
      userVote,
    };
  },
});

export const getUserStarredQuestions = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return [];
    }

    const stars = await ctx.db
      .query("questionStars")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const questions = await Promise.all(
      stars.map(async (star) => {
        const question = await ctx.db.get(star.questionId);
        return question;
      })
    );

    return questions.filter((q) => q !== null);
  },
});

export const getAllTags = query({
  args: {},
  handler: async (ctx) => {
    const questions = await ctx.db.query("questions").collect();
    const allTags = new Set<string>();
    questions.forEach((q) => {
      q.tags.forEach((tag) => allTags.add(tag));
    });
    return Array.from(allTags).sort();
  },
});
