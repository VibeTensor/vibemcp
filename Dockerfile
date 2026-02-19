# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./

# Create persistent config directory
RUN mkdir -p /root/.vibemcp && chmod 700 /root/.vibemcp

# Default: start MCP server on stdio
# Override with: docker run vibemcp auth google user@gmail.com
ENTRYPOINT ["node", "dist/cli.js"]
