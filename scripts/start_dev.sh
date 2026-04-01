#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
echo "Starting TripGuard dev in: $ROOT_DIR"

if ! command -v node >/dev/null 2>&1; then
  echo "Error: Node is not installed in this environment." >&2
  exit 1
fi
if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm is not installed in this environment." >&2
  exit 1
fi

echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

MAJOR=$(node -v | sed s/v//
