# Plan 1 — Foundations: interfaces, repo structure, and local Judge0 compose

## Goal

Create the minimum project skeleton to support a scalable “code execution + judging” workflow without implementing the full feature yet:

- A new workspace package: `code-execution/` (Express server, runs locally on host; not containerized yet).
- A separate, self-contained way to run **Judge0 CE self-hosting locally** (based on the release archive + docker-compose approach).
- A stable, versioned API contract for “run code against testcases and return pass/fail + first failing testcase”.

This stage should be safe to land without breaking the app.

---

## Deliverables

### 1) New workspace package: `code-execution/`

- Add `code-execution/package.json` with:
  - `name`: `code-execution`
  - `type`: `module` (match repo patterns if used elsewhere)
  - scripts:
    - `dev`: start express with ts-node/tsx/nodemon (pick one; `tsx` is usually simplest)
    - `build`: `tsc -p tsconfig.json`
    - `start`: run built output
- Add `code-execution/tsconfig.json` for a standalone TypeScript node service.
- Add a minimal Express app with:
  - `GET /healthz` -> `200 { ok: true }`
  - `GET /readyz` -> checks connectivity to Judge0 base URL (`JUDGE0_BASE_URL`) with short timeout
  - `POST /v1/judge` -> _stubbed_ handler returning `501` with “not implemented” (contract defined below)
- Add `.env.example` for the service.

### 2) Separate docker-compose for local execution stack

- Add `docker-compose.code-exec.yml` at repo root (or `code-execution/docker-compose.yml`—choose one; root is easier).
- It must bring up a **local Judge0 instance** accessible from host at a known URL, e.g. `http://localhost:2358`.
- The compose should be explicitly separate so the main app compose stays untouched.

**Important**

- The local hosting of judge0 does **not** tell you to pull a single "Judge0 CE" docker image directly.
- Instead, it directs you to download a **release archive** (e.g. `judge0-v1.13.1.zip`) that contains:
  - a `docker-compose.yml`
  - a `judge0.conf` where you set `REDIS_PASSWORD` and `POSTGRES_PASSWORD`
  - the full multi-service stack (`db`, `redis`, API, workers)

**Plan approach**

- Add a small helper script (e.g. `code-execution/scripts/judge0-bootstrap.sh`) that:
  - downloads the Judge0 release zip pinned to a version (start with `v1.13.1`)
  - extracts it into a local ignored folder (e.g. `code-execution/.judge0/judge0-v1.13.1/`)
  - writes strong random values into `judge0.conf` for `REDIS_PASSWORD` and `POSTGRES_PASSWORD`
- Make `docker-compose.code-exec.yml` a thin wrapper that uses that extracted compose (or instructs developers to `cd` into the extracted folder and run compose there).

**OS note**

- The local hosting of judge0 may require a cgroup setting for Ubuntu 22.04 (`systemd.unified_cgroup_hierarchy=0`). On Arch, if you hit cgroup-related issues, document the required cgroup mode in the repo README for this stack.

### 3) API contract (versioned)

Define request/response JSON for the abstracted endpoint. Keep it simple and scalable.

#### Endpoint

`POST /v1/judge`

#### Request body

- `languageId` (number): Judge0 language id
- `sourceCode` (string): user code
- `testCases` (array): each testcase includes:
  - `stdin` (string)
  - `expectedStdout` (string)
  - `name` (string, optional) for UX
- `limits` (object, optional):
  - `cpuTimeSeconds` (number)
  - `memoryMb` (number)
  - `wallTimeSeconds` (number)

**No request-time `options`**

- Output comparison rules (trim/whitespace/case sensitivity) should be configured on the **coding question** (see plan 3), not passed per-run.

#### Response body

- `status`: `"passed" | "failed" | "error"`
- `summary`:
  - `passedCount` (number)
  - `totalCount` (number)
  - `durationMs` (number)
- If `failed`:
  - `firstFailure`:
    - `index` (number)
    - `testCase` (echo `stdin`, `expectedStdout`, `name`)
    - `actualStdout` (string)
    - `stderr` (string | null)
    - `compileOutput` (string | null)
    - `judge0` (object): raw status + exit code signals (subset)
- If `error`:
  - `message` (string)
  - `details` (object, optional)

#### HTTP statuses

- `200` for `"passed"` and `"failed"`
- `400` invalid request
- `502` judge0 unavailable/timeouts
- `500` internal error

---

## Scalability constraints (baked in now)

Even in stage 1, choose patterns that scale later:

- Stateless Express service; no sticky sessions required.
- All config via env vars.
- Per-request idempotency: optional `requestId` header supported later.
- No local filesystem dependencies for user code.

---

## Configuration (stage 1)

In `code-execution/.env.example`:

- `PORT=4001`
- `JUDGE0_BASE_URL=http://localhost:2358`
- `JUDGE0_API_KEY=` (optional; depends on Judge0 deployment)
- `REQUEST_TIMEOUT_MS=15000`
- `MAX_TESTCASES=50`
- `MAX_SOURCE_BYTES=200000`

---

## Verification checklist (stage 1)

These checks should pass locally.

1. Install deps:

- `pnpm -w install`

2. Start Judge0 stack:

- `docker compose -f docker-compose.code-exec.yml up -d`

3. Start service:

- `pnpm --filter code-execution dev`

4. Verify health/ready:

- `curl -s localhost:4001/healthz`
- `curl -s localhost:4001/readyz` (should succeed only when Judge0 is reachable)

5. Verify contract stub:

- `curl -s -X POST localhost:4001/v1/judge -H 'content-type: application/json' -d '{}'`
  - returns `400` (once validation added) or `501` (stub) depending on what you implement in plan 2

---

## Out of scope (explicitly not in this stage)

- Real Judge0 submissions / polling.
- Convex schema changes.
- UI changes (Monaco, authoring).
- Storing submissions/results.
