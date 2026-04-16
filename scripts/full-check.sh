#!/bin/bash
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

SECONDS=0

echo "=== FULL CHECK ==="

echo "-> 1/8 Merge conflict markers..."
# Build pattern dynamically to avoid self-matching
MARKER_L=$(printf '<%.0s' 1 2 3 4 5 6 7)
MARKER_R=$(printf '>%.0s' 1 2 3 4 5 6 7)
if grep -rn "$MARKER_L \|$MARKER_R " --include="*.py" --include="*.ts" \
  --include="*.tsx" --include="*.json" . 2>/dev/null | grep -v node_modules | grep -v ".git/"; then
  echo "FAIL: Unresolved merge conflicts found"
  exit 1
fi
echo "   OK"

echo "-> 2/8 Python syntax..."
find backend -name "*.py" -not -path "*/.venv/*" \
  -not -path "*/__pycache__/*" -exec python3 -m py_compile {} \;
echo "   OK"

echo "-> 3/8 Backend imports..."
cd backend && uv run python -c "from kendraw_api.main import app" && cd ..
echo "   OK"

echo "-> 4/8 Frontend lint..."
pnpm lint
echo "   OK"

echo "-> 5/8 Frontend typecheck..."
pnpm typecheck
echo "   OK"

echo "-> 6/8 Frontend tests..."
pnpm test
echo "   OK"

echo "-> 7/8 Backend tests..."
cd backend && uv run pytest -v && cd ..
echo "   OK"

echo "-> 8/8 Playwright E2E..."
pnpm test:e2e
echo "   OK"

echo ""
echo "=== ALL CHECKS PASSED in ${SECONDS}s ==="
