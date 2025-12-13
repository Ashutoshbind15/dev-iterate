#!/usr/bin/env bash
set -euo pipefail

VERSION="${JUDGE0_VERSION:-v1.13.1}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST_DIR="${ROOT_DIR}/.judge0"
ZIP_NAME="judge0-${VERSION}.zip"
URL="https://github.com/judge0/judge0/releases/download/${VERSION}/${ZIP_NAME}"

mkdir -p "${DEST_DIR}"

echo "[judge0-bootstrap] Downloading ${URL}"
tmp_zip="$(mktemp)"
curl -fsSL "${URL}" -o "${tmp_zip}"

echo "[judge0-bootstrap] Extracting into ${DEST_DIR}"
unzip -q -o "${tmp_zip}" -d "${DEST_DIR}"
rm -f "${tmp_zip}"

FOLDER="${DEST_DIR}/judge0-${VERSION}"
CONF="${FOLDER}/judge0.conf"

if [[ ! -f "${CONF}" ]]; then
  echo "[judge0-bootstrap] ERROR: expected ${CONF} to exist after unzip"
  exit 1
fi

gen_pw() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex 24
  else
    head -c 32 /dev/urandom | base64 | tr -d '\n' | tr '+/' 'Aa' | cut -c1-32
  fi
}

REDIS_PW="$(gen_pw)"
PG_PW="$(gen_pw)"

echo "[judge0-bootstrap] Writing passwords into ${CONF}"
if command -v perl >/dev/null 2>&1; then
  perl -pi -e "s/^REDIS_PASSWORD=.*/REDIS_PASSWORD=${REDIS_PW}/" "${CONF}"
  perl -pi -e "s/^POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=${PG_PW}/" "${CONF}"
else
  # Busybox-compatible fallback (rewrite file).
  tmp_conf="$(mktemp)"
  while IFS= read -r line; do
    case "${line}" in
      REDIS_PASSWORD=*) echo "REDIS_PASSWORD=${REDIS_PW}" >> "${tmp_conf}" ;;
      POSTGRES_PASSWORD=*) echo "POSTGRES_PASSWORD=${PG_PW}" >> "${tmp_conf}" ;;
      *) echo "${line}" >> "${tmp_conf}" ;;
    esac
  done < "${CONF}"
  mv "${tmp_conf}" "${CONF}"
fi

echo "[judge0-bootstrap] Done."
echo "[judge0-bootstrap] Next: docker compose -f ${ROOT_DIR}/../docker-compose.code-exec.yml up -d"


