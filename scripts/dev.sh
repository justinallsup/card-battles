#!/bin/bash
# Card Battles — dev startup script
# Usage: ./scripts/dev.sh
# Starts the combo server (demo API, no Docker needed) and Next.js web app.

set -e

echo "🚀 Starting Card Battles dev environment..."

# ─── Node version check ───────────────────────────────────────────────────────
NODE_VER=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VER" -lt 18 ]; then
  echo "❌ Node 18+ required (found v${NODE_VER})"
  exit 1
fi
echo "✓ Node v$(node -v) OK"

# ─── pnpm check ───────────────────────────────────────────────────────────────
if ! command -v pnpm &>/dev/null; then
  echo "❌ pnpm not found. Install it: npm i -g pnpm"
  exit 1
fi

# ─── Install deps if needed ───────────────────────────────────────────────────
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  pnpm install
fi

# ─── Start combo server (demo mode, no Docker needed) ─────────────────────────
echo ""
echo "⚡ Starting demo API server on port 3333..."
cd apps/api
PORT=3333 npx tsx src/combo-server.ts &
API_PID=$!
cd ../..

# Wait for API to be ready (up to 30s)
echo "   Waiting for API..."
for i in $(seq 1 15); do
  if curl -sf http://localhost:3333/health > /dev/null 2>&1; then
    break
  fi
  sleep 2
done

if ! curl -sf http://localhost:3333/health > /dev/null 2>&1; then
  echo "❌ API failed to start after 30s"
  kill $API_PID 2>/dev/null
  exit 1
fi
echo "✅ API running at http://localhost:3333"

# ─── Start Next.js ────────────────────────────────────────────────────────────
echo ""
echo "🌐 Starting web app on port 3000..."
cd apps/web
NEXT_PUBLIC_API_URL=http://localhost:3333 npx next dev --port 3000 &
WEB_PID=$!
cd ../..

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Card Battles dev environment running!"
echo ""
echo "   🌐 Web:     http://localhost:3000"
echo "   🔌 API:     http://localhost:3333/api/v1"
echo "   ❤️  Health:  http://localhost:3333/health"
echo ""
echo "   Demo login: cardking@demo.com / password123"
echo ""
echo "   Press Ctrl+C to stop all servers"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Cleanup on exit
cleanup() {
  echo ""
  echo "🛑 Stopping servers..."
  kill $API_PID 2>/dev/null || true
  kill $WEB_PID 2>/dev/null || true
  echo "Stopped."
}
trap cleanup EXIT INT TERM

wait
