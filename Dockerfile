# Multi-stage build for production optimization
FROM node:22.17-alpine AS base

# Install security updates and dumb-init for proper signal handling
RUN apk update && apk upgrade && \
    apk add --no-cache dumb-init && \
    rm -rf /var/cache/apk/*

# Create non-root user early
RUN addgroup -g 1001 -S nodejs && \
    adduser -S botuser -u 1001 -G nodejs

# Set working directory
WORKDIR /app

# Change ownership of the app directory
RUN chown -R botuser:nodejs /app

#########################################
# Dependencies stage
#########################################
FROM base AS deps

# Copy package files
COPY --chown=botuser:nodejs package*.json ./

# Install all dependencies (including dev for build)
USER botuser
RUN npm ci --include=dev && npm cache clean --force

#########################################
# Build stage
#########################################
FROM base AS builder

# Copy dependencies from deps stage
COPY --from=deps --chown=botuser:nodejs /app/node_modules ./node_modules
COPY --chown=botuser:nodejs package*.json ./

# Copy source code
COPY --chown=botuser:nodejs . .

# Build the application
USER botuser
RUN npm run build

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

#########################################
# Production stage
#########################################
FROM base AS production

# Set production environment
ENV NODE_ENV=production
ENV NPM_CONFIG_LOGLEVEL=warn

# Copy production dependencies and built application
COPY --from=builder --chown=botuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=botuser:nodejs /app/build ./build
COPY --from=builder --chown=botuser:nodejs /app/package*.json ./

# Switch to non-root user
USER botuser

# Expose port (if needed for health checks)
EXPOSE 3000

# Health check with more robust validation
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('./build/config.js'); console.log('Health check passed')" || exit 1

# Use dumb-init for proper signal handling and direct node execution for better performance
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "build/index.js"]
