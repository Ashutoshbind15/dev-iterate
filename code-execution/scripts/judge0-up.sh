#!/usr/bin/env bash
set -euo pipefail

VERSION="${JUDGE0_VERSION:-v1.13.1}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FOLDER="${ROOT_DIR}/.judge0/judge0-${VERSION}"

if [[ ! -d "${FOLDER}" ]]; then
  echo "[judge0-up] ${FOLDER} not found. Run scripts/judge0-bootstrap.sh first."
  exit 1
fi

cd "${FOLDER}"

echo "[judge0-up] Starting db + redis..."
docker compose up -d db redis
sleep 10
echo "[judge0-up] Starting remaining Judge0 services..."
docker compose up -d
sleep 5

echo "[judge0-up] Judge0 should be available at http://localhost:2358/docs"


