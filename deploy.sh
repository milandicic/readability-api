#!/bin/bash

# Readability API deployment script
set -e

# Configuration
ENV_FILE=.env
ENV_EXAMPLE=.env.example
DOCKER_COMPOSE_FILE=docker-compose.yml
PROD_COMPOSE_FILE=docker-compose.prod.yml

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Functions
function echo_info() {
  echo -e "${GREEN}INFO:${NC} $1"
}

function echo_warn() {
  echo -e "${YELLOW}WARNING:${NC} $1"
}

function echo_error() {
  echo -e "${RED}ERROR:${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
  echo_error "Docker is not installed. Please install Docker first."
  exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
  echo_error "Docker Compose is not installed. Please install Docker Compose first."
  exit 1
fi

# Check if .env file exists, if not create from example
if [ ! -f "$ENV_FILE" ]; then
  if [ -f "$ENV_EXAMPLE" ]; then
    echo_warn "No $ENV_FILE file found. Creating from $ENV_EXAMPLE"
    cp "$ENV_EXAMPLE" "$ENV_FILE"
    echo_info "Please update $ENV_FILE with your configuration"
    exit 1
  else
    echo_error "No $ENV_FILE or $ENV_EXAMPLE file found. Please create an $ENV_FILE file first."
    exit 1
  fi
fi

# Check for API_TOKEN in .env
if ! grep -q "^API_TOKEN=" "$ENV_FILE" || grep -q "^API_TOKEN=$" "$ENV_FILE"; then
  echo_error "API_TOKEN is not set in $ENV_FILE. Please set a secure token."
  exit 1
fi

# Ensure required directories exist
echo_info "Checking required directories..."
mkdir -p utils
mkdir -p middleware
mkdir -p tests/utils
mkdir -p logs

# Check if npm is installed for local dependency check
if command -v npm &> /dev/null; then
  echo_info "Checking project dependencies..."
  npm install --quiet
else
  echo_warn "npm not found locally. Skipping dependency check."
  echo_warn "Dependencies will be installed inside the container."
fi

# Determine environment
ENV=${1:-development}
COMPOSE_CMD="docker-compose -f $DOCKER_COMPOSE_FILE"

if [ "$ENV" == "production" ]; then
  COMPOSE_CMD="$COMPOSE_CMD -f $PROD_COMPOSE_FILE"
  echo_info "Deploying in PRODUCTION mode"
else
  echo_info "Deploying in DEVELOPMENT mode"
fi

# Build and deploy
echo_info "Building containers..."
$COMPOSE_CMD build

echo_info "Starting containers..."
$COMPOSE_CMD up -d

echo_info "Container status:"
$COMPOSE_CMD ps

echo_info "Logs (showing first few lines):"
$COMPOSE_CMD logs --tail 20

echo_info "Readability API started successfully!"
echo_info "Access the web interface at http://localhost:$(grep "^PORT=" "$ENV_FILE" | cut -d= -f2 || echo "3000")"

echo ""
echo_info "If you're seeing MODULE_NOT_FOUND errors, you may need to check:"
echo_info "1. All required files are in the right directories"
echo_info "2. Run 'docker-compose down' before trying again"
echo_info "3. For troubleshooting, use 'docker-compose logs -f'"

exit 0