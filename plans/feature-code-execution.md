# Feature: Code Execution System

> High-level architecture and design decisions for the coding question execution feature.
> This document is designed to be shared with LLMs for context in other sessions.

## Overview

This system provides "LeetCode/Codeforces-style" code execution for programming challenges. Users submit code, which gets judged against test cases (both public and hidden), with real-time status updates.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (React + Vite)                          │
│  - Submit code via Convex mutation                                          │
│  - Subscribe to submission status (real-time updates via Convex)            │
│  - Never sees hidden testcases                                              │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
                           1. createCodingSubmission()
                              (returns submissionId)
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CONVEX BACKEND                                  │
│                                                                              │
│  ┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────┐  │
│  │      Mutation       │    │       Action        │    │  HTTP Actions   │  │
│  │ codingSubmissions   │───▶│  codeExecution      │    │ (for callbacks) │  │
│  │                     │    │  triggerCodeExec    │    │                 │  │
│  │ - Create submission │    │                     │    │ - /testcases    │  │
│  │ - Status: "queued"  │    │ - Fire-and-forget   │    │ - /sub-running  │  │
│  │ - Schedule action   │    │   HTTP to code-exec │    │ - /sub-result   │  │
│  └─────────────────────┘    └──────────┬──────────┘    └────────▲────────┘  │
│                                        │                        │           │
│  ┌─────────────────────┐               │                        │           │
│  │      Database       │               │                        │           │
│  │ - codingQuestions   │               │                        │           │
│  │ - codingTestCases   │               │                        │           │
│  │ - codingSubmissions │               │                        │           │
│  └─────────────────────┘               │                        │           │
└────────────────────────────────────────┼────────────────────────┼───────────┘
                                         │                        │
                           2. POST /v1/judge-question             │
                              (fire-and-forget)                   │
                                         │                        │
                                         ▼                        │
┌─────────────────────────────────────────────────────────────────┼───────────┐
│                         CODE-EXEC SERVER (Express/Node)         │           │
│                                                                 │           │
│  On request:                                                    │           │
│  ┌──────────────────────────────────────────────────────────────┼─────────┐ │
│  │ 1. Validate request                                          │         │ │
│  │ 2. Mark submission "running" via HTTP callback ──────────────┘         │ │
│  │ 3. Return 202 Accepted immediately (fire-and-forget)                   │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  Background (async, after response sent):                                   │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ 4. Fetch testcases from Convex HTTP                                    │ │
│  │ 5. Run Judge0 sequential fail-fast (compile, run, compare)             │ │
│  │ 6. Update submission result via Convex HTTP callback                   │ │
│  └───────────────────────────────────┬────────────────────────────────────┘ │
│                                      │                                      │
└──────────────────────────────────────┼──────────────────────────────────────┘
                                       │
                           Judge0 API calls
                           (submit, poll for result)
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              JUDGE0 (Docker)                                 │
│  - Sandboxed code execution                                                 │
│  - Compile + run user code                                                  │
│  - Resource limits (CPU, memory, wall time)                                 │
│  - Returns stdout, stderr, compile_output, status                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Communication Patterns

### 1. Client → Convex (Submission)

```typescript
// Client calls mutation, gets submissionId
const submissionId = await createCodingSubmission({
  questionId,
  languageId,
  sourceCode,
});

// Client subscribes to submission for real-time updates
const submission = useQuery(api.queries.codingSubmissions.getCodingSubmission, {
  submissionId,
});
// submission.status: "queued" → "running" → "passed" | "failed" | "error"
```

**Key insight**: Client never polls. Convex subscriptions push updates automatically.

### 2. Convex → Code-Exec (Fire-and-Forget)

The Convex action triggers code execution but **does not wait** for completion:

```typescript
// In Convex action (codeExecution.ts)
const response = await fetch(judgeUrl, {
  method: "POST",
  body: JSON.stringify({ questionId, submissionId, languageId, sourceCode }),
});

// We only wait for 202 Accepted (submission queued)
// NOT for execution to complete
if (response.status === 202) {
  console.log("Submission queued for execution");
}
// Action returns immediately - frees up Convex resources
```

**Why fire-and-forget?**

- Convex actions have execution time limits
- Code execution can take 10+ seconds (many test cases, TLE scenarios)
- Results are pushed back via HTTP callbacks anyway

### 3. Code-Exec → Convex (HTTP Callbacks)

The code-exec server updates Convex via HTTP endpoints:

```
POST /coding/submission-running   → marks status = "running"
POST /coding/submission-result    → updates final result (passed/failed/error)
POST /coding/testcases            → fetches testcases (both public + hidden)
```

