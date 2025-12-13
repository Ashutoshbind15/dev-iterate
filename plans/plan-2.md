# Plan 2 — Implement `/v1/judge`: Judge0 integration + deterministic testcase evaluation

## Goal
Implement the actual judging flow in the `code-execution` Express server:

- Accept code + language + testcases.
- For each testcase, run on Judge0 (CE) and compare stdout with expected output using the **question-defined** comparison rules (plan 3) (or service defaults if question context is not available).
- Return `passed/failed` plus **the first failing testcase** details.
- Be safe-by-default (limits, timeouts, max sizes) and ready for horizontal scaling.

---

## Deliverables

### 1) Request validation + limits
In `code-execution`:
- Add schema validation (recommended: `zod`).
- Enforce:
  - `MAX_TESTCASES` (env)
  - `MAX_SOURCE_BYTES`
  - `MAX_STDIN_BYTES` per testcase
  - allowed `languageId` list (optional in this stage; can be later)
- Normalize newline conventions early (e.g. convert `\r\n` -> `\n`).

### 2) Judge0 client wrapper
Create a small module like `src/judge0/client.ts` that supports:
- `createSubmission({ source_code, language_id, stdin, expected_output?, cpu_time_limit?, memory_limit?, wall_time_limit? })`
- `getSubmission(token)` or batch variant

Judge0 specifics (typical):
- `POST /submissions/?base64_encoded=false&wait=false`
- `GET /submissions/{token}?base64_encoded=false`

**Timeouts**
- Use per-request timeout to Judge0 (e.g. 5–10s for each poll request).
- Use an overall request timeout (`REQUEST_TIMEOUT_MS`) for the entire `/v1/judge` call.

### 3) Execution strategy: sequential “fail-fast”
To satisfy “return first failing testcase”, do sequential execution:
- For `i in testCases`:
  - submit
  - poll until terminal status or timeout
  - collect stdout/stderr/compile_output/status_id
  - compare outputs
  - if mismatch or runtime error/compile error: return `failed` immediately with `firstFailure`
- If all pass: return `passed`

**Why sequential now**
- Minimizes load on Judge0 and returns first failure deterministically.
- Easy to scale horizontally at the request level.
- Parallelization can come later as an optimization (with “first failure index” selection).

### 4) Output comparison rules
Implement comparator driven by **question settings** (stored in Convex; see plan 3). For the raw `/v1/judge` endpoint (no question), use service defaults.

Recommended fields:
- `trimOutputs` (default true): `stdout.trimEnd()` and `expected.trimEnd()`
- `normalizeWhitespace` (default true): collapse runs of spaces/tabs into single spaces per line; keep it simple initially
- `caseSensitive` (default true)

Edge cases:
- If program prints extra trailing newlines, `trimEnd()` should treat it as okay.
- Compare line-by-line after normalization (or compare whole normalized strings).

### 5) Status handling
Map Judge0 results to your response:
- Compile error (`compile_output` non-empty or `status.id` in compile-error range) -> `failed` with compile output
- Runtime error/time limit -> `failed` and include stderr/status
- If Judge0 returns system error/unavailable -> `error` (`502`)

### 6) Observability hooks (minimal)
- Add request logging with:
  - request id (generate UUID if not provided)
  - total testcases
  - first failure index (if any)
  - duration
- Don’t log full source code; log lengths/hashes only.

---

## Verification checklist (stage 2)

### Setup
- Start Judge0 compose:
  - `docker compose -f docker-compose.code-exec.yml up -d`
- Start service:
  - `pnpm --filter code-execution dev`

### Manual API tests
1) **Happy path** (e.g. JS prints correct output):
- 2 testcases, both pass -> `status=passed`, `passedCount=2`

2) **Wrong answer**:
- 2 testcases; first passes, second fails -> `status=failed`, `firstFailure.index=1`

3) **Compile error**:
- Provide code with syntax error -> `status=failed`, `compileOutput` present

4) **TLE / infinite loop**:
- Provide code with infinite loop, ensure you set strict time limit -> `status=failed` (timeout)

5) **Validation**:
- Missing fields -> `400`
- Too many testcases -> `400`

---

## API hardening (do now if small)
If it fits in one shot:
- Add CORS allowlist (for local dev: Vite origin).
- Add rate limiting (optional; even naive in-memory is okay for dev, but keep it easy to remove/replace later).

---

## Out of scope (explicitly not in this stage)
- Persisting submissions/results to Convex.
- UI changes in the main `app/`.
- Admin authoring flows for coding questions.


