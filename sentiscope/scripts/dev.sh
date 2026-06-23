#!/usr/bin/env bash
#
# dev.sh — start all three SentiScope services for local development.
#
# Starts:
#   1. Python ML service  (FastAPI, port 8000)
#   2. Node backend       (Express,  port 5050)
#   3. React frontend     (Vite,     port 5173)
#
# Press Ctrl+C to stop all of them.

set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cleanup() {
  echo "\nShutting down..."
  kill 0
}
trap cleanup EXIT INT TERM

echo "Starting ML service on :8000 ..."
(
  cd "$ROOT/ml-service"
  source venv/bin/activate
  uvicorn app:app --port 8000
) &

echo "Starting backend on :5050 ..."
(
  cd "$ROOT/backend"
  npm start
) &

echo "Starting frontend on :5173 ..."
(
  cd "$ROOT/frontend"
  npm run dev
) &

wait
