#!/bin/bash
set -e

# ============================================
#  Astun — Remote Deploy Script
#  Usage: bash deploy.sh
# ============================================

SERVER="root@srv1100100.hstgr.cloud"
REMOTE_DIR="/home/web/astun"

echo ""
echo "🚀 Deploying Astun System to ${SERVER}..."
echo "============================================"

# Ensure code is pushed first
git add .
git commit -m "Deploying Astun System" || true
git push origin main || true

ssh "$SERVER" bash -s <<'EOF'
set -e
mkdir -p /home/web/astun
cd /home/web/astun

echo ""
echo "📥 Pulling latest code..."
if [ -d ".git" ]; then
    git pull origin main
else
    git clone https://github.com/mizae1234/astun.git .
fi

echo ""
echo "🐳 Rebuilding Docker image..."
docker compose down || true
docker compose build --no-cache
docker compose up -d

echo ""
echo "⏳ Waiting for container..."
sleep 5

if docker ps --filter "name=astun-app" --filter "status=running" -q | grep -q .; then
    echo ""
    echo "✅ Deploy successful!"
    docker logs --tail 5 astun-app
else
    echo ""
    echo "❌ Container failed!"
    docker logs --tail 20 astun-app
    exit 1
fi
EOF

echo ""
echo "🎉 Astun deployed successfully! Access it internally on port 3004 or externally via http://astun.popcorn-creator.com/"
echo ""
