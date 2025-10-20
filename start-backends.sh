#!/usr/bin/env bash
set -euo pipefail

# Minimal start script for this workspace.
# - starts the Node backend in the foreground (dev mode)
# - starts the Python backend in the background

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
echo "Starting backends from $ROOT_DIR"

cd "$ROOT_DIR/backend"
echo "Starting node backend (dev) in foreground..."
npm run dev &
NODE_PID=$!

if [ -d "$ROOT_DIR/python_backend" ]; then
  echo "Starting python backend in background..."
  (cd "$ROOT_DIR/python_backend" && python3 app.py &) 
  PY_PID=$!
else
  echo "No python_backend directory found, skipping python backend." >&2
fi

echo "Node backend PID: $NODE_PID"
if [ -n "${PY_PID-}" ]; then
  echo "Python backend PID: $PY_PID"
fi

wait $NODE_PID