**Why HTTP callbacks instead of direct DB access?**

- Code-exec doesn't have Convex credentials
- Clear separation of concerns
- Easy to swap code-exec implementation later (K8s jobs, etc.)

### 4. Code-Exec → Judge0 (Sequential Execution)

Test cases are run sequentially with fail-fast:

```typescript
for (const testCase of testCases) {
  const result = await judge0.submitAndWait({
    sourceCode,
    languageId,
    stdin: testCase.stdin,
    cpuTimeLimit: question.timeLimitSeconds,
    memoryLimit: question.memoryLimitMb * 1024,
  });

  if (failed(result)) {
    // Stop immediately, report first failure
    await updateConvexSubmissionResult(submissionId, {
      status: "failed",
      firstFailureIndex: i,
      firstFailure: { stdin, actualOutput, expectedOutput, errorMessage },
    });
    return;
  }
}

// All passed
await updateConvexSubmissionResult(submissionId, { status: "passed" });
```

**Why sequential fail-fast?**

- Faster feedback (stop at first failure)
- Lower resource usage
- Matches user mental model ("which test case failed?")

## Data Model

### Tables

| Table               | Purpose                                                |
| ------------------- | ------------------------------------------------------ | --------- |
| `codingQuestions`   | Question metadata, prompt, limits, comparison settings |
| `codingTestCases`   | Test cases with `visibility: "public"                  | "hidden"` |
| `codingSubmissions` | User submissions with status and results               |

### Submission Status Flow

```
queued → running → passed
                 → failed (with firstFailure details)
                 → error (system error)
```

### Security: Hidden Test Cases

- **Never** sent to client
- Client query (`getCodingQuestionForSolve`) only returns public test cases
- Code-exec fetches all test cases server-side via Convex HTTP
- For failed hidden tests: only show "Wrong answer on hidden test case #N" (no expected output)

## Key Files

### Convex Backend (`app/convex/`)

| File                               | Purpose                                         |
| ---------------------------------- | ----------------------------------------------- |
| `schema.ts`                        | Database schema definitions                     |
| `mutations/codingSubmissions.ts`   | Create submission, update results               |
| `queries/codingSubmissions.ts`     | Get submission, list submissions                |
| `queries/codingQuestions.ts`       | Get question (with testcase visibility control) |
| `actionsdir/codeExecution.ts`      | Fire-and-forget trigger to code-exec            |
| `httpactions/codingSubmissions.ts` | HTTP callbacks for code-exec                    |
| `http.ts`                          | HTTP route registration                         |

### Code-Exec Server (`code-execution/src/`)

| File                | Purpose                                                |
| ------------------- | ------------------------------------------------------ |
| `index.ts`          | Express server, `/v1/judge-question` endpoint          |
| `judge0/client.ts`  | Judge0 API client (submit, poll, result parsing)       |
| `judge0/compare.ts` | Output comparison (trim, whitespace, case sensitivity) |
| `contracts.ts`      | Request/response schemas (Zod)                         |
| `env.ts`            | Environment variable loading                           |

## Environment Variables

### Convex

```bash
CODE_EXEC_URL=http://localhost:4001  # URL of code-exec server
```

### Code-Exec

```bash
CONVEX_SITE_URL=http://127.0.0.1:3212  # Convex HTTP endpoint
JUDGE0_BASE_URL=http://localhost:2358  # Judge0 server
JUDGE0_API_KEY=                         # Optional, for hosted Judge0
PORT=4001
```

## Future Considerations

1. **M2M Authentication**: Add HMAC/API key between Convex and code-exec
2. **Rate Limiting**: Per-user submission limits
3. **Scaling**: Code-exec is stateless, can horizontally scale
4. **K8s Migration**: Code-exec → K8s Jobs, Judge0 → separate deployment

## Quick Reference: Submission Flow

1. User clicks "Submit" in UI
2. `createCodingSubmission` mutation creates record with `status: "queued"`
3. Mutation schedules `triggerCodeExecution` action
4. Action sends fire-and-forget POST to code-exec
5. Code-exec marks submission `"running"` (HTTP callback)
6. Code-exec returns 202 Accepted, action completes
7. Background: code-exec fetches testcases, runs Judge0
8. Code-exec updates result `"passed"/"failed"/"error"` (HTTP callback)
9. Client sees update via Convex subscription (automatic)

**Total Convex action time**: ~100-200ms (not blocked on execution)
**Total execution time**: Depends on test cases, typically 2-30 seconds
