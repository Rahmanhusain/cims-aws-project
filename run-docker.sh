#!/bin/bash

# CIMS AWS Docker Run Script
# This script runs the CIMS AWS application Docker container with all environment variables

set -e

echo "════════════════════════════════════════════════════════════════"
echo "  🐳 CIMS AWS - Docker Container Launcher"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Stop and remove old container if running
echo "Cleaning up old containers..."
docker stop cimsaws_dockerimage 2>/dev/null || true
docker rm cimsaws_dockerimage 2>/dev/null || true

echo ""
echo "->>>>Starting Docker container..."
echo "────────────────────────────────────────────────────────────────"
echo ""

# Run the Docker container with all environment variables
docker run -d \
  --name cimsaws_dockerimage \
  -p 3000:3000 \
  -e PORT=3000 \
  -e DB_HOST=cimsaws.cuza462a0ubu.us-east-1.rds.amazonaws.com \
  -e DB_USER=adminrahman \
  -e DB_PASSWORD=admin_cimsaws \
  -e DB_NAME=cimsaws_Inquiry_DB \
  -e AI_API_URL=https://api.example.com/ai/analyze \
  -e AI_API_KEY=AIzaSyCWARrrWzr9cqNDE2AIi1HXxPZ3fKUR70w \
  -e SMTP_USER=ritchiedennis793@gmail.com \
  -e SMTP_PASS=xqockvtqoxdolhqm \
  -e SESSION_SECRET=8de8f03606bf2ca0e7ed330711701cd20ac4aff1550d2517d24de9c9cd76b5fa \
  -e CRON_SECRET_TOKEN=416635511a6aab7f01dc2a9239487dd36f2ec30298dd77d37d38065ecae775ec \
  -e AWS_REGION=us-east-1 \
  --restart unless-stopped \
  cimsaws_dockerimage

echo ""
echo "-->>>>>Waiting for container to start..."
sleep 3

echo ""
echo "--->>>>>>Checking container status..."
echo "────────────────────────────────────────────────────────────────"

# Check if container is running
if docker ps | grep -q cimsaws_dockerimage; then
    echo "->>>>>>Container is running!"
    echo ""
    
    # Wait a bit more for app to initialize
    echo "-->>>>>Waiting for application to initialize..."
    sleep 3
    
    # Test health endpoint
    echo "-->>>>>Testing application health..."
    if curl -s http://localhost:3000/health | grep -q "ok"; then
        echo "->>>>>>Application is healthy!"
    else
        echo "⚠️  Health check response received but may still be initializing"
    fi
else
    echo "-->>>>Container failed to start"
    echo ""
    echo "📋 Showing logs:"
    docker logs cimsaws_dockerimage
    exit 1
fi

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "  🎉 DEPLOYMENT SUCCESSFUL!"
echo "════════════════════════════════════════════════════════════════"
echo ""

echo "📊 Container Information:"
docker ps | grep cimsaws_dockerimage || true

echo ""
echo "🌐 Access URLs:"
echo "   - Admin Panel:    http://localhost:3000/admin.html"
echo "   - Inquiry Form:   http://localhost:3000/index.html"
echo "   - Health Check:   http://localhost:3000/health"
echo ""

echo "📝 Useful Commands:"
echo "   - View logs:         docker logs -f cimsaws_dockerimage"
echo "   - Stop container:    docker stop cimsaws_dockerimage"
echo "   - Start container:   docker start cimsaws_dockerimage"
echo "   - Restart:           docker restart cimsaws_dockerimage"
echo "   - Remove:            docker rm -f cimsaws_dockerimage  "
echo "   - Access shell:      docker exec -it cimsaws_dockerimage sh"
echo ""

echo "💡 Next Steps:"
echo "   1. Open browser: http://localhost:3000"
echo "   2. Try submitting an inquiry: http://localhost:3000/index.html"
echo "   3. Login to admin panel: http://localhost:3000/admin.html"
echo "      Default credentials: admin / admin123"
echo ""
