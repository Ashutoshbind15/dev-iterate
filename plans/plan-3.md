# Plan 3 — Data model: Convex schema for coding questions, testcases, and submissions

## Goal
Add the minimal Convex data structures to support “Codeforces/GFG-style” coding questions:

- A new question type: **coding**.
- Store testcases separately (preferably) and associate them to the question.
- Store submissions and their outcomes.

This stage focuses on schema + server-side Convex mutations/queries only (no UI).

---

## Design principles
- **Never expose “hidden” testcases to normal clients**. Only return sample/public testcases to the UI.
- Store testcases with a visibility flag: `public` vs `hidden`.
- Keep submissions immutable; append-only for auditability.

---

## Schema changes (Convex)
Update `app/convex/schema.ts` (names are suggestions; match existing conventions):

### 1) `codingQuestions` (or extend existing `questions`)
Option A (recommended): extend existing `questions` with a discriminator `type`.
- `type: "mcq" | "short" | "coding" | ...`
- For coding:
  - `title` (string)
  - `promptRichText` (string / JSON, depending on your editor)
  - `languageIdsAllowed` (array<number>) or `languagesAllowed` (array<string>)
  - `defaultLanguageId` (number)
  - `timeLimitSeconds` (number)
  - `memoryLimitMb` (number)
  - `outputComparison` (object):
    - `trimOutputs` (boolean)
    - `normalizeWhitespace` (boolean)
    - `caseSensitive` (boolean)
  - `starterCode` (map languageId -> string) optional
  - `createdBy` (user id)
  - `createdAt`, `updatedAt`

Option B: separate `codingQuestions` table. Only do this if existing `questions` is hard to extend.

### 2) `codingTestCases`
Each testcase row:
- `questionId` (Id<"questions"> or Id<"codingQuestions">)
- `visibility` (`"public" | "hidden"`)
- `stdin` (string)
- `expectedStdout` (string)
- `name` (string optional)
- `order` (number) for deterministic ordering
- `createdAt`

Indexes:
- by `questionId`
- by `questionId + visibility`

### 3) `codingSubmissions`
- `questionId`
- `userId`
- `languageId`
- `sourceCode` (string) — consider size limits; may store a hash + blob later
- `status` (`"queued" | "running" | "passed" | "failed" | "error"`)
- `passedCount`, `totalCount`
- `firstFailureIndex` (number | null)
- `firstFailure` (object | null): minimal redacted info (don’t store hidden expected output if you don’t want)
- `stdout`/`stderr`/`compileOutput` (optional; often helpful for UX, but can be large)
- `durationMs`
- `createdAt`

Indexes:
- by `questionId`
- by `userId`
- by `questionId + userId + createdAt` (for “my submissions” list)

---

## Convex functions
Add new files under `app/convex/mutations/` and `app/convex/queries/`.

### Mutations
1) `createCodingQuestion`
- create question record
- create testcases (public + hidden) in `codingTestCases`

2) `updateCodingQuestion`
- update metadata + prompt + allowed languages
- update testcases using “replace by questionId” strategy or diff strategy

3) `createCodingSubmission`
- validates user auth
- writes submission record with `status="queued"`
- returns submission id

4) `updateCodingSubmissionResult` (server-only / internal)
- sets `status` to passed/failed/error with summary fields
- should be callable only from a trusted backend path (see plan 4)

### Queries
1) `getCodingQuestionForSolve`
- returns question prompt + starterCode + **public** testcases only

2) `getCodingQuestionForAdmin`
- returns question + all testcases (authz: creator/admin)

3) `listMyCodingSubmissions(questionId?)`
- returns submissions list for the user

4) `getCodingSubmission(id)`
- returns submission detail (authz: owner/admin)

---

## Verification checklist (stage 3)
1) Convex deploy (dev):
- `pnpm --filter app convex dev` (or existing dev script)

2) From Convex dashboard / dev tools:
- Create a coding question with:
  - 2 public testcases + 3 hidden
- Query “solve” view:
  - only public testcases returned
- Create a submission:
  - submission created with queued status

---

## Out of scope (explicitly not in this stage)
- Running code / judge integration.
- UI authoring pages / solve pages updates.


