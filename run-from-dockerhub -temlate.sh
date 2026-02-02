#!/bin/bash

# CIMS AWS - Run Docker Image from Docker Hub
# This script pulls and runs the Docker image from Docker Hub

set -e

echo "════════════════════════════════════════════════════════════════"
echo "  🐳 CIMS AWS - Docker Hub Image Launcher"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Stop and remove old container if running
echo "🛑 Cleaning up old containers..."
docker stop cimsaws-app 2>/dev/null || true
docker rm cimsaws-app 2>/dev/null || true

echo ""
echo "📥 Pulling image from Docker Hub..."
echo "────────────────────────────────────────────────────────────────"
docker pull rahmanhusain/cimsaw_docker_image:latest

echo ""
echo "🚀 Starting Docker container..."
echo "────────────────────────────────────────────────────────────────"
echo ""

# Run the Docker container with all environment variables
docker run -d \
  --name cimsaws-app \
  -p 80:3000 \
  -e PORT=3000 \
  -e DB_HOST=YOUR_DB_HOST \
  -e DB_USER=YOUR_DB_USER \
  -e DB_PASSWORD=YOUR_DB_PASSWORD \
  -e DB_NAME=YOUR_DB_NAME \
  -e AI_API_URL=https://api.example.com/ai/analyze \
  -e AI_API_KEY=YOUR_AI_API_KEY \
  -e SMTP_USER=YOUR_SMTP_USER \
  -e SMTP_PASS=YOUR_SMTP_PASS \
  -e SESSION_SECRET=YOUR_SESSION_SECRET \
  -e CRON_SECRET_TOKEN=YOUR_CRON_SECRET_TOKEN \
  -e AWS_REGION=us-east-1 \
  --restart unless-stopped \
  rahmanhusain/cimsaw_docker_image:latest

echo ""
echo "⏳ Waiting for container to start..."
sleep 5

echo ""
echo "🔍 Checking container status..."
echo "────────────────────────────────────────────────────────────────"

# Check if container is running
if docker ps | grep -q cimsaws-app; then
    echo "✅ Container is running!"
    echo ""
    
    # Test health endpoint
    echo "🧪 Testing application health..."
    if curl -s http://localhost:3000/health | grep -q "ok"; then
        echo "✅ Application is healthy!"
    else
        echo "⚠️  Health check may still be initializing"
    fi
else
    echo "❌ Container failed to start"
    echo ""
    echo "📋 Showing logs:"
    docker logs cimsaws-app
    exit 1
fi

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "  🎉 DEPLOYMENT SUCCESSFUL!"
echo "════════════════════════════════════════════════════════════════"
echo ""

echo "📊 Container Information:"
docker ps | grep cimsaws-app || true

echo ""
echo "🌐 Access URLs:"
echo "   - Admin Panel:    http://localhost:3000/admin.html"
echo "   - Inquiry Form:   http://localhost:3000/index.html"
echo "   - Health Check:   http://localhost:3000/health"
echo ""

echo "📝 Useful Commands:"
echo "   - View logs:         docker logs -f cimsaws-app"
echo "   - Stop container:    docker stop cimsaws-app"
echo "   - Start container:   docker start cimsaws-app"
echo "   - Restart:           docker restart cimsaws-app"
echo "   - Remove:            docker rm -f cimsaws-app"
echo "   - Access shell:      docker exec -it cimsaws-app sh"
echo ""

echo "💡 Next Steps:"
echo "   1. Open browser: http://localhost:3000"
echo "   2. Try submitting an inquiry: http://localhost:3000/index.html"
echo "   3. Login to admin panel: http://localhost:3000/admin.html"
echo "      Default credentials: admin / admin123"
echo ""
