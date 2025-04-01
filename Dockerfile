# Use Node.js LTS version as the base image
FROM --platform=$TARGETPLATFORM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package files for better caching
COPY package*.json ./

# Install dependencies and create non-root user
RUN npm ci --omit=dev && \
    # Clean npm cache to reduce image size
    npm cache clean --force && \
    # Add user and group if not already created by Node image
    adduser -D -h /home/node node || true && \
    # Create necessary directories
    mkdir -p /usr/src/app/utils && \
    mkdir -p /usr/src/app/middleware && \
    mkdir -p /usr/src/app/logs && \
    # Set ownership of app directory to node user
    chown -R node:node /usr/src/app

# Copy only necessary files
COPY index.js ./
COPY config/ ./config/
COPY routes/ ./routes/
COPY middleware/ ./middleware/
COPY utils/ ./utils/

# Switch to non-root user
USER node

# Expose the port the app runs on
EXPOSE ${PORT:-3000}

# Define environment variables default values
ENV PORT=3000 \
    RATE_LIMIT_WINDOW_MS=900000 \
    RATE_LIMIT_MAX=100 \
    AXIOS_TIMEOUT=10000 \
    NODE_ENV=production

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD wget -q --spider http://localhost:${PORT:-3000}/ || exit 1

# Command to run the application
CMD ["node", "index.js"] 