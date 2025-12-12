import { mutation, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import { internal } from "../_generated/api";
import { Id, Doc } from "../_generated/dataModel";

/**
 * Create a personalized question submission request
 * This records the request and triggers the Kestra workflow
 * Uses existing userRemarks from the database as analysis
 *
 * Duplicate prevention: Only proceeds if there are new remarks not already
 * in pending or completed submissions (similar to weaknessAnalysisExecutions pattern)
 */
export const createPersonalizedQuestionSubmission = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError("User not authenticated");
    }

    // Get user remarks and pending/completed submissions in parallel
    const [userRemarks, pendingSubmissions, completedSubmissions] =
      await Promise.all([
        ctx.db
          .query("userRemarks")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .order("desc")
          .take(10),
        ctx.db
          .query("personalizedQuestionSubmissions")
          .withIndex("by_user_and_status", (q) =>
            q.eq("userId", userId).eq("status", "pending")
          )
          .collect(),
        ctx.db
          .query("personalizedQuestionSubmissions")
          .withIndex("by_user_and_status", (q) =>
            q.eq("userId", userId).eq("status", "completed")
          )
          .collect(),
      ]);

    if (userRemarks.length === 0) {
      throw new ConvexError(
        "No analysis data found. Please answer some questions first to generate personalized questions."
      );
    }

    // Build set of excluded remark IDs from all pending and completed submissions
    const excludedRemarkIds = new Set(
      [...pendingSubmissions, ...completedSubmissions].flatMap(
        (s) => s.remarkIds
      )
    );

    // Filter to only new remarks not in the excluded set
    const newRemarks = userRemarks.filter(
      (remark) => !excludedRemarkIds.has(remark._id)
    );

    // Only proceed if there are new remarks to process
    if (newRemarks.length === 0) {
      throw new ConvexError(
        "No new analysis data available. Answer more questions to generate new personalized questions."
      );
    }

    // Combine new remarks into comma-separated analysis string
    const analysis = newRemarks
      .map((remark: Doc<"userRemarks">) => remark.remark)
      .join(", ");

    // Extract remark IDs
    const remarkIds = newRemarks.map((remark) => remark._id);

    // Create submission record
    const submissionId = await ctx.db.insert(
      "personalizedQuestionSubmissions",
      {
        userId,
        remarkIds,
        analysis,
        status: "pending",
        createdAt: Date.now(),
      }
    );

    // Trigger Kestra workflow (fire-and-forget)
    await ctx.scheduler.runAfter(
      0,
      internal.actionsdir.personalizedQuestions.triggerQuestionGeneration,
      {
        userId,
        submissionId,
        analysis,
      }
    );

    return submissionId;
  },
});

/**
 * Internal mutation to save generated personalized questions
 * Called from HTTP action after Kestra workflow completes
 */
