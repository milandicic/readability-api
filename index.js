const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const config = require('./config/app');
const { getApiDocs } = require('./docs/api-docs');
const { getWebInterface } = require('./docs/web-interface');
const { parseUrl, parseHtmlEndpoint, legacyParse } = require('./routes/api');
const { authenticateToken } = require('./middleware/auth');

const app = express();

// Enable CORS for all routes
app.use(cors());

// Rate limiting
const limiter = rateLimit(config.rateLimit);
app.use(limiter);

// Middleware
app.use(express.static('public'));
app.use(express.json({ limit: '10mb' })); // Increase limit for HTML content

// Authentication middleware
app.use(authenticateToken);

// Routes
app.get('/api/docs', (req, res) => res.send(getApiDocs()));
app.get('/', (req, res) => res.send(getWebInterface()));

// API endpoints
app.post('/api/parse', parseUrl);
app.post('/api/parse-html', parseHtmlEndpoint);
app.post('/parse', legacyParse); // Legacy endpoint for backward compatibility

// Start server
app.listen(config.port, () => {
    console.log(`Server running at http://localhost:${config.port}`);
    console.log(`API Documentation available at http://localhost:${config.port}/api/docs`);
    console.log('API token authentication is enabled');
}); 