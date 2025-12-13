# Plan 6 — Production readiness: security, scaling, and k8s/ecs-friendly deployment shape

## Goal
Make the system safe and deployable at scale (ASG/ECS/K8s), while keeping the codebase structure stable:

- Harden the code-exec service against abuse.
- Make scaling and observability straightforward.
- Define how the local Judge0 compose maps to k8s pods later.

---

## Deliverables

### 1) Security & abuse protection
In `code-execution`:
- **Request caps**:
  - max source bytes
  - max testcases
  - max stdin bytes per testcase
  - max total runtime per request
- **Rate limit**:
  - For local dev: in-memory limiter is fine.
  - For production: plan to swap to Redis-backed limiter.
- **Auth**:
  - Require an HMAC/API key between app and code-exec (`X-Code-Exec-Key`) so random internet traffic can’t burn Judge0.
  - If running inside cluster only: keep service internal and enforce network policies.
- **Redaction**:
  - Don’t log raw source code or full stdin; log sizes + request ids.

### 2) Reliability
- Add:
  - structured JSON logs
  - `GET /metrics` (optional; Prometheus)
  - better readiness: verify Judge0 + Convex connectivity
- Add circuit breaker-ish behavior:
  - If Judge0 is unhealthy, fail fast with `502`.

### 3) Concurrency control
To avoid overloading Judge0 from a single code-exec instance:
- Implement per-instance concurrency limit (e.g. p-limit).
- Keep sequential-per-request evaluation (plan 2) but allow N concurrent requests per instance.

### 4) Deployment shape (k8s/ECS)
Define components:
- **code-exec**: stateless deployment, horizontal autoscale on CPU/RPS
- **judge0-server + judge0-workers + redis + postgres**: separate deployments/statefulsets
- Put Judge0 behind a cluster-internal service; code-exec calls it.

K8s mapping:
- `judge0-postgres`: StatefulSet + PVC
- `judge0-redis`: Deployment (or managed)
- `judge0-server`: Deployment
- `judge0-workers`: Deployment scaled independently
- `code-exec`: Deployment + HPA

### 5) CI/verification
- Add a small integration test script (node) that:
  - checks `/readyz`
  - runs a known “Hello world” against 2 testcases
  - asserts correct `passed/failed` responses

---

## Verification checklist (stage 6)
1) Run load sanity:
- fire 20 requests with small testcases; ensure service stays responsive and doesn’t overload Judge0.
2) Confirm rate limit returns 429.
3) Confirm missing API key returns 401 (if enabled).


