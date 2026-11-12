# ==========================================
# Multi-stage Dockerfile for Node.js Backend
# ==========================================

# 1. Dependency stage
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# 2. Builder stage
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# 3. Production Runner stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8081

# Only install production dependencies
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Copy compiled TypeScript dist
COPY --from=builder /app/dist ./dist

EXPOSE 8081

CMD ["node", "dist/server.js"]
