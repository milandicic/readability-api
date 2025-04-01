# Readability API

A standalone API service built on top of Mozilla's Readability.js library that extracts clean, readable content from web pages.

## Features

- Extract readable content from any URL
- Parse raw HTML content directly
- Clean and format article content
- Extract metadata (title, author, date, etc.)
- RESTful API with token authentication
- Rate limiting support
- Cross-origin support (CORS enabled)

## Installation

### Standard Installation

1. Clone the repository:
```bash
git clone <your-repository-url>
cd readability-api
```

2. Install dependencies:
```bash
npm install
```

3. Create environment configuration:
```bash
cp .env.example .env
```

4. Configure your environment variables in `.env`:
```bash
# API Configuration
API_TOKEN=your-secret-token-here
PORT=3000

# Rate Limiting Configuration
RATE_LIMIT_WINDOW_MS=900000 # 15 minutes in milliseconds
RATE_LIMIT_MAX=100 # Max requests per window

# Axios Configuration
AXIOS_TIMEOUT=10000 # Timeout in milliseconds
```

5. Start the server:
```bash
node index.js
```

The server will start at `http://localhost:3000` (or your configured PORT).

### Docker Installation

1. Using docker-compose (recommended):
```bash
# Configure your .env file first
docker-compose up -d
```

2. Using Docker directly:
```bash
docker run -p 3000:3000 \
  -e API_TOKEN=your-secret-token \
  -e PORT=3000 \
  -e RATE_LIMIT_WINDOW_MS=900000 \
  -e RATE_LIMIT_MAX=100 \
  -e AXIOS_TIMEOUT=10000 \
  -d milandicic/readability-api:latest
```

## API Documentation

### Authentication

All API endpoints (except documentation) require Bearer token authentication.

Add the following header to your requests:
```
Authorization: Bearer your-secret-token-here
```

The token should match the `API_TOKEN` environment variable you configured.

### Endpoints

#### API Documentation
Get the API documentation in HTML format.

**Endpoint:** `GET /api/docs`

**Authentication:** Not required

**Response:** HTML documentation

#### 1. Parse URL
Extract readable content from a URL.

**Endpoint:** `POST /api/parse`

**Authentication:** Required

**Request Body:**
```json
{
    "url": "https://example.com/article"
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "title": "Article Title",
        "byline": "Author Name",
        "content": "Article content in HTML format",
        "textContent": "Plain text content",
        "length": 12345,
        "excerpt": "Article excerpt",
        "siteName": "Site Name",
        "lang": "en"
    }
}
```

#### 2. Parse HTML
Parse raw HTML content directly.

**Endpoint:** `POST /api/parse-html`

**Authentication:** Required

**Request Body:**
```json
{
    "html": "<!DOCTYPE html><html><body>Your HTML content here...</body></html>",
    "url": "https://example.com/article" // Optional: helps with relative URLs
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "title": "Article Title",
        "byline": "Author Name",
        "content": "Article content in HTML format",
        "textContent": "Plain text content",
        "length": 12345,
        "excerpt": "Article excerpt",
        "siteName": "Site Name",
        "lang": "en"
    }
}
```

### Error Responses

The API returns structured error responses:

```json
{
    "success": false,
    "error": "Error message"
}
```

Common error status codes:
- 400: Bad Request (invalid input)
- 401: Unauthorized (missing token)
- 403: Forbidden (invalid token)
- 429: Too Many Requests (rate limit exceeded)
- 500: Internal Server Error
- 504: Gateway Timeout

## Usage Examples

### cURL

#### Parse URL:
```bash
curl -X POST \
  -H "Authorization: Bearer your-secret-token-here" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/article"}' \
  http://localhost:3000/api/parse
```

#### Parse HTML:
```bash
curl -X POST \
  -H "Authorization: Bearer your-secret-token-here" \
  -H "Content-Type: application/json" \
  -d '{"html": "<html><body>Content</body></html>", "url": "https://example.com"}' \
  http://localhost:3000/api/parse-html
```

### JavaScript (Node.js)

```javascript
const axios = require('axios');

// Configure API client
const API_URL = 'http://localhost:3000';
const API_TOKEN = 'your-secret-token-here';

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Authorization': `Bearer ${API_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// Parse URL example
async function parseUrl(url) {
  try {
    const response = await client.post('/api/parse', { url });
    return response.data;
  } catch (error) {
    console.error('Error parsing URL:', error.response?.data || error.message);
    throw error;
  }
}

// Parse HTML example
async function parseHtml(html, url) {
  try {
    const response = await client.post('/api/parse-html', { html, url });
    return response.data;
  } catch (error) {
    console.error('Error parsing HTML:', error.response?.data || error.message);
    throw error;
  }
}

// Usage
parseUrl('https://example.com/article')
  .then(result => console.log(result))
  .catch(err => console.error(err));
```

### Python

```python
import requests
import json

API_URL = 'http://localhost:3000'
API_TOKEN = 'your-secret-token-here'

headers = {
    'Authorization': f'Bearer {API_TOKEN}',
    'Content-Type': 'application/json'
}

# Parse URL example
def parse_url(url):
    try:
        response = requests.post(
            f'{API_URL}/api/parse',
            headers=headers,
            json={'url': url}
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error parsing URL: {str(e)}")
        if hasattr(e, 'response') and e.response is not None:
            print(e.response.text)
        raise

# Parse HTML example
def parse_html(html, url=None):
    payload = {'html': html}
    if url:
        payload['url'] = url
        
    try:
        response = requests.post(
            f'{API_URL}/api/parse-html',
            headers=headers,
            json=payload
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error parsing HTML: {str(e)}")
        if hasattr(e, 'response') and e.response is not None:
            print(e.response.text)
        raise

# Usage
result = parse_url('https://example.com/article')
print(json.dumps(result, indent=2))
```

## Configuration Options

| Environment Variable | Description | Default |
|---------------------|-------------|---------|
| API_TOKEN | Authentication token for API access | Required |
| PORT | Server port number | 3000 |
| RATE_LIMIT_WINDOW_MS | Rate limit time window in milliseconds | 900000 (15 minutes) |
| RATE_LIMIT_MAX | Maximum requests per rate limit window | 100 |
| AXIOS_TIMEOUT | HTTP request timeout in milliseconds | 10000 (10 seconds) |

## Advanced Usage

### Running Behind a Reverse Proxy

The API is configured to work seamlessly behind a reverse proxy. The `trust proxy` setting is enabled by default to properly handle client IP addresses for rate limiting.

### Handling Large HTML Content

The API accepts HTML content up to 10MB in size. If you need to process larger files, you can modify the `limit` parameter in the `express.json()` middleware configuration.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Mozilla's Readability.js](https://github.com/mozilla/readability) - The core library for content extraction
- [JSDOM](https://github.com/jsdom/jsdom) - For HTML parsing and DOM manipulation 