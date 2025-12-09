import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import { internal } from "../_generated/api";

export const createQuestion = mutation({
  args: {
    title: v.string(),
    type: v.union(v.literal("mcq"), v.literal("descriptive")),
    questionText: v.string(),
    options: v.optional(v.array(v.string())),
    correctAnswer: v.union(v.string(), v.number()),
    difficulty: v.union(
      v.literal("easy"),
      v.literal("medium"),
      v.literal("hard")
    ),
    tags: v.array(v.string()),
  },
  returns: v.id("questions"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError("User not authenticated");
    }

    // Validate MCQ questions
    if (args.type === "mcq") {
      if (!args.options || args.options.length < 2) {
        throw new ConvexError("MCQ questions must have at least 2 options");
      }
      if (typeof args.correctAnswer !== "number") {
        throw new ConvexError("MCQ correctAnswer must be a number (index)");
      }
      if (args.correctAnswer < 0 || args.correctAnswer >= args.options.length) {
        throw new ConvexError("Correct answer index out of range");
      }
    } else {
      // Descriptive questions
      if (typeof args.correctAnswer !== "string") {
        throw new ConvexError("Descriptive correctAnswer must be a string");
      }
    }

    // Validate tags (remove empty strings and trim)
    const validTags = args.tags
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    return await ctx.db.insert("questions", {
      title: args.title,
      type: args.type,
      questionText: args.questionText,
      options: args.options,
      correctAnswer: args.correctAnswer,
      authorId: userId,
      upvotes: 0,
      downvotes: 0,
      difficulty: args.difficulty,
      tags: validTags,
    });
  },
});

export const submitAnswer = mutation({
  args: {
    questionId: v.id("questions"),
    answer: v.string(),
  },
  returns: v.object({
    isCorrect: v.boolean(),
    answerId: v.id("answers"),
  }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError("User not authenticated");
    }

    // Check if user already answered
    const existingAnswer = await ctx.db
      .query("answers")
      .withIndex("by_question_and_user", (q) =>
        q.eq("questionId", args.questionId).eq("userId", userId)
      )
      .first();

    if (existingAnswer) {
      throw new ConvexError(
        "You have already submitted an answer to this question"
      );
    }

    // Get question
    const question = await ctx.db.get(args.questionId);
    if (!question) {
      throw new ConvexError("Question not found");
    }

    // Check answer
    let isCorrect = false;
    if (question.type === "mcq") {
      // For MCQ, answer should be the index as a string
      const selectedIndex = parseInt(args.answer);
      isCorrect = selectedIndex === question.correctAnswer;
    } else {
      // For descriptive, do string match (case-insensitive, trimmed)
      const userAnswer = args.answer.trim().toLowerCase();
      const correctAnswer = String(question.correctAnswer).trim().toLowerCase();
      isCorrect = userAnswer === correctAnswer;
    }

    // Insert answer
    const answerId = await ctx.db.insert("answers", {
      questionId: args.questionId,
      userId,
      answer: args.answer,
      isCorrect,
      submittedAt: Date.now(),
    });

    // Update user stats for leaderboard
    const existingStats = await ctx.db
      .query("userStats")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    // Calculate sortScore: score * 1e6 + totalAnswers
    // This allows efficient DB-level sorting by a single indexed field
    const SORT_SCORE_MULTIPLIER = 1e6;

    if (existingStats) {
      // Update existing stats
      const newCorrectCount = existingStats.correctCount + (isCorrect ? 1 : 0);
      const newIncorrectCount =
        existingStats.incorrectCount + (isCorrect ? 0 : 1);
      const newScore = newCorrectCount * 2 - newIncorrectCount * 1;
      const newTotalAnswers = existingStats.totalAnswers + 1;
      const newSortScore = newScore * SORT_SCORE_MULTIPLIER + newTotalAnswers;

      await ctx.db.patch(existingStats._id, {
        score: newScore,
        correctCount: newCorrectCount,
        incorrectCount: newIncorrectCount,
        totalAnswers: newTotalAnswers,
        sortScore: newSortScore,
      });
    } else {
      // Create new stats entry
      const initialScore = isCorrect ? 2 : -1;
      const initialTotalAnswers = 1;
      const initialSortScore =
        initialScore * SORT_SCORE_MULTIPLIER + initialTotalAnswers;

      await ctx.db.insert("userStats", {
        userId,
        score: initialScore,
        correctCount: isCorrect ? 1 : 0,
        incorrectCount: isCorrect ? 0 : 1,
        totalAnswers: initialTotalAnswers,
        sortScore: initialSortScore,
      });
    }

    // Check if we should trigger weakness analysis (every 5 answers)
    const recentAnswers = await ctx.db
      .query("answers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(5);

    // If we have exactly 5 answers (or this is the 5th), trigger analysis
    if (recentAnswers.length === 5) {
      // Get the 5 questions with full details
      const questionsData = await Promise.all(
        recentAnswers.map(async (answer) => {
          const question = await ctx.db.get(answer.questionId);
          if (!question) return null;
          return {
            questionId: answer.questionId.toString(),
            questionText: question.questionText,
            title: question.title,
            tags: question.tags,
            difficulty: question.difficulty,
            correctAnswer:
              question.type === "mcq"
                ? question.options?.[question.correctAnswer as number] || ""
                : String(question.correctAnswer),
            userAnswer: answer.answer,
            isCorrect: answer.isCorrect,
          };
        })
      );

      const validQuestions = questionsData.filter(
        (q): q is NonNullable<typeof q> => q !== null
      );

      if (validQuestions.length === 5) {
        // Get past remarks for context
        const pastRemarks = await ctx.db
          .query("userRemarks")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .order("desc")
          .take(10); // Get last 10 remarks

        const remarksText = pastRemarks.map((r) => r.remark).join(" | ");

        // Trigger Kestra flow (fire-and-forget)
        await ctx.scheduler.runAfter(
          0,
          internal.actionsdir.weakness.triggerWeaknessAnalysis,
          {
            userId,
            questions: validQuestions,
            pastRemarks: remarksText || "",
          }
        );
      }
    }

    return { isCorrect, answerId };
  },
});

