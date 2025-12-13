import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";

/**
 * Seed coding questions for testing.
 * Run from Convex dashboard or CLI:
 *   npx convex run mutations/seed:seedCodingQuestions --prod
 *
 * Requires a userId (author) - get from users table in dashboard.
 */
export const seedCodingQuestions = internalMutation({
  args: {
    authorId: v.id("users"),
  },
  returns: v.object({
    created: v.number(),
    questionIds: v.array(v.id("codingQuestions")),
  }),
  handler: async (ctx, args) => {
    const questionIds: Id<"codingQuestions">[] = [];

    // Sample coding questions
    const questions = [
      {
        title: "Two Sum",
        promptRichText: JSON.stringify({
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Given an array of integers ",
                },
                {
                  type: "text",
                  marks: [{ type: "code" }],
                  text: "nums",
                },
                {
                  type: "text",
                  text: " and an integer ",
                },
                {
                  type: "text",
                  marks: [{ type: "code" }],
                  text: "target",
                },
                {
                  type: "text",
                  text: ", return indices of the two numbers such that they add up to ",
                },
                {
                  type: "text",
                  marks: [{ type: "code" }],
                  text: "target",
                },
                {
                  type: "text",
                  text: ".",
                },
              ],
            },
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "You may assume that each input would have exactly one solution, and you may not use the same element twice.",
                },
              ],
            },
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "You can return the answer in any order.",
                },
              ],
            },
            {
              type: "heading",
              attrs: { level: 3 },
              content: [{ type: "text", text: "Input Format" }],
            },
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "First line: space-separated integers (the array). Second line: the target sum.",
                },
              ],
            },
            {
              type: "heading",
              attrs: { level: 3 },
              content: [{ type: "text", text: "Output Format" }],
            },
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Two space-separated indices (0-indexed).",
                },
              ],
            },
          ],
        }),
        difficulty: "easy" as const,
        tags: ["array", "hash-table"],
        languageIdsAllowed: [71, 63, 62, 54], // Python 3, JS, Java, C++
        defaultLanguageId: 71, // Python 3
        timeLimitSeconds: 2,
        memoryLimitMb: 256,
        outputComparison: {
          trimOutputs: true,
          normalizeWhitespace: true,
          caseSensitive: true,
        },
        starterCode: {
          "71": `# Read input
nums = list(map(int, input().split()))
target = int(input())

# Your solution here
def two_sum(nums, target):
    pass

result = two_sum(nums, target)
print(result[0], result[1])
`,
          "63": `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });

const lines = [];
rl.on('line', (line) => lines.push(line));
rl.on('close', () => {
  const nums = lines[0].split(' ').map(Number);
  const target = parseInt(lines[1]);
  
  // Your solution here
  function twoSum(nums, target) {
    
  }
  
  const result = twoSum(nums, target);
  console.log(result[0], result[1]);
});
`,
        },
        testCases: [
          {
            visibility: "public" as const,
            stdin: "2 7 11 15\n9",
            expectedStdout: "0 1",
            name: "Example 1",
          },
          {
            visibility: "public" as const,
            stdin: "3 2 4\n6",
            expectedStdout: "1 2",
            name: "Example 2",
          },
          {
            visibility: "hidden" as const,
            stdin: "3 3\n6",
            expectedStdout: "0 1",
            name: "Same elements",
          },
          {
            visibility: "hidden" as const,
            stdin: "1 2 3 4 5 6 7 8 9 10\n19",
            expectedStdout: "8 9",
            name: "Larger array",
          },
        ],
      },
      {
        title: "FizzBuzz",
        promptRichText: JSON.stringify({
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Write a program that prints the numbers from 1 to n. But for multiples of three print ",
                },
                {
                  type: "text",
                  marks: [{ type: "code" }],
                  text: "Fizz",
                },
                {
                  type: "text",
                  text: " instead of the number and for the multiples of five print ",
                },
                {
                  type: "text",
                  marks: [{ type: "code" }],
                  text: "Buzz",
                },
                {
                  type: "text",
                  text: ". For numbers which are multiples of both three and five print ",
                },
                {
                  type: "text",
                  marks: [{ type: "code" }],
                  text: "FizzBuzz",
                },
                {
                  type: "text",
                  text: ".",
                },
              ],
            },
            {
              type: "heading",
              attrs: { level: 3 },
              content: [{ type: "text", text: "Input" }],
            },
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "A single integer n (1 ≤ n ≤ 100).",
                },
              ],
            },
            {
              type: "heading",
              attrs: { level: 3 },
              content: [{ type: "text", text: "Output" }],
            },
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Print n lines, each containing either the number, Fizz, Buzz, or FizzBuzz.",
                },
              ],
            },
          ],
        }),
        difficulty: "easy" as const,
        tags: ["basics", "conditionals"],
        languageIdsAllowed: [71, 63, 62, 54],
        defaultLanguageId: 71,
        timeLimitSeconds: 1,
        memoryLimitMb: 128,
        outputComparison: {
          trimOutputs: true,
          normalizeWhitespace: false,
          caseSensitive: true,
        },
        starterCode: {
          "71": `n = int(input())

# Your solution here
for i in range(1, n + 1):
    pass
`,
        },
        testCases: [
          {
            visibility: "public" as const,
            stdin: "5",
            expectedStdout: "1\n2\nFizz\n4\nBuzz",
            name: "n=5",
          },
          {
            visibility: "public" as const,
            stdin: "15",
            expectedStdout:
              "1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz",
            name: "n=15",
          },
          {
            visibility: "hidden" as const,
            stdin: "1",
            expectedStdout: "1",
            name: "n=1",
          },
          {
            visibility: "hidden" as const,
            stdin: "30",
            expectedStdout:
              "1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz\n16\n17\nFizz\n19\nBuzz\nFizz\n22\n23\nFizz\nBuzz\n26\nFizz\n28\n29\nFizzBuzz",
            name: "n=30",
          },
        ],
      },
      {
        title: "Palindrome Check",
        promptRichText: JSON.stringify({
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Given a string, determine if it is a palindrome, considering only alphanumeric characters and ignoring case.",
                },
              ],
            },
            {
              type: "heading",
              attrs: { level: 3 },
              content: [{ type: "text", text: "Input" }],
            },
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "A single line containing a string (may contain spaces and punctuation).",
                },
              ],
            },
            {
              type: "heading",
              attrs: { level: 3 },
              content: [{ type: "text", text: "Output" }],
            },
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Print ",
                },
                {
                  type: "text",
                  marks: [{ type: "code" }],
                  text: "true",
                },
                {
                  type: "text",
                  text: " if it is a palindrome, ",
                },
                {
                  type: "text",
                  marks: [{ type: "code" }],
                  text: "false",
                },
                {
                  type: "text",
                  text: " otherwise.",
                },
              ],
            },
          ],
        }),
        difficulty: "easy" as const,
        tags: ["string", "two-pointers"],
        languageIdsAllowed: [71, 63],
        defaultLanguageId: 71,
        timeLimitSeconds: 1,
        memoryLimitMb: 128,
        outputComparison: {
          trimOutputs: true,
          normalizeWhitespace: true,
          caseSensitive: false,
        },
        starterCode: {
          "71": `s = input()

# Your solution here
def is_palindrome(s):
    pass

print("true" if is_palindrome(s) else "false")
`,
        },
        testCases: [
          {
            visibility: "public" as const,
            stdin: "A man, a plan, a canal: Panama",
            expectedStdout: "true",
            name: "Classic palindrome",
          },
          {
            visibility: "public" as const,
            stdin: "race a car",
            expectedStdout: "false",
            name: "Not a palindrome",
          },
          {
            visibility: "hidden" as const,
            stdin: " ",
            expectedStdout: "true",
            name: "Empty/space",
          },
          {
            visibility: "hidden" as const,
            stdin: "Was it a car or a cat I saw?",
            expectedStdout: "true",
            name: "Another palindrome",
          },
        ],
      },
      {
        title: "Maximum Subarray",
        promptRichText: JSON.stringify({
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Given an integer array ",
                },
                {
                  type: "text",
                  marks: [{ type: "code" }],
                  text: "nums",
                },
                {
                  type: "text",
                  text: ", find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.",
                },
              ],
            },
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  marks: [{ type: "bold" }],
                  text: "Hint: ",
                },
                {
                  type: "text",
                  text: "Consider Kadane's algorithm for an O(n) solution.",
                },
              ],
            },
            {
              type: "heading",
              attrs: { level: 3 },
              content: [{ type: "text", text: "Input" }],
            },
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "A single line of space-separated integers.",
                },
              ],
            },
            {
              type: "heading",
              attrs: { level: 3 },
              content: [{ type: "text", text: "Output" }],
            },
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "The maximum subarray sum.",
                },
              ],
            },
          ],
        }),
        difficulty: "medium" as const,
        tags: ["array", "dynamic-programming", "divide-and-conquer"],
        languageIdsAllowed: [71, 63, 54],
        defaultLanguageId: 71,
        timeLimitSeconds: 2,
        memoryLimitMb: 256,
        outputComparison: {
          trimOutputs: true,
          normalizeWhitespace: true,
          caseSensitive: true,
        },
        starterCode: {
          "71": `nums = list(map(int, input().split()))

def max_subarray(nums):
    # Your solution here
    pass

print(max_subarray(nums))
`,
        },
        testCases: [
          {
            visibility: "public" as const,
            stdin: "-2 1 -3 4 -1 2 1 -5 4",
            expectedStdout: "6",
            name: "Mixed positive/negative",
          },
          {
            visibility: "public" as const,
            stdin: "1",
            expectedStdout: "1",
            name: "Single element",
          },
          {
            visibility: "hidden" as const,
            stdin: "-1 -2 -3 -4",
            expectedStdout: "-1",
            name: "All negative",
          },
          {
            visibility: "hidden" as const,
            stdin: "5 4 -1 7 8",
            expectedStdout: "23",
            name: "Mostly positive",
          },
        ],
      },
      {
        title: "Binary Search",
        promptRichText: JSON.stringify({
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Given a sorted array of distinct integers and a target value, return the index if the target is found. If not, return -1.",
                },
              ],
            },
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "You must implement binary search with O(log n) runtime complexity.",
                },
              ],
            },
            {
              type: "heading",
              attrs: { level: 3 },
              content: [{ type: "text", text: "Input" }],
            },
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "First line: space-separated sorted integers. Second line: target value.",
                },
              ],
            },
            {
              type: "heading",
              attrs: { level: 3 },
              content: [{ type: "text", text: "Output" }],
            },
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Index of target (0-indexed) or -1 if not found.",
                },
              ],
            },
          ],
        }),
        difficulty: "easy" as const,
        tags: ["binary-search", "array"],
        languageIdsAllowed: [71, 63, 54],
        defaultLanguageId: 71,
        timeLimitSeconds: 1,
        memoryLimitMb: 128,
        outputComparison: {
          trimOutputs: true,
          normalizeWhitespace: true,
          caseSensitive: true,
        },
        starterCode: {
          "71": `nums = list(map(int, input().split()))
target = int(input())

def binary_search(nums, target):
    # Your solution here
    pass

print(binary_search(nums, target))
`,
        },
        testCases: [
          {
            visibility: "public" as const,
            stdin: "-1 0 3 5 9 12\n9",
            expectedStdout: "4",
            name: "Found in array",
          },
          {
            visibility: "public" as const,
            stdin: "-1 0 3 5 9 12\n2",
            expectedStdout: "-1",
            name: "Not found",
          },
          {
            visibility: "hidden" as const,
            stdin: "5\n5",
            expectedStdout: "0",
            name: "Single element found",
          },
          {
            visibility: "hidden" as const,
            stdin: "1 2 3 4 5 6 7 8 9 10\n1",
            expectedStdout: "0",
            name: "First element",
          },
          {
            visibility: "hidden" as const,
            stdin: "1 2 3 4 5 6 7 8 9 10\n10",
            expectedStdout: "9",
            name: "Last element",
          },
        ],
      },
      {
        title: "Merge Two Sorted Lists",
        promptRichText: JSON.stringify({
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "You are given two sorted arrays. Merge them into one sorted array.",
                },
              ],
            },
            {
              type: "heading",
              attrs: { level: 3 },
              content: [{ type: "text", text: "Input" }],
            },
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "First line: space-separated integers (first sorted array). Second line: space-separated integers (second sorted array). Either array may be empty (blank line).",
                },
              ],
            },
            {
              type: "heading",
              attrs: { level: 3 },
              content: [{ type: "text", text: "Output" }],
            },
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Space-separated integers of the merged sorted array.",
                },
              ],
            },
          ],
        }),
        difficulty: "easy" as const,
        tags: ["array", "two-pointers", "sorting"],
        languageIdsAllowed: [71, 63],
        defaultLanguageId: 71,
        timeLimitSeconds: 1,
        memoryLimitMb: 128,
        outputComparison: {
          trimOutputs: true,
          normalizeWhitespace: true,
          caseSensitive: true,
        },
        starterCode: {
          "71": `line1 = input().strip()
line2 = input().strip()

nums1 = list(map(int, line1.split())) if line1 else []
nums2 = list(map(int, line2.split())) if line2 else []

def merge(nums1, nums2):
    # Your solution here
    pass

result = merge(nums1, nums2)
print(' '.join(map(str, result)))
`,
        },
        testCases: [
          {
            visibility: "public" as const,
            stdin: "1 2 4\n1 3 4",
            expectedStdout: "1 1 2 3 4 4",
            name: "Two non-empty lists",
          },
          {
            visibility: "public" as const,
            stdin: "\n0",
            expectedStdout: "0",
            name: "First list empty",
          },
          {
            visibility: "hidden" as const,
            stdin: "1 2 3\n\n",
            expectedStdout: "1 2 3",
            name: "Second list empty",
          },
          {
            visibility: "hidden" as const,
            stdin: "1 5 9\n2 4 6 8 10",
            expectedStdout: "1 2 4 5 6 8 9 10",
            name: "Different lengths",
          },
        ],
      },
    ];

    // Create each question with its testcases
    for (const q of questions) {
      const questionId = await ctx.db.insert("codingQuestions", {
        title: q.title,
        promptRichText: q.promptRichText,
        authorId: args.authorId,
        upvotes: 0,
        downvotes: 0,
        difficulty: q.difficulty,
        tags: q.tags,
        languageIdsAllowed: q.languageIdsAllowed,
        defaultLanguageId: q.defaultLanguageId,
        timeLimitSeconds: q.timeLimitSeconds,
        memoryLimitMb: q.memoryLimitMb,
        outputComparison: q.outputComparison,
        starterCode: q.starterCode as Record<string, string>,
      });

      // Create testcases
      for (let i = 0; i < q.testCases.length; i++) {
        const tc = q.testCases[i];
        await ctx.db.insert("codingTestCases", {
          questionId,
          visibility: tc.visibility,
          stdin: tc.stdin,
          expectedStdout: tc.expectedStdout,
          name: tc.name,
          order: i,
        });
      }

      questionIds.push(questionId);
    }

    return {
      created: questionIds.length,
      questionIds,
    };
  },
});

/**
 * Clear all coding questions and testcases.
 * Use with caution - deletes all data!
 */
export const clearCodingQuestions = internalMutation({
  args: {},
  returns: v.object({
    deletedQuestions: v.number(),
    deletedTestCases: v.number(),
    deletedSubmissions: v.number(),
  }),
  handler: async (ctx) => {
    // Delete all submissions
    const submissions = await ctx.db.query("codingSubmissions").collect();
    for (const sub of submissions) {
      await ctx.db.delete(sub._id);
    }

    // Delete all testcases
    const testCases = await ctx.db.query("codingTestCases").collect();
    for (const tc of testCases) {
      await ctx.db.delete(tc._id);
    }

    // Delete all questions
    const questions = await ctx.db.query("codingQuestions").collect();
    for (const q of questions) {
      await ctx.db.delete(q._id);
    }

    return {
      deletedQuestions: questions.length,
      deletedTestCases: testCases.length,
      deletedSubmissions: submissions.length,
    };
  },
});
