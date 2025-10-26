# Multi-stage Dockerfile for Paparazzi Next-Gen
FROM node:18-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    git \
    cmake \
    make \
    gcc \
    g++ \
    python3 \
    py3-pip \
    linux-headers \
    udev

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Development stage
FROM base AS development

# Install all dependencies (including dev)
RUN npm ci

# Copy source code
COPY src/ ./src/
COPY examples/ ./examples/
COPY scripts/ ./scripts/

# Expose ports for services
EXPOSE 3000 8080 1883 9001

# Default command for development
CMD ["npm", "run", "dev"]

# Production build stage
FROM base AS builder

# Install dependencies
RUN npm ci --only=production

# Copy source and build
COPY src/ ./src/
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install runtime dependencies only
RUN apk add --no-cache \
    dumb-init

WORKDIR /app

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S paparazzi -u 1001

USER paparazzi

EXPOSE 3000 8080

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]