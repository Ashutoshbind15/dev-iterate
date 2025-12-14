import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  // ============================================================
  // SYSTEM-CREATED LESSONS (kept separate from user-created lessons)
  // ============================================================

  // System-generated rich text content blocks (TipTap JSON)
  sysContents: defineTable({
    title: v.string(),
    content: v.string(), // JSON stringified TipTap content
    status: v.optional(
      v.union(v.literal("pending"), v.literal("completed"), v.literal("failed"))
    ),
    generationTopic: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
  }),

  // System-generated diagrams (Mermaid syntax)
  sysDiagrams: defineTable({
    title: v.string(),
    mermaid: v.string(),
    // Cached Excalidraw representation (optional; filled on first render)
    elements: v.optional(v.string()), // JSON stringified Excalidraw elements
    appState: v.optional(v.string()), // JSON stringified Excalidraw appState
    status: v.optional(
      v.union(v.literal("pending"), v.literal("completed"), v.literal("failed"))
    ),
    generationTopic: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
  }),

  // System-generated lessons that contain ordered content and diagrams
  sysLessons: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    upvotes: v.optional(v.number()),
    items: v.optional(
      v.array(
        v.object({
          type: v.union(v.literal("content"), v.literal("diagram")),
          itemId: v.string(), // ID reference to sysContents or sysDiagrams
          order: v.number(),
        })
      )
    ),
  }).index("by_upvotes", ["upvotes"]),

  // System lesson upvotes (one per user)
  sysLessonVotes: defineTable({
    lessonId: v.id("sysLessons"),
    userId: v.id("users"),
  })
    .index("by_lessonId", ["lessonId"])
    .index("by_userId", ["userId"])
    .index("by_lessonId_and_userId", ["lessonId", "userId"]),

  // Rich text content blocks
  contents: defineTable({
    title: v.string(),
    content: v.string(), // JSON stringified TipTap content
    status: v.optional(
      v.union(v.literal("pending"), v.literal("completed"), v.literal("failed"))
    ),
    generationTopic: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    // Owner (Convex Auth user _id)
    userId: v.optional(v.id("users")),
  }).index("by_userId", ["userId"]),

  // Excalidraw diagrams
  diagrams: defineTable({
    title: v.string(),
    elements: v.string(), // JSON stringified Excalidraw elements
    appState: v.string(), // JSON stringified Excalidraw appState
    // Owner (Convex Auth user _id)
    userId: v.optional(v.id("users")),
  }).index("by_userId", ["userId"]),

  // Lessons that contain ordered content and diagrams
  lessons: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    upvotes: v.optional(v.number()),
    // Owner (Convex Auth user _id)
    userId: v.optional(v.id("users")),
    items: v.optional(
      v.array(
        v.object({
          type: v.union(v.literal("content"), v.literal("diagram")),
          itemId: v.string(), // ID reference to content or diagram
          order: v.number(),
        })
      )
    ),
  })
    .index("by_userId", ["userId"])
    .index("by_upvotes", ["upvotes"]),

  // Lesson upvotes (one per user)
  lessonVotes: defineTable({
    lessonId: v.id("lessons"),
    userId: v.id("users"),
  })
    .index("by_lessonId", ["lessonId"])
    .index("by_userId", ["userId"])
    .index("by_lessonId_and_userId", ["lessonId", "userId"]),

  // RSS feed summaries
  rssSummaries: defineTable({
    feedUrl: v.string(),
    feedTitle: v.optional(v.string()),
    summaryText: v.string(),
  }).index("by_feedUrl", ["feedUrl"]),

  // System/user generated topics (e.g. daily trends)
  topics: defineTable({
    name: v.string(),
    generatedBy: v.string(), // currently "system"
    generatedByUser: v.optional(v.id("users")), // optional owner (if user-generated)
  })
    .index("by_name", ["name"])
    .index("by_generatedBy_and_name", ["generatedBy", "name"]),

  // Summaries keyed by topic and kind (webresearch today; future: rss/rag/etc.)
  topicSummaries: defineTable({
    topicId: v.id("topics"),
    kind: v.string(), // e.g. "webresearch", "rss", "rag"
    summaryText: v.string(),
    generatedBy: v.string(), // currently "system"
    generatedByUser: v.optional(v.id("users")),
    updatedAt: v.number(),
  })
    .index("by_topicId", ["topicId"])
    .index("by_topicId_and_kind", ["topicId", "kind"]),

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

  // ============================================================
  // CODING QUESTIONS (separate/experimental feature)
  // ============================================================

  // Coding questions - Codeforces/LeetCode style problems
  codingQuestions: defineTable({
    title: v.string(),
    promptRichText: v.string(), // JSON stringified TipTap/rich-text content for problem statement
    authorId: v.id("users"),
    difficulty: v.union(
      v.literal("easy"),
      v.literal("medium"),
      v.literal("hard")
    ),
    tags: v.array(v.string()),
    upvotes: v.number(),
    downvotes: v.number(),
    // Allowed Judge0 language IDs (e.g., 71 for Python 3, 63 for JavaScript)
    languageIdsAllowed: v.array(v.number()),
    // Default language ID to show in editor
    defaultLanguageId: v.number(),
    // Time limit per testcase in seconds
    timeLimitSeconds: v.number(),
    // Memory limit in MB
    memoryLimitMb: v.number(),
    // Output comparison settings
    outputComparison: v.object({
      trimOutputs: v.boolean(),
      normalizeWhitespace: v.boolean(),
      caseSensitive: v.boolean(),
    }),
    // Starter code per language (key: languageId as string, value: code)
    starterCode: v.optional(v.record(v.string(), v.string())),
  })
    .index("by_author", ["authorId"])
    .index("by_upvotes", ["upvotes"])
    .index("by_difficulty", ["difficulty"]),

  // Testcases for coding questions
  codingTestCases: defineTable({
    questionId: v.id("codingQuestions"),
    visibility: v.union(v.literal("public"), v.literal("hidden")),
    stdin: v.string(),
    expectedStdout: v.string(),
    name: v.optional(v.string()), // Optional descriptive name
    order: v.number(), // For deterministic ordering
  })
    .index("by_questionId", ["questionId"])
    .index("by_questionId_and_visibility", ["questionId", "visibility"])
    .index("by_questionId_and_order", ["questionId", "order"]),

  // Submissions for coding questions
  codingSubmissions: defineTable({
    questionId: v.id("codingQuestions"),
    userId: v.id("users"),
    languageId: v.number(), // Judge0 language ID
    sourceCode: v.string(),
    status: v.union(
      v.literal("queued"),
      v.literal("running"),
      v.literal("passed"),
      v.literal("failed"),
      v.literal("error")
    ),
    // Results summary
    passedCount: v.optional(v.number()),
    totalCount: v.optional(v.number()),
    firstFailureIndex: v.optional(v.number()), // Index of first failing testcase (if any)
    // First failure details (redacted - don't expose hidden testcase expected output)
    firstFailure: v.optional(
      v.object({
        stdin: v.optional(v.string()), // Only shown for public testcases
        actualOutput: v.optional(v.string()),
        expectedOutput: v.optional(v.string()), // Only shown for public testcases
        errorMessage: v.optional(v.string()),
      })
    ),
    // Optional execution outputs (useful for debugging)
    stdout: v.optional(v.string()),
    stderr: v.optional(v.string()),
    compileOutput: v.optional(v.string()),
    // Execution metadata
    durationMs: v.optional(v.number()),
  })
    .index("by_questionId", ["questionId"])
    .index("by_userId", ["userId"])
    .index("by_questionId_and_userId", ["questionId", "userId"]),

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

  // User leaderboard stats (pre-computed for efficient queries)
  userStats: defineTable({
    userId: v.id("users"),
    score: v.number(), // Leaderboard score: +2 per correct, -1 per incorrect
    correctCount: v.number(),
    incorrectCount: v.number(),
    totalAnswers: v.number(),
    sortScore: v.number(), // Composite sort key: score * 1e6 + totalAnswers (for efficient DB sorting)
  })
    .index("by_user", ["userId"])
    .index("by_sortScore", ["sortScore"]),

  // User remarks from weakness analysis (one per batch of 5 questions)
  userRemarks: defineTable({
    userId: v.id("users"),
    remark: v.string(), // One-line remark from Kestra AI analysis
    questionIds: v.array(v.id("questions")), // The 5 questions that triggered this analysis
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  // Track weakness analysis executions to prevent redundant runs
  weaknessAnalysisExecutions: defineTable({
    userId: v.id("users"),
    questionIds: v.array(v.id("questions")), // The 5 questions being analyzed
    status: v.union(
      v.literal("pending"), // Analysis triggered but not completed
      v.literal("completed") // Analysis completed and remark saved
    ),
    triggeredAt: v.number(), // When the analysis was triggered
    completedAt: v.optional(v.number()), // When the remark was saved
  })
    .index("by_user", ["userId"])
    .index("by_user_and_status", ["userId", "status"]),

  // Personalized question submissions (track generation requests)
  personalizedQuestionSubmissions: defineTable({
    userId: v.id("users"),
    remarkIds: v.array(v.id("userRemarks")), // The remarks used for this submission
    analysis: v.string(), // Comma-separated analysis string
    status: v.union(
      v.literal("pending"), // Generation queued but not completed
      v.literal("completed"), // Generation completed
      v.literal("failed") // Generation failed
    ),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_status", ["userId", "status"]),

  // Personalized questions (separate from regular questions)
  personalizedQuestions: defineTable({
    userId: v.id("users"),
    submissionId: v.id("personalizedQuestionSubmissions"), // Link to the submission that generated this
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
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_submission", ["submissionId"]),

  // User answers to personalized questions (practice)
  personalizedAnswers: defineTable({
    personalizedQuestionId: v.id("personalizedQuestions"),
    userId: v.id("users"),
    answer: v.string(), // For MCQ: index as string. For descriptive: free text.
    isCorrect: v.boolean(),
    submittedAt: v.number(),
  })
    .index("by_personalizedQuestionId", ["personalizedQuestionId"])
    .index("by_userId", ["userId"])
    .index("by_personalizedQuestionId_and_userId", [
      "personalizedQuestionId",
      "userId",
    ]),

  // ============================================================
  // CODING QUESTION PERSONALIZATION
  // ============================================================

  // User remarks from coding weakness analysis (one per batch of 10 submissions)
  codingUserRemarks: defineTable({
    userId: v.id("users"),
    remark: v.string(), // One-line remark from Kestra AI analysis
    submissionIds: v.array(v.id("codingSubmissions")), // The 10 submissions that triggered this analysis
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  // Track coding weakness analysis executions to prevent redundant runs
  codingWeaknessAnalysisExecutions: defineTable({
    userId: v.id("users"),
    submissionIds: v.array(v.id("codingSubmissions")), // The 10 submissions being analyzed
    status: v.union(
      v.literal("pending"), // Analysis triggered but not completed
      v.literal("completed") // Analysis completed and remark saved
    ),
    triggeredAt: v.number(), // When the analysis was triggered
    completedAt: v.optional(v.number()), // When the remark was saved
  })
    .index("by_user", ["userId"])
    .index("by_user_and_status", ["userId", "status"]),

  // Personalized coding question submissions (track generation requests)
  personalizedCodingQuestionSubmissions: defineTable({
    userId: v.id("users"),
    remarkIds: v.array(v.id("codingUserRemarks")), // The remarks used for this submission
    analysis: v.string(), // Comma-separated analysis string
    status: v.union(
      v.literal("pending"), // Generation queued but not completed
      v.literal("completed"), // Generation completed
      v.literal("failed") // Generation failed
    ),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_status", ["userId", "status"]),

  // Personalized coding questions (separate from regular coding questions)
  personalizedCodingQuestions: defineTable({
    userId: v.id("users"),
    submissionId: v.id("personalizedCodingQuestionSubmissions"), // Link to the submission that generated this
    title: v.string(),
    promptRichText: v.string(), // JSON stringified TipTap/rich-text content for problem statement
    difficulty: v.union(
      v.literal("easy"),
      v.literal("medium"),
      v.literal("hard")
    ),
    tags: v.array(v.string()),
    // Allowed Judge0 language IDs (e.g., 71 for Python 3, 63 for JavaScript)
    languageIdsAllowed: v.array(v.number()),
    // Default language ID to show in editor
    defaultLanguageId: v.number(),
    // Time limit per testcase in seconds
    timeLimitSeconds: v.number(),
    // Memory limit in MB
    memoryLimitMb: v.number(),
    // Output comparison settings
    outputComparison: v.object({
      trimOutputs: v.boolean(),
      normalizeWhitespace: v.boolean(),
      caseSensitive: v.boolean(),
    }),
    // Starter code per language (key: languageId as string, value: code)
    starterCode: v.optional(v.record(v.string(), v.string())),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_submission", ["submissionId"]),

  // Testcases for personalized coding questions
  personalizedCodingTestCases: defineTable({
    questionId: v.id("personalizedCodingQuestions"),
    visibility: v.union(v.literal("public"), v.literal("hidden")),
    stdin: v.string(),
    expectedStdout: v.string(),
    name: v.optional(v.string()), // Optional descriptive name
    order: v.number(), // For deterministic ordering
  })
    .index("by_questionId", ["questionId"])
    .index("by_questionId_and_visibility", ["questionId", "visibility"])
    .index("by_questionId_and_order", ["questionId", "order"]),

  // Submissions for personalized coding questions
  personalizedCodingSubmissions: defineTable({
    questionId: v.id("personalizedCodingQuestions"),
    userId: v.id("users"),
    languageId: v.number(), // Judge0 language ID
    sourceCode: v.string(),
    status: v.union(
      v.literal("queued"),
      v.literal("running"),
      v.literal("passed"),
      v.literal("failed"),
      v.literal("error")
    ),
    // Results summary
    passedCount: v.optional(v.number()),
    totalCount: v.optional(v.number()),
    firstFailureIndex: v.optional(v.number()), // Index of first failing testcase (if any)
    // First failure details (redacted - don't expose hidden testcase expected output)
    firstFailure: v.optional(
      v.object({
        stdin: v.optional(v.string()), // Only shown for public testcases
        actualOutput: v.optional(v.string()),
        expectedOutput: v.optional(v.string()), // Only shown for public testcases
        errorMessage: v.optional(v.string()),
      })
    ),
    // Optional execution outputs (useful for debugging)
    stdout: v.optional(v.string()),
    stderr: v.optional(v.string()),
    compileOutput: v.optional(v.string()),
    // Execution metadata
    durationMs: v.optional(v.number()),
  })
    .index("by_questionId", ["questionId"])
    .index("by_userId", ["userId"])
    .index("by_questionId_and_userId", ["questionId", "userId"]),

  ...authTables,
});