export const savePersonalizedQuestions = internalMutation({
  args: {
    submissionId: v.id("personalizedQuestionSubmissions"),
    questions: v.array(
      v.object({
        title: v.string(),
        type: v.union(v.literal("mcq"), v.literal("descriptive")),
        questionText: v.string(),
        options: v.optional(v.array(v.string())),
        answer: v.string(), // LLMs return answer as text (for MCQ: text matching one of the options, for descriptive: explanation text)
        difficulty: v.union(
          v.literal("easy"),
          v.literal("medium"),
          v.literal("hard")
        ),
        tags: v.array(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Verify submission exists and is pending
    const submission = await ctx.db.get(args.submissionId);
    if (!submission) {
      throw new ConvexError("Submission not found");
    }

    if (submission.status !== "pending") {
      throw new ConvexError(
        `Submission is already ${submission.status}, cannot save questions`
      );
    }

    const questionIds: Array<Id<"personalizedQuestions">> = [];
    const createdAt = Date.now();

    // Insert all questions
    for (const question of args.questions) {
      let correctAnswer: string | number;

      // Validate MCQ questions
      if (question.type === "mcq") {
        if (!question.options || question.options.length < 2) {
          throw new ConvexError("MCQ questions must have at least 2 options");
        }
        if (typeof question.answer !== "string") {
          throw new ConvexError(
            "MCQ answer must be a string (the answer text)"
          );
        }

        // Find the index of the answer text in the options array
        // Try exact match first, then case-insensitive match
        const answerIndex = question.options.findIndex(
          (opt) => opt === question.answer
        );
        const caseInsensitiveIndex = question.options.findIndex(
          (opt) =>
            opt.toLowerCase().trim() === question.answer.toLowerCase().trim()
        );

        const finalIndex =
          answerIndex !== -1 ? answerIndex : caseInsensitiveIndex;

        if (finalIndex === -1) {
          throw new ConvexError(
            `MCQ answer "${
              question.answer
            }" not found in options: ${question.options.join(", ")}`
          );
        }

        correctAnswer = finalIndex;
      } else {
        // Descriptive questions
        if (typeof question.answer !== "string") {
          throw new ConvexError("Descriptive answer must be a string");
        }
        correctAnswer = question.answer;
      }

      // Validate tags (remove empty strings and trim)
      const validTags = question.tags
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      // Map "answer" field from LLM to "correctAnswer" for database
      const questionId = await ctx.db.insert("personalizedQuestions", {
        userId: submission.userId,
        submissionId: args.submissionId,
        title: question.title,
        type: question.type,
        questionText: question.questionText,
        options: question.options,
        correctAnswer, // Transformed: string answer -> index for MCQ, string for descriptive
        difficulty: question.difficulty,
        tags: validTags,
        createdAt,
      });

      questionIds.push(questionId);
    }

    // Update submission status to completed
    await ctx.db.patch(args.submissionId, {
      status: "completed",
      completedAt: Date.now(),
    });

    return questionIds;
  },
});

/**
 * Internal mutation to mark submission as failed
 */
export const markSubmissionFailed = internalMutation({
  args: {
    submissionId: v.id("personalizedQuestionSubmissions"),
    errorMessage: v.string(),
  },
  handler: async (ctx, args) => {
    const submission = await ctx.db.get(args.submissionId);
    if (!submission) {
      throw new ConvexError("Submission not found");
    }

    await ctx.db.patch(args.submissionId, {
      status: "failed",
      completedAt: Date.now(),
      errorMessage: args.errorMessage,
    });

    return null;
  },
});

/**
 * Submit an answer for a personalized question (practice)
 */
export const submitPersonalizedAnswer = mutation({
  args: {
    personalizedQuestionId: v.id("personalizedQuestions"),
    answer: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError("User not authenticated");
    }

    // Ensure question exists and belongs to the current user
    const question = await ctx.db.get(args.personalizedQuestionId);
    if (!question) {
      throw new ConvexError("Personalized question not found");
    }
    if (question.userId !== userId) {
      throw new ConvexError(
        "Unauthorized: Personalized question does not belong to user"
      );
    }

    // Check if user already answered
    const existingAnswer = await ctx.db
      .query("personalizedAnswers")
      .withIndex("by_personalizedQuestionId_and_userId", (q) =>
        q
          .eq("personalizedQuestionId", args.personalizedQuestionId)
          .eq("userId", userId)
      )
      .first();

    if (existingAnswer) {
      throw new ConvexError(
        "You have already submitted an answer to this question"
      );
    }

    // Check answer
    let isCorrect = false;
    if (question.type === "mcq") {
      const selectedIndex = parseInt(args.answer, 10);
      isCorrect = selectedIndex === question.correctAnswer;
    } else {
      const userAnswer = args.answer.trim().toLowerCase();
      const correctAnswer = String(question.correctAnswer).trim().toLowerCase();
      isCorrect = userAnswer === correctAnswer;
    }

    const answerId = await ctx.db.insert("personalizedAnswers", {
      personalizedQuestionId: args.personalizedQuestionId,
      userId,
      answer: args.answer,
      isCorrect,
      submittedAt: Date.now(),
    });

    return { isCorrect, answerId };
  },
});
