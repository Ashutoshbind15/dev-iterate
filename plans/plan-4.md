# Plan 4 — Wiring: submission flow without Kestra (client → Convex → code-exec → Convex)

## Goal

Implement an end-to-end submission pipeline for coding questions **without Kestra**:

- User submits code from the client.
- A Convex mutation creates a submission record (`queued`) and triggers an internal action.
- The Convex action calls the local Express `code-execution` server.
- code-exec fetches testcases via Convex HTTP, judges, and updates the result via Convex HTTP.
- Client sees real-time updates via Convex subscription (no polling needed).

This provides full "solve" UX in the test branch and is easy to swap later with background workers / k8s jobs.

---

## Architecture (Implemented)

```
┌────────────┐     1. createCodingSubmission()     ┌─────────────┐
│   Client   │ ─────────────────────────────────▶  │   Convex    │
│            │                                      │  (Mutation) │
│            │                                      │             │
│            │  ◀────── Real-time subscription ───  │  Database   │
│            │         (status updates)            │             │
└────────────┘                                      └──────┬──────┘
                                                          │
                                            2. scheduler.runAfter(0)
                                                          │
                                                          ▼
                                                   ┌──────────────┐
                                                   │   Convex     │
                                                   │   (Action)   │
                                                   └──────┬───────┘
                                                          │
                                            3. POST /v1/judge-question
                                               (fire-and-forget)
                                                          │
                                                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                        code-exec server                          │
│                                                                  │
│  SYNC (before 202 response):                                     │
│  4. Mark submission as "running" (POST /coding/submission-running)│
│  5. Return 202 Accepted immediately                              │
│                                                                  │
│  ASYNC (background, after response sent):                        │
│  6. Fetch testcases (POST /coding/testcases)                     │
│  7. Run Judge0 sequential fail-fast                              │
│  8. Update result (POST /coding/submission-result)               │
└─────────────────────────────────────────────────────────────────┘
```

### Fire-and-Forget Pattern

The Convex action only waits for the code-exec server to acknowledge the request and mark the submission as "running". The actual execution happens in the background:

1. **Action sends request** → waits ~100-200ms for 202 Accepted
2. **Code-exec returns 202** → action completes, Convex resources freed
3. **Background processing** → code-exec continues independently
4. **Results pushed back** → via HTTP callbacks to Convex

This prevents Convex actions from blocking for the entire execution duration (which could be 10+ seconds with many test cases or TLE scenarios).

### Why this architecture?

- **Client simplicity**: Client only calls one mutation, subscribes to one query. No need to know about code-exec.
- **Real-time updates**: Convex subscriptions give instant status updates without polling.
- **Hidden testcases secure**: Never sent to browser; code-exec fetches from Convex server-side.
- **Future-proof**: Easy to replace code-exec with k8s workers, Kestra, etc.

---

## Deliverables (Completed ✅)

### 1) Convex Action: `triggerCodeExecution` ✅

Location: `app/convex/actionsdir/codeExecution.ts`

- Internal action triggered by mutation scheduler
- **Fire-and-forget**: Calls code-exec server's `/v1/judge-question` endpoint
- Only waits for 202 Accepted (submission queued), not execution completion
- If code-exec unreachable or returns error, updates submission to `error` state
- Completes in ~100-200ms regardless of execution duration

### 2) Modified Mutation: `createCodingSubmission` ✅

Location: `app/convex/mutations/codingSubmissions.ts`

- Creates submission with `queued` status
- Schedules `triggerCodeExecution` action immediately via `ctx.scheduler.runAfter(0, ...)`
- Returns `submissionId` for client to subscribe to

### 3) Convex HTTP Actions for code-exec ↔ Convex ✅

Location: `app/convex/httpactions/codingSubmissions.ts`

Routes registered in `app/convex/http.ts`:

- `POST /coding/testcases` - Returns all testcases (public + hidden) + question settings
- `POST /coding/submission-running` - Marks submission as running
- `POST /coding/submission-result` - Updates final submission result

**Note**: These are currently open (no auth). TODO: Add M2M token validation later.

### 4) Code-exec Endpoint: `POST /v1/judge-question` ✅

Location: `code-execution/src/index.ts`

Request: `{ questionId, submissionId, languageId, sourceCode }`

**Synchronous Flow (before 202 response):**

1. Validate request (source size, config)
2. Mark submission as `running` via Convex HTTP callback
3. Return 202 Accepted immediately

**Asynchronous Flow (background, after response sent):**

4. Fetch testcases from Convex HTTP (both visibilities)
5. Use question's `outputComparison` settings
6. Run Judge0 sequentially (fail-fast)
7. Update submission result via Convex HTTP callback

This fire-and-forget pattern ensures the Convex action completes quickly while execution continues in the background.

### 5) Environment Variables ✅

**Convex** (set in dashboard or `.env.local`):

```
CODE_EXEC_URL=http://localhost:4001
```

**Code-exec** (`.env`):

```
CONVEX_SITE_URL=http://127.0.0.1:3212
```

---

## Status Flow

| Status    | Description                                  |
| --------- | -------------------------------------------- |
| `queued`  | Submission created, action scheduled         |
| `running` | code-exec started processing                 |
| `passed`  | All testcases passed                         |
| `failed`  | At least one testcase failed                 |
| `error`   | System error (network, config, Judge0 issue) |

---

## Verification checklist (stage 4)

1. ✅ Create coding question with hidden testcases (via plan 3)
2. ✅ Solve page displays only public testcases (via `getCodingQuestionForSolve` query)
3. ⏳ Submit correct code → submission transitions: queued → running → passed
4. ⏳ Submit wrong code → transitions: queued → running → failed
5. ⏳ UI displays first failing testcase index and actual vs expected
6. ✅ Hidden testcases never sent to client (fetched server-side by code-exec)

**Items 3-5 require client UI (see Plan 4.5)**

---

## Out of scope (explicitly not in this stage)

- Async job queue / Kestra / worker pods
- Rate limiting & abuse protection beyond basic caps
- M2M authentication tokens (TODO added in code)
- Client UI for submissions (see Plan 4.5)
