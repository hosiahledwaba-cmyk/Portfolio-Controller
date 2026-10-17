# syntax=docker/dockerfile:1
FROM node:22-alpine

WORKDIR /app

# Install curl for healthcheck probe
RUN apk add --no-cache curl

# Copy package metadata
COPY package.json ./

# Copy application files (api routes, lib utilities, openapi spec, dev server)
COPY . .

# Environment configuration
ENV NODE_ENV=development \
    PORT=4000 \
    ADMIN_SECRET=admin123

# Expose API and Swagger UI endpoint
EXPOSE 4000

# Healthcheck probe verifying API response
HEALTHCHECK --interval=20s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4000/api/health || exit 1

# Start the API and Swagger documentation server
CMD ["node", "dev-server.mjs"]