export const voteQuestion = mutation({
  args: {
    questionId: v.id("questions"),
    voteType: v.union(v.literal("upvote"), v.literal("downvote")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError("User not authenticated");
    }

    const question = await ctx.db.get(args.questionId);
    if (!question) {
      throw new ConvexError("Question not found");
    }

    // Check if user already voted
    const existingVote = await ctx.db
      .query("questionVotes")
      .withIndex("by_question_and_user", (q) =>
        q.eq("questionId", args.questionId).eq("userId", userId)
      )
      .first();

    if (existingVote) {
      // If same vote type, remove vote (toggle off)
      if (existingVote.voteType === args.voteType) {
        await ctx.db.delete(existingVote._id);
        // Decrement vote count
        await ctx.db.patch(args.questionId, {
          upvotes:
            args.voteType === "upvote"
              ? question.upvotes - 1
              : question.upvotes,
          downvotes:
            args.voteType === "downvote"
              ? question.downvotes - 1
              : question.downvotes,
        });
      } else {
        // Change vote type
        await ctx.db.patch(existingVote._id, { voteType: args.voteType });
        // Update vote counts
        await ctx.db.patch(args.questionId, {
          upvotes:
            args.voteType === "upvote"
              ? question.upvotes + 1
              : question.upvotes - 1,
          downvotes:
            args.voteType === "downvote"
              ? question.downvotes + 1
              : question.downvotes - 1,
        });
      }
    } else {
      // New vote
      await ctx.db.insert("questionVotes", {
        questionId: args.questionId,
        userId,
        voteType: args.voteType,
      });
      // Increment vote count
      await ctx.db.patch(args.questionId, {
        upvotes:
          args.voteType === "upvote" ? question.upvotes + 1 : question.upvotes,
        downvotes:
          args.voteType === "downvote"
            ? question.downvotes + 1
            : question.downvotes,
      });
    }

    return null;
  },
});

export const starQuestion = mutation({
  args: {
    questionId: v.id("questions"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError("User not authenticated");
    }

    const question = await ctx.db.get(args.questionId);
    if (!question) {
      throw new ConvexError("Question not found");
    }

    // Check if already starred
    const existingStar = await ctx.db
      .query("questionStars")
      .withIndex("by_question_and_user", (q) =>
        q.eq("questionId", args.questionId).eq("userId", userId)
      )
      .first();

    if (existingStar) {
      // Unstar
      await ctx.db.delete(existingStar._id);
    } else {
      // Star
      await ctx.db.insert("questionStars", {
        questionId: args.questionId,
        userId,
      });
    }

    return null;
  },
});
