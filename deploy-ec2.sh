#!/bin/bash

# EC2 Deployment Script for CIMS AWS Application
# Run this script on your EC2 instance after cloning the repository

set -e

echo "🚀 Starting CIMS AWS Deployment on EC2..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${YELLOW}⚠️  Please run as root or with sudo${NC}"
    exit 1
fi

echo -e "${GREEN}📦 Step 1: Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
    # Update package list
    apt-get update -y
    
    # Install dependencies
    apt-get install -y \
        ca-certificates \
        curl \
        gnupg \
        lsb-release
    
    # Add Docker's official GPG key
    mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    
    # Set up Docker repository
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker Engine
    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    echo -e "${GREEN}✅ Docker installed successfully${NC}"
else
    echo -e "${GREEN}✅ Docker already installed${NC}"
fi

echo -e "${GREEN}📦 Step 2: Installing Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}✅ Docker Compose installed successfully${NC}"
else
    echo -e "${GREEN}✅ Docker Compose already installed${NC}"
fi

# Start Docker service
systemctl start docker
systemctl enable docker

echo -e "${GREEN}🔧 Step 3: Setting up environment variables...${NC}"
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Please create it with required variables.${NC}"
    cat << 'EOF' > .env.example
PORT=3000
DB_HOST=your-rds-endpoint.rds.amazonaws.com
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=your-database-name
AI_API_URL=https://api.example.com/ai/analyze
AI_API_KEY=your-ai-api-key
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SESSION_SECRET=your-session-secret
CRON_SECRET_TOKEN=your-cron-token
SES_SENDER_EMAIL=notifications@example.com
AWS_REGION=us-east-1
EOF
    echo -e "${YELLOW}📝 Created .env.example - Please rename it to .env and fill in your values${NC}"
    echo -e "${YELLOW}Then run this script again.${NC}"
    exit 1
else
    echo -e "${GREEN}✅ .env file found${NC}"
fi

echo -e "${GREEN}🏗️  Step 4: Building Docker image...${NC}"
docker-compose build

echo -e "${GREEN}🚀 Step 5: Starting application...${NC}"
docker-compose up -d

echo -e "${GREEN}⏳ Waiting for application to start...${NC}"
sleep 10

echo -e "${GREEN}🔍 Step 6: Checking application health...${NC}"
if curl -s http://localhost:3000/health > /dev/null; then
    echo -e "${GREEN}✅ Application is running successfully!${NC}"
    echo ""
    echo -e "${GREEN}📊 Container status:${NC}"
    docker-compose ps
    echo ""
    echo -e "${GREEN}🌐 Application URLs:${NC}"
    echo "   Local: http://localhost:3000"
    echo "   Public: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):3000"
    echo ""
    echo -e "${GREEN}📝 View logs:${NC}"
    echo "   docker-compose logs -f"
    echo ""
    echo -e "${GREEN}🛑 Stop application:${NC}"
    echo "   docker-compose down"
else
    echo -e "${YELLOW}⚠️  Application health check failed. Check logs:${NC}"
    docker-compose logs
    exit 1
fi

echo -e "${GREEN}🎉 Deployment complete!${NC}"
