const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('./config/app');
const { parseUrl, parseHtmlEndpoint } = require('./routes/api');
const { authenticateToken } = require('./middleware/auth');

// Verify API token is configured
if (!config.apiToken) {
    console.error('ERROR: API_TOKEN environment variable is not set. Authentication will fail.');
    console.error('Please set API_TOKEN in your .env file or environment variables.');
}

const app = express();

// Enable trust proxy - this is required when running behind a reverse proxy like Nginx
app.set('trust proxy', 1);

// Add Helmet middleware for security headers
app.use(helmet());

// Enable CORS for all routes
app.use(cors());

// Rate limiting
const limiter = rateLimit(config.rateLimit);
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
        headers: req.headers
    });
});

// Authentication middleware - Apply to API endpoints only, not to root
app.use('/api', authenticateToken);

// API endpoints
app.post('/api/parse', parseUrl);
app.post('/api/parse-html', parseHtmlEndpoint);

// Add catch-all route for debugging 404s
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `The requested path ${req.originalUrl} was not found`,
        method: req.method,
        path: req.path,
        headers: req.headers
    });
});

// Start server
const server = app.listen(config.port, () => {
    console.log(`Server running at http://localhost:${config.port}`);
    console.log('API token authentication is enabled');
    console.log(`API endpoints: /api/parse, /api/parse-html`);
});

// Implement graceful shutdown
const gracefulShutdown = (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(() => {
        console.log('HTTP server closed.');
        // Add any other cleanup tasks here (e.g., close database connections)
        process.exit(0);
    });

    // Force shutdown after a timeout if connections linger
    setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000); // 10 seconds timeout
};

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT')); 