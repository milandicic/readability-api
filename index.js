const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('./config/app');
const { parseUrl, parseHtmlEndpoint } = require('./routes/api');
const { authenticateToken } = require('./middleware/auth');
const { validateUrlRequest, validateHtmlRequest } = require('./middleware/validation');
const logger = require('./utils/logger');

// Verify API token is configured
if (!config.apiToken) {
    logger.error('API_TOKEN environment variable is not set. Authentication will fail.');
    logger.error('Please set API_TOKEN in your .env file or environment variables.');
}

const app = express();

// Enable trust proxy - this is required when running behind a reverse proxy like Nginx
app.set('trust proxy', 1);

// Add Helmet middleware for security headers
app.use(helmet());

// Enable CORS for all routes
app.use(cors());

// Request logging middleware
app.use((req, res, next) => {
    // Log the incoming request
    logger.info({
        msg: 'Incoming request',
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
    });

    // Track response time
    const start = Date.now();

    // Log when the response is finished
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info({
            msg: 'Request completed',
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
        });
    });

    next();
});

// Rate limiting
const limiter = rateLimit({
    ...config.rateLimit,
    // Add standardized headers as per RFC 6585
    standardHeaders: true,
    // Add custom rate limit information to response
    message: {
        success: false,
        error: 'Too many requests, please try again later'
    }
});
app.use(limiter);

// Middleware
app.use(express.json({ limit: '10mb' })); // Increase limit for HTML content

// Add a simple health check and debug route at the root
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Readability API is running',
        apiEndpoints: ['/api/parse', '/api/parse-html'],
        info: `Request received at ${new Date().toISOString()}`,
        path: req.path,
        baseUrl: req.baseUrl,
        originalUrl: req.originalUrl,
    });
});

// API Documentation
app.get('/api/docs', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Readability API Documentation</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; max-width: 900px; margin: 0 auto; padding: 20px; color: #333; }
            h1, h2, h3 { margin-top: 2em; }
            h1 { border-bottom: 1px solid #eee; padding-bottom: 10px; }
            code, pre { background: #f5f5f5; padding: 0.2em 0.4em; border-radius: 3px; font-family: monospace; }
            pre { padding: 16px; overflow: auto; line-height: 1.45; }
            pre code { background: none; padding: 0; }
            .endpoint { background: #f8f8f8; padding: 15px; border-left: 4px solid #28a745; margin-bottom: 20px; }
            .method { display: inline-block; padding: 4px 8px; background: #28a745; color: white; border-radius: 3px; font-weight: bold; }
            .url { font-family: monospace; margin-left: 10px; }
            table { border-collapse: collapse; width: 100%; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
            th { background-color: #f5f5f5; }
        </style>
    </head>
    <body>
        <h1>Readability API Documentation</h1>
        <p>A standalone API service built on top of Mozilla's Readability.js library that extracts clean, readable content from web pages.</p>
        
        <h2>Authentication</h2>
        <p>All API endpoints require Bearer token authentication. Add the following header to your requests:</p>
        <pre><code>Authorization: Bearer your-secret-token-here</code></pre>
        
        <h2>Endpoints</h2>
        
        <div class="endpoint">
            <div><span class="method">POST</span> <span class="url">/api/parse</span></div>
            <p>Extract readable content from a URL.</p>
            
            <h3>Request Body:</h3>
            <pre><code>{
    "url": "https://example.com/article"
}</code></pre>
            
            <h3>Response:</h3>
            <pre><code>{
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
}</code></pre>
        </div>
        
        <div class="endpoint">
            <div><span class="method">POST</span> <span class="url">/api/parse-html</span></div>
            <p>Parse raw HTML content directly.</p>
            
            <h3>Request Body:</h3>
            <pre><code>{
    "html": "<!DOCTYPE html><html><body>Your HTML content here...</body></html>",
    "url": "https://example.com/article" // Optional: helps with relative URLs
}</code></pre>
            
            <h3>Response:</h3>
            <pre><code>{
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
}</code></pre>
        </div>
        
        <h2>Error Responses</h2>
        <p>The API returns structured error responses:</p>
        <pre><code>{
    "success": false,
    "error": "Error message"
}</code></pre>
        
        <h3>Common Error Status Codes:</h3>
        <table>
            <tr>
                <th>Status Code</th>
                <th>Description</th>
            </tr>
            <tr>
                <td>400</td>
                <td>Bad Request (invalid input)</td>
            </tr>
            <tr>
                <td>401</td>
                <td>Unauthorized (missing token)</td>
            </tr>
            <tr>
                <td>403</td>
                <td>Forbidden (invalid token or restricted URL)</td>
            </tr>
            <tr>
                <td>429</td>
                <td>Too Many Requests (rate limit exceeded)</td>
            </tr>
            <tr>
                <td>500</td>
                <td>Internal Server Error</td>
            </tr>
            <tr>
                <td>504</td>
                <td>Gateway Timeout</td>
            </tr>
        </table>
        
        <h2>Security Notes</h2>
        <p>For security reasons:</p>
        <ul>
            <li>Only HTTP and HTTPS protocols are supported for URLs</li>
            <li>URLs that resolve to private IP ranges are blocked to prevent SSRF attacks</li>
            <li>Requests are subject to rate limiting</li>
            <li>HTML parsing has a timeout of 10 seconds to prevent DoS</li>
            <li>Content returned may contain HTML. Consuming applications should sanitize this content before rendering.</li>
        </ul>
    </body>
    </html>
    `);
});

// Authentication middleware - Apply to API endpoints only, not to root or docs
app.use('/api', authenticateToken);

// API endpoints
app.post('/api/parse', validateUrlRequest, parseUrl);
app.post('/api/parse-html', validateHtmlRequest, parseHtmlEndpoint);

// Add catch-all route for 404s
app.use((req, res) => {
    logger.warn({
        msg: 'Route not found',
        path: req.originalUrl,
        method: req.method,
    });

    res.status(404).json({
        success: false,
        error: `The requested path ${req.originalUrl} was not found`,
    });
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;

    // Log the error
    logger.error({
        msg: 'Server error',
        error: err.message,
        stack: err.stack,
        path: req.originalUrl,
        method: req.method,
    });

    // Don't expose stack traces in production
    const errorResponse = {
        success: false,
        error: err.message || 'An unexpected error occurred',
    };

    if (process.env.NODE_ENV !== 'production' && err.stack) {
        errorResponse.stack = err.stack;
    }

    res.status(statusCode).json(errorResponse);
});

// Start server
const server = app.listen(config.port, () => {
    logger.info(`Server running at http://localhost:${config.port}`);
    logger.info('API token authentication is enabled');
    logger.info(`API endpoints: /api/parse, /api/parse-html`);
});

// Implement graceful shutdown
const gracefulShutdown = (signal) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    server.close(() => {
        logger.info('HTTP server closed.');
        // Add any other cleanup tasks here (e.g., close database connections)
        process.exit(0);
    });

    // Force shutdown after a timeout if connections linger
    setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000); // 10 seconds timeout
};

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (err) => {
    logger.fatal({
        msg: 'Uncaught exception',
        error: err.message,
        stack: err.stack,
    });

    // Exit with error
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.fatal({
        msg: 'Unhandled rejection',
        reason: reason.toString(),
        stack: reason.stack || 'No stack trace available',
    });

    // Exit with error
    process.exit(1);
}); 