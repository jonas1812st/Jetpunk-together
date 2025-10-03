# Build stage
FROM node:20 as builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm install

# Runtime stage
FROM node:20-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy application files
COPY . .

# Create database directory if it doesn't exist
RUN mkdir -p /app/database

# Expose the port the app runs on
EXPOSE 3000

# Start the application (this runs seed.js first, then server.js)
CMD ["npm", "start"]
