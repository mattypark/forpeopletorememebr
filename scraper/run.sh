#!/usr/bin/env bash
# Bery scraper sidecar — run next to `npm run dev`.
# First run: ./run.sh setup   (creates venv, installs Scrapling + browser deps)
# Then:      ./run.sh         (starts the service on :8787)
set -euo pipefail
cd "$(dirname "$0")"

if [[ "${1:-}" == "setup" ]]; then
  uv venv --python 3.12 .venv
  uv pip install --python .venv/bin/python -r requirements.txt
  # Stealth browser (Camoufox) for authwalled pages like LinkedIn. Optional but recommended.
  .venv/bin/scrapling install || echo "browser install skipped — stealth mode off, plain fetch still works"
  echo "setup done"
  exit 0
fi

exec .venv/bin/uvicorn main:app --host 127.0.0.1 --port "${PORT:-8787}"
