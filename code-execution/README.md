# code-execution (stage 1)

Minimal, standalone Node/Express service that will later integrate with Judge0 for "run code against testcases".

## Endpoints

- `GET /healthz` → `200 { ok: true }`
- `GET /readyz` → `200` only when Judge0 is reachable (probes `GET ${JUDGE0_BASE_URL}/languages`)
- `POST /v1/judge` → **stage 1 stub** (validates request contract; returns `501 Not Implemented`)

## Config

Copy `env.example` to `.env` and edit as needed:

- `PORT` (default `4001`)
- `JUDGE0_BASE_URL` (default `http://localhost:2358`)
- `JUDGE0_API_KEY` (optional; local Judge0 CE typically doesn't require this)
- `REQUEST_TIMEOUT_MS` (default `15000`)
- `MAX_TESTCASES` (default `50`)
- `MAX_SOURCE_BYTES` (default `200000`)

## Local dev

From repo root:

- `pnpm -w install`
- `pnpm --filter code-execution dev`

## Judge0 local stack

Bootstrap (downloads Judge0 CE release archive and writes passwords into `judge0.conf`):

- `bash code-execution/scripts/judge0-bootstrap.sh`

Start services (preferred if your Docker Compose supports `include:`):

- `docker compose -f docker-compose.code-exec.yml up -d`

Fallback start (works everywhere; runs compose inside the extracted folder and follows `judgezero.md` timings):

- `bash code-execution/scripts/judge0-up.sh`

## Verification (stage 1)

- `curl -s localhost:4001/healthz`
- `curl -s localhost:4001/readyz` (returns `503` until Judge0 is reachable)
- `curl -s -X POST localhost:4001/v1/judge -H 'content-type: application/json' -d '{}'` (returns `400`)

## OS / cgroup note

`judgezero.md` calls out Ubuntu 22.04 needing `systemd.unified_cgroup_hierarchy=0`. If you hit cgroup-related issues on Arch, you may need to switch cgroup mode similarly for Docker.


