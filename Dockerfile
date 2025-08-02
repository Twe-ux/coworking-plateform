# Multi-stage build for production optimization
FROM node:18-alpine AS base

# Install pnpm
RUN npm install -g pnpm@8.15.0

# Setup working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/ ./apps/
COPY packages/ ./packages/
COPY tools/ ./tools/
COPY turbo.json ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build stage
FROM base AS builder
RUN pnpm build

# Runtime stage for web app
FROM base AS web
EXPOSE 3000
CMD ["pnpm", "--filter", "@coworking/web", "start"]

# Runtime stage for dashboard
FROM base AS dashboard  
EXPOSE 3001
CMD ["pnpm", "--filter", "@coworking/dashboard", "start"]

# Runtime stage for admin
FROM base AS admin
EXPOSE 3002
CMD ["pnpm", "--filter", "@coworking/admin", "start"]

# Runtime stage for API
FROM base AS api
EXPOSE 3003
CMD ["pnpm", "--filter", "@coworking/api", "start"]

# Development stage
FROM base AS development
EXPOSE 3000 3001 3002 3003
CMD ["pnpm", "dev"]