# Use Node.js LTS version as the base image
FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# Copy package.json and package-lock.json first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Bundle app source
COPY . .

# Expose the port the app runs on
EXPOSE ${PORT:-3000}

# Define environment variables default values
ENV PORT=3000 \
    RATE_LIMIT_WINDOW_MS=900000 \
    RATE_LIMIT_MAX=100 \
    AXIOS_TIMEOUT=10000

# Command to run the application
CMD ["node", "index.js"] 