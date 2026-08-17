# Build Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/client

COPY client/package*.json ./
RUN npm install

COPY client/ ./
RUN npm run build

# Build Stage 2: Production Server
FROM node:20-alpine
WORKDIR /app

# Install native dependencies for better-sqlite3 build if needed
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install --omit=dev

COPY server/ ./server/
COPY --from=frontend-builder /app/client/dist ./client/dist

# Setup persistent volume for SQLite
RUN mkdir -p /app/data
ENV PORT=3000
EXPOSE 3000

VOLUME ["/app/data"]

CMD ["node", "server/server.js"]
