# Use Node.js LTS version as the base image
FROM --platform=$TARGETPLATFORM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package files for better caching
COPY package*.json ./

# Install dependencies
RUN npm install --production && \
    # Clean npm cache to reduce image size
    npm cache clean --force

# Bundle app source
COPY . .

# Expose the port the app runs on
EXPOSE ${PORT:-3000}

# Define environment variables default values
ENV PORT=3000 \
    RATE_LIMIT_WINDOW_MS=900000 \
    RATE_LIMIT_MAX=100 \
    AXIOS_TIMEOUT=10000

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD wget --spider -q http://localhost:${PORT:-3000}/api/docs || exit 1

# Command to run the application
CMD ["node", "index.js"] 