const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const config = require('./config/app');
const { parseUrl, parseHtmlEndpoint } = require('./routes/api');
const { authenticateToken } = require('./middleware/auth');

const app = express();

// Enable trust proxy - this is required when running behind a reverse proxy like Nginx
app.set('trust proxy', 1);

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
app.listen(config.port, () => {
    console.log(`Server running at http://localhost:${config.port}`);
    console.log('API token authentication is enabled');
    console.log(`API endpoints: /api/parse, /api/parse-html`);
}); 