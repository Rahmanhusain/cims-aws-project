# Use official Node.js LTS image
FROM node:18-alpine

# Set working directory inside container
WORKDIR /app

# Copy package files first (better caching)
COPY package*.json ./

# Install dependencies
RUN npm install --only=production

# Copy rest of the application (excluding .dockerignore files)
COPY . .

# Expose application port
EXPOSE 3000

# Start the application
CMD ["node", "backend/server.js"]
