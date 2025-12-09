import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  // Rich text content blocks
  contents: defineTable({
    title: v.string(),
    content: v.string(), // JSON stringified TipTap content
  }),

  // Excalidraw diagrams
  diagrams: defineTable({
    title: v.string(),
    elements: v.string(), // JSON stringified Excalidraw elements
    appState: v.string(), // JSON stringified Excalidraw appState
  }),

  // Lessons that contain ordered content and diagrams
  lessons: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    items: v.optional(
      v.array(
        v.object({
          type: v.union(v.literal("content"), v.literal("diagram")),
          itemId: v.string(), // ID reference to content or diagram
          order: v.number(),
        })
      )
    ),
  }),

  // RSS feed summaries
  rssSummaries: defineTable({
    summaryText: v.string(),
  }),

  // Questions (MCQ or descriptive)
  questions: defineTable({
    title: v.string(),
    type: v.union(v.literal("mcq"), v.literal("descriptive")),
    questionText: v.string(),
    // For MCQ: array of options, correctAnswer is the index
    options: v.optional(v.array(v.string())),
    correctAnswer: v.union(v.string(), v.number()), // For MCQ: index number, for descriptive: answer string
    authorId: v.id("users"), // User who created the question
    upvotes: v.number(),
    downvotes: v.number(),
    difficulty: v.union(
      v.literal("easy"),
      v.literal("medium"),
      v.literal("hard")
    ),
    tags: v.array(v.string()),
  })
    .index("by_author", ["authorId"])
    .index("by_upvotes", ["upvotes"])
    .index("by_difficulty", ["difficulty"]),

  // User answers to questions
  answers: defineTable({
    questionId: v.id("questions"),
    userId: v.id("users"),
    answer: v.string(), // User's answer
    isCorrect: v.boolean(),
    submittedAt: v.number(),
  })
    .index("by_question", ["questionId"])
    .index("by_user", ["userId"])
    .index("by_question_and_user", ["questionId", "userId"]),

  // Question votes (upvotes/downvotes)
  questionVotes: defineTable({
    questionId: v.id("questions"),
    userId: v.id("users"),
    voteType: v.union(v.literal("upvote"), v.literal("downvote")),
  })
    .index("by_question", ["questionId"])
    .index("by_user", ["userId"])
    .index("by_question_and_user", ["questionId", "userId"]),

  // Question stars (favorites)
  questionStars: defineTable({
    questionId: v.id("questions"),
    userId: v.id("users"),
  })
    .index("by_question", ["questionId"])
    .index("by_user", ["userId"])
    .index("by_question_and_user", ["questionId", "userId"]),

  ...authTables,
});
