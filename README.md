# Readability.js API Service

A standalone API service built on top of Mozilla's Readability.js library that extracts clean, readable content from web pages. This service provides both a web interface and REST API endpoints for content extraction.

## Features

- Extract readable content from any URL
- Parse raw HTML content
- Clean and format article content
- Extract metadata (title, author, date, etc.)
- RESTful API with authentication
- Web-based demo interface
- Rate limiting support
- Mobile-responsive output
- Cross-origin support (CORS enabled)

## Installation

1. Clone the repository:
```bash
git clone <your-repository-url>
cd readability
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

## API Documentation

### Authentication

All API endpoints (except the web interface and documentation) require Bearer token authentication.

Add the following header to your requests:
```
Authorization: Bearer your-secret-token-here
```

### Endpoints

#### 1. Parse URL
Extract readable content from a URL.

**Endpoint:** `POST /api/parse`

**Request:**
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

**Request:**
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

### Using cURL

1. Parse URL:
```bash
curl -X POST \
     -H "Authorization: Bearer your-secret-token-here" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://example.com/article"}' \
     http://localhost:3000/api/parse
```

2. Parse HTML:
```bash
curl -X POST \
     -H "Authorization: Bearer your-secret-token-here" \
     -H "Content-Type: application/json" \
     -d '{"html": "<html><body>Content</body></html>"}' \
     http://localhost:3000/api/parse-html
```

### Using JavaScript/Fetch

```javascript
// Parse URL
async function parseUrl(url) {
    const response = await fetch('http://localhost:3000/api/parse', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer your-secret-token-here',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url })
    });
    return await response.json();
}

// Parse HTML
async function parseHtml(html) {
    const response = await fetch('http://localhost:3000/api/parse-html', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer your-secret-token-here',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ html })
    });
    return await response.json();
}
```

## Configuration Options

| Environment Variable | Description | Default |
|---------------------|-------------|---------|
| API_TOKEN | Authentication token for API access | Required |
| PORT | Server port number | 3000 |
| RATE_LIMIT_WINDOW_MS | Rate limiting window in milliseconds | 900000 (15 minutes) |
| RATE_LIMIT_MAX | Maximum requests per window | 100 |
| AXIOS_TIMEOUT | Timeout for URL fetching in milliseconds | 10000 (10 seconds) |

## Web Interface

A web-based demo interface is available at `http://localhost:3000`. This interface allows you to:
- Test URL parsing
- View extracted content
- Preview formatting
- No authentication required

## Development

### Project Structure
```
├── config/         # Configuration files
├── docs/          # Documentation and templates
├── middleware/    # Express middleware
├── routes/        # API routes
├── .env          # Environment configuration
├── .gitignore    # Git ignore rules
├── index.js      # Application entry point
└── package.json  # Project dependencies
```

## License

This project uses Mozilla's Readability.js library, which is licensed under the Apache License 2.0.

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request 