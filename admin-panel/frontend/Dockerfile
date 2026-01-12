# Build stage
FROM node:20-slim AS builder

# Force rebuild - Updated 2026-01-11
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Set environment variables for build
ENV VITE_API_URL=https://freshmarket-admin-backend-693944688614.us-central1.run.app/api

# Build the application
RUN npm run build && ls -lh dist/assets/

# Production stage
FROM nginx:alpine

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 8080 (Cloud Run default)
EXPOSE 8080

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
