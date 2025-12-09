import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";

export const createQuestion = mutation({
  args: {
    title: v.string(),
    type: v.union(v.literal("mcq"), v.literal("descriptive")),
    questionText: v.string(),
    options: v.optional(v.array(v.string())),
    correctAnswer: v.union(v.string(), v.number()),
    difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
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
      throw new ConvexError("You have already submitted an answer to this question");
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
          upvotes: args.voteType === "upvote" ? question.upvotes - 1 : question.upvotes,
          downvotes: args.voteType === "downvote" ? question.downvotes - 1 : question.downvotes,
        });
      } else {
        // Change vote type
        await ctx.db.patch(existingVote._id, { voteType: args.voteType });
        // Update vote counts
        await ctx.db.patch(args.questionId, {
          upvotes:
            args.voteType === "upvote" ? question.upvotes + 1 : question.upvotes - 1,
          downvotes:
            args.voteType === "downvote" ? question.downvotes + 1 : question.downvotes - 1,
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
        upvotes: args.voteType === "upvote" ? question.upvotes + 1 : question.upvotes,
        downvotes: args.voteType === "downvote" ? question.downvotes + 1 : question.downvotes,
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

