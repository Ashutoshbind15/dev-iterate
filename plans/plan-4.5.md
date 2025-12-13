# Plan 4.5 — Client: Coding submission UI integration

## Goal

Wire up the client to use the submission flow from Plan 4:

- Submit code via Convex mutation (no direct code-exec calls)
- Subscribe to submission for real-time status updates
- Display results (passed/failed/error with details)

This is an intermediate step before Plan 5's full Monaco editor + question authoring UI.

> **Architecture reference**: See `plans/feature-code-execution.md` for high-level architecture details.

---

## Prerequisites

- Plan 4 completed (backend submission flow working)
- Coding question exists with testcases (Plan 3)
- `CODE_EXEC_URL` env var set in Convex
- `CONVEX_SITE_URL` env var set in code-exec

---

## Deliverables

### 1) Submission hook or utility

Create a reusable submission hook in `app/src/hooks/use-coding-submission.ts`:

```typescript
interface UseCodingSubmissionOptions {
  questionId: Id<"codingQuestions">;
}

interface UseCodingSubmissionReturn {
  // Submit code - returns submissionId
  submit: (
    sourceCode: string,
    languageId: number
  ) => Promise<Id<"codingSubmissions">>;

  // Current submission being tracked (for real-time updates)
  currentSubmission: Submission | null;

  // Loading state
  isSubmitting: boolean;

  // Set which submission to track
  trackSubmission: (submissionId: Id<"codingSubmissions">) => void;
}
```

Implementation:

- Uses `useMutation(api.mutations.codingSubmissions.createCodingSubmission)`
- Uses `useQuery(api.queries.codingSubmissions.getCodingSubmission, { submissionId })`
- Returns reactive submission state

### 2) Submission status component

Create `app/src/components/coding/submission-status.tsx`:

Display states:

- **queued**: "Submission queued..." with spinner
- **running**: "Running tests..." with spinner + progress if available
- **passed**: Success message with green check, testcase count
- **failed**: Error message with first failure details:
  - Testcase index
  - stdin (if public)
  - Expected output (if public)
  - Actual output
  - Error message (compile error, runtime error, TLE, wrong answer)
- **error**: System error message

### 3) Simple solve page (temporary)

Create or update `app/src/pages/coding-solve.tsx`:

Minimal UI for testing the flow:

- Question title + prompt (read-only)
- Simple textarea for code input (Monaco comes in Plan 5)
- Language selector dropdown
- Submit button
- Submission status component
- Recent submissions list

Route: `/coding/:questionId/solve`

### 4) Submission history component

Create `app/src/components/coding/submission-history.tsx`:

- Lists user's submissions for a question
- Uses `listMyCodingSubmissions` query
- Click to view details
- Shows: timestamp, status, passed/total count

---

## Client Flow

```
User writes code
       │
       ▼
Click "Submit"
       │
       ▼
┌──────────────────────────────────┐
│ Call createCodingSubmission()    │
│ Returns submissionId             │
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│ Subscribe to getCodingSubmission │
│ with returned submissionId       │
└──────────────┬───────────────────┘
               │
               ▼
       Real-time updates
       ┌───────┴───────┐
       │               │
       ▼               ▼
   "queued"  →  "running"  →  "passed" / "failed" / "error"
       │               │               │
       └───────┬───────┘               │
               │                       │
               ▼                       ▼
         Show spinner            Show result
```

---

## Example usage

```tsx
// In solve page component
const { submit, currentSubmission, isSubmitting, trackSubmission } =
  useCodingSubmission({
    questionId,
  });

const handleSubmit = async () => {
  const submissionId = await submit(sourceCode, languageId);
  trackSubmission(submissionId);
};

return (
  <div>
    <textarea
      value={sourceCode}
      onChange={(e) => setSourceCode(e.target.value)}
    />
    <select
      value={languageId}
      onChange={(e) => setLanguageId(Number(e.target.value))}
    >
      {/* language options */}
    </select>
    <button onClick={handleSubmit} disabled={isSubmitting}>
      {isSubmitting ? "Submitting..." : "Submit"}
    </button>

    {currentSubmission && <SubmissionStatus submission={currentSubmission} />}

    <SubmissionHistory questionId={questionId} />
  </div>
);
```

---

## Verification checklist (stage 4.5)

1. [ ] Navigate to solve page for a coding question
2. [ ] Enter code in textarea
3. [ ] Select language
4. [ ] Click Submit
5. [ ] See status transition: queued → running → passed/failed
6. [ ] For failed: see first failure details
7. [ ] Submission appears in history list
8. [ ] Multiple submissions work correctly
9. [ ] Error state shows if code-exec is down

---

## Files to create/modify

| File                                               | Action    |
| -------------------------------------------------- | --------- |
| `app/src/hooks/use-coding-submission.ts`           | Create    |
| `app/src/components/coding/submission-status.tsx`  | Create    |
| `app/src/components/coding/submission-history.tsx` | Create    |
| `app/src/pages/coding-solve.tsx`                   | Create    |
| `app/src/components/layout/routes.tsx`             | Add route |

---

## Out of scope (see Plan 5)

- Monaco editor integration
- Question creation UI
- Starter code loading
- "Run public tests only" feature
- Syntax highlighting in results
- Code formatting
