#!/usr/bin/env bash
set -euo pipefail

# start-backends.sh
# Minimal script to start the python and node backends from the repo root.
# - creates a venv in python_backend/.venv if missing
# - installs python dependencies (from requirements.txt if present)
# - downloads required NLTK data
# - starts python backend and node backend in background and tails their logs

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$ROOT_DIR/logs"
mkdir -p "$LOG_DIR"

echo "Root: $ROOT_DIR"

# -- Python backend
PY_DIR="$ROOT_DIR/python_backend"
if [ -d "$PY_DIR" ]; then
  echo "Preparing Python backend..."
  if [ ! -d "$PY_DIR/.venv" ]; then
    echo "Creating virtualenv in $PY_DIR/.venv"
    python3 -m venv "$PY_DIR/.venv"
  fi
  # Activate venv for installs only
  # shellcheck disable=SC1090
  source "$PY_DIR/.venv/bin/activate"
  pip install --upgrade pip >/dev/null
  if [ -f "$PY_DIR/requirements.txt" ]; then
    echo "Installing python requirements from requirements.txt"
    pip install -r "$PY_DIR/requirements.txt"
  else
    echo "requirements.txt not found; installing minimal runtime packages"
    pip install flask flask-cors numpy pandas scikit-learn nltk
  fi

  echo "Ensuring NLTK data (punkt, stopwords) are available"
  python - <<'PYDL'
import nltk
for pkg,where in (('punkt','tokenizers'),('stopwords','corpora')):
    try:
        nltk.data.find(f"{where}/{pkg}")
    except LookupError:
        print(f"Downloading NLTK: {pkg}")
        nltk.download(pkg)
PYDL

  echo "Starting Python backend (logs -> $LOG_DIR/python_backend.log)"
  (cd "$PY_DIR" && "$PY_DIR/.venv/bin/python" app.py) >"$LOG_DIR/python_backend.log" 2>&1 &
  PY_PID=$!
  echo "Python backend PID: $PY_PID"
else
  echo "No python_backend directory found; skipping Python backend"
fi

# -- Node backend
NODE_DIR="$ROOT_DIR/backend"
if [ -d "$NODE_DIR" ]; then
  echo "Preparing Node backend..."
  echo "Running npm install (logs -> $LOG_DIR/node_install.log)"
  (cd "$NODE_DIR" && npm install) >"$LOG_DIR/node_install.log" 2>&1 || echo "npm install returned non-zero; see $LOG_DIR/node_install.log"

  echo "Starting Node backend (logs -> $LOG_DIR/node_backend.log)"
  (cd "$NODE_DIR" && npm run dev) >"$LOG_DIR/node_backend.log" 2>&1 &
  NODE_PID=$!
  echo "Node backend PID: $NODE_PID"
else
  echo "No backend directory found; skipping Node backend"
fi

echo "Started backends. Tailing logs (Ctrl-C to exit):"
sleep 0.5
touch "$LOG_DIR/python_backend.log" "$LOG_DIR/node_backend.log"
tail -n +1 -f "$LOG_DIR/python_backend.log" "$LOG_DIR/node_backend.log"
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
