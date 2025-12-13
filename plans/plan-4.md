# Plan 4 — Wiring: submission flow without Kestra (client → Convex → code-exec → Convex)

## Goal
Implement an end-to-end submission pipeline for coding questions **without Kestra**:

- User submits code from the client.
- A Convex mutation creates a submission record (`queued`).
- The client calls the local Express `code-execution` server to judge against hidden+public testcases (server fetches testcases from Convex or client passes them—see below).
- The result is persisted back to Convex (submission updated to passed/failed/error).

This provides full “solve” UX in the test branch and is easy to swap later with background workers / k8s jobs.

---

## Two safe architecture options

### Option A (recommended): code-exec server fetches testcases from Convex
Flow:
1) Client -> Convex: `createCodingSubmission(questionId, sourceCode, languageId)` -> returns `submissionId`
2) Client -> code-exec: `POST /v1/judge-question` with `{ questionId, submissionId, sourceCode, languageId }`
3) code-exec -> Convex: fetch all testcases (including hidden) using a **server-only credential**
4) code-exec -> Judge0: run sequentially fail-fast
5) code-exec -> Convex: update submission result
6) Client -> Convex query: poll `getCodingSubmission(submissionId)` for UI updates

Pros:
- Hidden testcases never sent to browser.
- Clean boundary for future k8s scale-out.

Cons:
- code-exec server needs a way to authenticate to Convex.

### Option B: client passes testcases to code-exec
Not recommended because hidden testcases would reach the browser unless you only evaluate public testcases (which defeats real judging).

---

## Deliverables

### 1) New endpoint on code-exec: `POST /v1/judge-question`
Request:
- `questionId`
- `submissionId`
- `languageId`
- `sourceCode`

Response:
- Same as `/v1/judge`, plus `submissionId`

Implementation:
- Fetch testcases from Convex (both visibilities) and the question’s `outputComparison` settings (plan 3), then call the internal judge routine from plan 2.
- Always update the submission record in Convex (success/failure/error).

### 2) Code-exec ↔ Convex authentication
Implement a server-to-server credential approach appropriate for Convex:
- Use a dedicated env var in code-exec (e.g. `CONVEX_URL` + `CONVEX_ADMIN_KEY` or the recommended server credential mechanism for your Convex setup).
- Create Convex functions that are **server-only**:
  - `internalGetCodingTestCases(questionId)` (returns hidden+public)
  - `internalUpdateCodingSubmissionResult(submissionId, result)`

Important: ensure these cannot be called by untrusted clients.

### 3) Client submit behavior
On the solve page for coding questions:
- When user hits Submit:
  1) Call `createCodingSubmission` (Convex) -> `submissionId`
  2) Call `POST /v1/judge-question` (code-exec)
  3) Show progress states:
     - queued/running
     - passed/failed with first failing testcase info
  4) Refresh submission from Convex after code-exec returns (or poll while it runs, if you implement async)

**Sync vs async**
- Start with synchronous judging (one HTTP request that runs testcases sequentially). Works for small testcase sets.
- Later you can switch to async by returning early and having the client poll submission status.

---

## Verification checklist (stage 4)
1) Create coding question with hidden testcases.
2) Solve page displays only public testcases.
3) Submit correct code:
- Convex submission transitions: queued -> passed
4) Submit wrong code:
- transitions: queued -> failed
- UI displays first failing testcase index and actual vs expected (expected for hidden may be omitted from UI if desired)
5) Confirm hidden testcases are never sent to client network logs (devtools).

---

## Out of scope (explicitly not in this stage)
- Async job queue / Kestra / worker pods.
- Rate limiting & abuse protection beyond basic caps.


